const eventBus = require('../utils/eventBus');

class ProjectService {
  constructor({ projectRepository, User, ApiError }) {
    this.projectRepository = projectRepository;
    this.User = User;
    this.ApiError = ApiError;
  }

  async getUserProjects(userId) {
    return await this.projectRepository.getProjectsByUserId(userId);
  }

  async createProject(projectData, userId) {
    const members = [{ userId, role: 'owner', status: 'active' }];

    if (projectData.members && Array.isArray(projectData.members)) {
      for (const m of projectData.members) {
        if (m.userId !== userId.toString()) {
          members.push({ userId: m.userId, role: m.role || 'member', status: 'pending' });
        }
      }
    }

    const project = await this.projectRepository.createProject({
      ...projectData,
      members,
    });

    const populated = await this.projectRepository.getProjectById(project._id);

    eventBus.emitAsync('project.created', {
      project: populated,
      userId,
    });

    return populated;
  }

  async getProjectById(projectId) {
    const project = await this.projectRepository.getProjectById(projectId);
    if (!project) throw new this.ApiError(404, 'Không tìm thấy dự án');
    return project;
  }

  async updateProject(projectId, updateData) {
    const project = await this.projectRepository.updateProject(projectId, updateData);
    if (!project) throw new this.ApiError(404, 'Không tìm thấy dự án');

    eventBus.emitAsync('project.updated', { project });

    return project;
  }

  async deleteProject(projectId, userId) {
    const project = await this.projectRepository.getProjectById(projectId);
    if (!project) throw new this.ApiError(404, 'Không tìm thấy dự án');

    await this.projectRepository.deleteProject(projectId);

    eventBus.emitAsync('project.deleted', { projectId, project, userId });
  }

  async addMember(projectId, email, role, inviterId) {
    const user = await this.User.findOne({ email: email.toLowerCase() });
    if (!user) throw new this.ApiError(404, 'Không tìm thấy người dùng với email này');

    const project = await this.projectRepository.getProjectById(projectId);
    if (!project) throw new this.ApiError(404, 'Không tìm thấy dự án');

    const existing = project.members.find((m) => {
      const mUserId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
      return mUserId === user._id.toString();
    });

    if (existing) {
      if (existing.status === 'active') {
        throw new this.ApiError(409, 'Người dùng đã là thành viên dự án');
      }
      throw new this.ApiError(409, 'Người dùng đã được mời và đang chờ phản hồi');
    }

    project.members.push({
      userId: user._id,
      role: role || 'member',
      status: 'pending',
    });
    await project.save();

    const populated = await this.projectRepository.getProjectById(projectId);

    eventBus.emitAsync('member.invited', {
      project: populated,
      invitedUser: user,
      inviterId,
      role: role || 'member',
    });

    return populated;
  }

  async removeMember(projectId, memberId, removerId) {
    const project = await this.projectRepository.getProjectById(projectId);
    if (!project) throw new this.ApiError(404, 'Không tìm thấy dự án');

    const memberIndex = project.members.findIndex((m) => {
      const mUserId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
      return mUserId === memberId;
    });

    if (memberIndex === -1) throw new this.ApiError(404, 'Thành viên không tồn tại trong dự án');

    const removedMember = project.members[memberIndex];
    if (removedMember.role === 'owner') {
      throw new this.ApiError(403, 'Không thể xóa chủ sở hữu dự án');
    }

    project.members.splice(memberIndex, 1);
    await project.save();

    const populated = await this.projectRepository.getProjectById(projectId);

    eventBus.emitAsync('member.removed', {
      project: populated,
      memberId,
      removerId,
    });

    return populated;
  }

  async updateMemberRole(projectId, memberId, newRole, updaterId) {
    const project = await this.projectRepository.getProjectById(projectId);
    if (!project) throw new this.ApiError(404, 'Không tìm thấy dự án');

    const member = project.members.find((m) => {
      const mUserId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
      return mUserId === memberId;
    });

    if (!member) throw new this.ApiError(404, 'Thành viên không tồn tại trong dự án');

    const oldRole = member.role;
    member.role = newRole;
    await project.save();

    const populated = await this.projectRepository.getProjectById(projectId);

    eventBus.emitAsync('member.roleUpdated', {
      project: populated,
      memberId,
      oldRole,
      newRole,
      updaterId,
    });

    return populated;
  }

