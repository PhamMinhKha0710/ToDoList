const crypto = require('crypto');

class ProjectService {
  constructor({ projectRepository, User, ApiError, notificationService, getIO }) {
    this.projectRepository = projectRepository;
    this.User = User;
    this.ApiError = ApiError;
    this.notificationService = notificationService;
    this.getIO = getIO;
  }

  _notifyOwnerOnResponse(project, userId, action) {
    return (async () => {
      const owner = project.members.find(m => m.role === 'owner');
      if (!owner) return;

      const ownerId = owner.userId._id || owner.userId;
      if (ownerId.toString() === userId.toString()) return;

      const respondingUser = await this.User.findById(userId).select('displayName email').lean();
      const userName = respondingUser?.displayName || respondingUser?.email || 'Một người dùng';

      const isAccept = action === 'accept';
      await this.notificationService.createNotification({
        recipientId: ownerId,
        type: isAccept ? 'member_joined' : 'member_declined',
        title: isAccept ? 'Thành viên mới' : 'Từ chối lời mời',
        message: isAccept
          ? `${userName} đã chấp nhận lời mời vào dự án "${project.name}"`
          : `${userName} đã từ chối lời mời vào dự án "${project.name}"`,
        metadata: { projectId: project._id, projectName: project.name },
      });
    })();
  }

  _emitMemberUpdated(projectId) {
    try {
      this.getIO().to(projectId.toString()).emit('project:member_updated', { projectId: projectId.toString() });
    } catch (error) {
      console.error('[Socket] Failed to emit project:member_updated', error);
    }
  }

  async createProject(userId, projectData) {
    const members = projectData.members || [];
    const existingOwnerIndex = members.findIndex(m => m.userId.toString() === userId.toString());
    if (existingOwnerIndex === -1) {
      members.push({ userId, role: 'owner', status: 'active' });
    } else {
      members[existingOwnerIndex].role = 'owner';
      members[existingOwnerIndex].status = 'active';
    }

    const newProjectData = {
      ...projectData,
      members,
    };
    return this.projectRepository.create(newProjectData);
  }

  async getUserProjects(userId) {
    return this.projectRepository.findByUserId(userId);
  }