  async getInvitationDetails(projectId) {
    const project = await this.projectRepository.getProjectById(projectId);
    if (!project) throw new this.ApiError(404, 'Không tìm thấy dự án');
    return project;
  }

  async respondToInvitation(projectId, userId, action) {
    const project = await this.projectRepository.getProjectById(projectId);
    if (!project) throw new this.ApiError(404, 'Không tìm thấy dự án');

    const member = project.members.find((m) => {
      const mUserId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
      return mUserId === userId.toString();
    });

    if (!member) throw new this.ApiError(404, 'Bạn không có lời mời tham gia dự án này');
    if (member.status === 'active') throw new this.ApiError(400, 'Bạn đã là thành viên dự án');

    if (action === 'accept') {
      member.status = 'active';
      await project.save();
    } else if (action === 'decline') {
      project.members = project.members.filter((m) => {
        const mUserId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
        return mUserId !== userId.toString();
      });
      await project.save();
    }

    const populated = await this.projectRepository.getProjectById(projectId);

    eventBus.emitAsync('invitation.responded', {
      project: populated,
      userId,
      action,
    });

    return populated;
  }

  // ─── Invite Code ────────────────────────────────────────────────────────────

  async getInviteCode(projectId) {
    const project = await this.projectRepository.getProjectById(projectId);
    if (!project) throw new this.ApiError(404, 'Không tìm thấy dự án');

    if (!project.inviteCode || (project.inviteCodeExpiresAt && project.inviteCodeExpiresAt < new Date())) {
      return await this._generateInviteCode(project);
    }

    return {
      inviteCode: project.inviteCode,
      expiresAt: project.inviteCodeExpiresAt,
    };
  }

  async regenerateInviteCode(projectId) {
    const project = await this.projectRepository.getProjectById(projectId);
    if (!project) throw new this.ApiError(404, 'Không tìm thấy dự án');
    return await this._generateInviteCode(project);
  }

  async deleteInviteCode(projectId) {
    const project = await this.projectRepository.getProjectById(projectId);
    if (!project) throw new this.ApiError(404, 'Không tìm thấy dự án');
    project.inviteCode = undefined;
    project.inviteCodeExpiresAt = undefined;
    await project.save();
  }

  async getProjectByInviteCode(inviteCode) {
    const project = await this.projectRepository.getProjectByInviteCode(inviteCode);
    if (!project) throw new this.ApiError(404, 'Mã mời không hợp lệ hoặc đã hết hạn');
    if (project.inviteCodeExpiresAt && project.inviteCodeExpiresAt < new Date()) {
      throw new this.ApiError(400, 'Mã mời đã hết hạn');
    }
    return project;
  }

  async joinByInviteCode(inviteCode, userId) {
    const project = await this.projectRepository.getProjectByInviteCode(inviteCode);
    if (!project) throw new this.ApiError(404, 'Mã mời không hợp lệ hoặc đã hết hạn');
    if (project.inviteCodeExpiresAt && project.inviteCodeExpiresAt < new Date()) {
      throw new this.ApiError(400, 'Mã mời đã hết hạn');
    }

    const existing = project.members.find((m) => {
      const mUserId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
      return mUserId === userId.toString();
    });

    if (existing && existing.status === 'active') {
      throw new this.ApiError(409, 'Bạn đã là thành viên dự án');
    }

    if (existing && existing.status === 'pending') {
      existing.status = 'active';
    } else {
      project.members.push({ userId, role: 'member', status: 'active' });
    }
    await project.save();

    const populated = await this.projectRepository.getProjectById(project._id);

    eventBus.emitAsync('member.joined', {
      project: populated,
      userId,
    });

    return populated;
  }

  async getProjectStats(projectId) {
    return await this.projectRepository.getProjectStats(projectId);
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  async _generateInviteCode(project) {
    const crypto = require('crypto');
    const inviteCode = crypto.randomBytes(6).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    project.inviteCode = inviteCode;
    project.inviteCodeExpiresAt = expiresAt;
    await project.save();

    return { inviteCode, expiresAt };
  }
}

module.exports = ProjectService;