  async getProjectById(projectId) {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new this.ApiError(404, 'Không tìm thấy dự án');
    }
    return project;
  }

  async updateProject(projectId, updateData) {
    const project = await this.getProjectById(projectId);
    return this.projectRepository.updateById(projectId, updateData);
  }

  async deleteProject(projectId) {
    const project = await this.getProjectById(projectId);
    await this.projectRepository.deleteById(projectId);
    return null;
  }

  async addMember(projectId, email, role = 'member') {
    const project = await this.getProjectById(projectId);

    const userToAdd = await this.User.findOne({ email });
    if (!userToAdd) {
      throw new this.ApiError(404, 'Không tìm thấy người dùng với email này');
    }

    const isMember = project.members.some(
      (m) => m.userId._id.toString() === userToAdd._id.toString()
    );

    if (isMember) {
      throw new this.ApiError(400, 'Người dùng này đã là thành viên của dự án');
    }

    const memberData = {
      userId: userToAdd._id,
      role,
      status: 'pending',
    };

    const result = await this.projectRepository.addMember(projectId, memberData);

    await this.notificationService.createNotification({
      recipientId: userToAdd._id,
      type: 'project_invite',
      title: 'Lời mời vào dự án',
      message: `Bạn được mời tham gia vào dự án "${project.name}"`,
      metadata: { projectId: project._id, projectName: project.name }
    });

    this._emitMemberUpdated(projectId);

    return result;
  }

  async removeMember(projectId, userIdToRemove) {
    const project = await this.getProjectById(projectId);

    const memberToRemove = project.members.find(
      (m) => m.userId._id.toString() === userIdToRemove
    );

    if (!memberToRemove) {
      throw new this.ApiError(404, 'Thành viên không tồn tại trong dự án');
    }

    if (memberToRemove.role === 'owner') {
      throw new this.ApiError(400, 'Không thể xóa owner khỏi dự án. Vui lòng chuyển quyền hoặc xóa dự án.');
    }

    const result = await this.projectRepository.removeMember(projectId, userIdToRemove);
    this._emitMemberUpdated(projectId);
    return result;
  }

  async updateMemberRole(projectId, userIdToUpdate, newRole) {
    const project = await this.getProjectById(projectId);

    const memberToUpdate = project.members.find(
      (m) => m.userId._id.toString() === userIdToUpdate
    );

    if (!memberToUpdate) {
      throw new this.ApiError(404, 'Thành viên không tồn tại trong dự án');
    }

    if (memberToUpdate.role === 'owner' && newRole !== 'owner') {
      const ownerCount = project.members.filter((m) => m.role === 'owner').length;
      if (ownerCount <= 1) {
        throw new this.ApiError(400, 'Dự án phải có ít nhất 1 Owner. Không thể hạ quyền Owner duy nhất.');
      }
    }

    const result = await this.projectRepository.updateMemberRole(projectId, userIdToUpdate, newRole);
    this._emitMemberUpdated(projectId);
    return result;
  }

  async getInvitationDetails(projectId, userId) {
    const project = await this.getProjectById(projectId);

    const member = project.members.find(
      (m) => m.userId._id.toString() === userId.toString() || m.userId.toString() === userId.toString()
    );

    if (!member) {
      throw new this.ApiError(403, 'Bạn không được mời tham gia dự án này');
    }

    if (member.status === 'active') {
      throw new this.ApiError(400, 'Bạn đã là thành viên chính thức của dự án này');
    }

    const owner = project.members.find(m => m.role === 'owner')?.userId;
    const activeMembersCount = project.members.filter(m => m.status === 'active').length;

    return {
      _id: project._id,
      name: project.name,
      description: project.description,
      imageUrl: project.imageUrl,
      color: project.color,
      owner: owner ? {
        _id: owner._id,
        displayName: owner.displayName,
        email: owner.email,
        avatarUrl: owner.avatarUrl
      } : null,
      memberCount: activeMembersCount,
    };
  }

  async respondToInvitation(projectId, userId, action) {
    const project = await this.getProjectById(projectId);

    const memberIndex = project.members.findIndex(
      (m) => m.userId._id.toString() === userId.toString() || m.userId.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      throw new this.ApiError(403, 'Bạn không được mời tham gia dự án này');
    }

    const member = project.members[memberIndex];

    if (member.status === 'active') {
      throw new this.ApiError(400, 'Bạn đã là thành viên chính thức của dự án này');
    }

    if (action === 'accept') {
      project.members[memberIndex].status = 'active';
      await project.save();
      this._emitMemberUpdated(projectId);
      await this._notifyOwnerOnResponse(project, userId, 'accept');
      return project;
    } else if (action === 'decline') {
      await this._notifyOwnerOnResponse(project, userId, 'decline');
      const result = await this.projectRepository.removeMember(projectId, userId);
      this._emitMemberUpdated(projectId);
      return result;
    } else {
      throw new this.ApiError(400, 'Hành động không hợp lệ');
    }
  }

  async getInviteCode(projectId) {
    let project = await this.getProjectById(projectId);
    if (!project.inviteCode) {
      project.inviteCode = crypto.randomBytes(5).toString('hex'); // 10 characters
      await project.save();
    }
    return project.inviteCode;
  }

  async regenerateInviteCode(projectId) {
    const project = await this.getProjectById(projectId);
    project.inviteCode = crypto.randomBytes(5).toString('hex');
    await project.save();
    return project.inviteCode;
  }

  async getProjectByInviteCode(inviteCode) {
    const project = await this.projectRepository.findByInviteCode(inviteCode);
    if (!project) {
      throw new this.ApiError(404, 'Mã mời không lệ hoặc đã hết hạn');
    }

    const owner = project.members.find(m => m.role === 'owner')?.userId;
    const activeMembersCount = project.members.filter(m => m.status === 'active').length;

    return {
      _id: project._id,
      name: project.name,
      description: project.description,
      imageUrl: project.imageUrl,
      color: project.color,
      owner: owner ? {
        _id: owner._id,
        displayName: owner.displayName,
        email: owner.email,
        avatarUrl: owner.avatarUrl
      } : null,
      memberCount: activeMembersCount,
    };
  }

  async joinByInviteCode(inviteCode, userId) {
    const project = await this.projectRepository.findByInviteCode(inviteCode);
    if (!project) {
      throw new this.ApiError(404, 'Mã mời không lệ hoặc đã hết hạn');
    }

    const isMember = project.members.some(
      (m) => m.userId._id.toString() === userId.toString() || m.userId.toString() === userId.toString()
    );

    if (isMember) {
      // Find the member to check status
      const existingMember = project.members.find(
        (m) => m.userId._id.toString() === userId.toString() || m.userId.toString() === userId.toString()
      );
      
      if (existingMember.status === 'active') {
        return project;
      }

      // If pending, activate it
      existingMember.status = 'active';
      await project.save();
      this._emitMemberUpdated(project._id);
      return project;
    }

    const memberData = {
      userId: userId,
      role: 'member',
      status: 'active',
    };

    const result = await this.projectRepository.addMember(project._id, memberData);
    this._emitMemberUpdated(project._id);
    await this._notifyOwnerOnResponse(project, userId, 'accept');

    return result;
  }
}

module.exports = new ProjectService({
  projectRepository: require('../repositories/project.repository'),
  User: require('../entities/User'),
  ApiError: require('../utils/ApiError'),
  notificationService: require('./notification.service'),
  getIO: require('../config/socket').getIO,
});
