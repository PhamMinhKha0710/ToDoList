const projectRepository = require('../repositories/project.repository');
const User = require('../entities/User');
const ApiError = require('../utils/ApiError');

class ProjectService {
  async createProject(userId, projectData) {
    const members = projectData.members || [];
    // Thêm người tạo vào list members với role 'owner'
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
    return projectRepository.create(newProjectData);
  }

  async getUserProjects(userId) {
    return projectRepository.findByUserId(userId);
  }

  async getProjectById(projectId) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Không tìm thấy dự án');
    }
    return project;
  }

  async updateProject(projectId, updateData) {
    const project = await this.getProjectById(projectId);
    return projectRepository.updateById(projectId, updateData);
  }

  async deleteProject(projectId) {
    const project = await this.getProjectById(projectId);
    await projectRepository.deleteById(projectId);
    return null;
  }

  async addMember(projectId, email, role = 'member') {
    const project = await this.getProjectById(projectId);

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      throw new ApiError(404, 'Không tìm thấy người dùng với email này');
    }

    const isMember = project.members.some(
      (m) => m.userId._id.toString() === userToAdd._id.toString()
    );

    if (isMember) {
      throw new ApiError(400, 'Người dùng này đã là thành viên của dự án');
    }

    const memberData = {
      userId: userToAdd._id,
      role,
      status: 'pending',
    };

    return projectRepository.addMember(projectId, memberData);
  }

  async removeMember(projectId, userIdToRemove) {
    const project = await this.getProjectById(projectId);

    const memberToRemove = project.members.find(
      (m) => m.userId._id.toString() === userIdToRemove
    );

    if (!memberToRemove) {
      throw new ApiError(404, 'Thành viên không tồn tại trong dự án');
    }

    if (memberToRemove.role === 'owner') {
      throw new ApiError(400, 'Không thể xóa owner khỏi dự án. Vui lòng chuyển quyền hoặc xóa dự án.');
    }

    return projectRepository.removeMember(projectId, userIdToRemove);
  }

  async updateMemberRole(projectId, userIdToUpdate, newRole) {
    const project = await this.getProjectById(projectId);

    const memberToUpdate = project.members.find(
      (m) => m.userId._id.toString() === userIdToUpdate
    );

    if (!memberToUpdate) {
      throw new ApiError(404, 'Thành viên không tồn tại trong dự án');
    }

    if (memberToUpdate.role === 'owner' && newRole !== 'owner') {
      const ownerCount = project.members.filter((m) => m.role === 'owner').length;
      if (ownerCount <= 1) {
        throw new ApiError(400, 'Dự án phải có ít nhất 1 Owner. Không thể hạ quyền Owner duy nhất.');
      }
    }

    return projectRepository.updateMemberRole(projectId, userIdToUpdate, newRole);
  }

  async getInvitationDetails(projectId, userId) {
    const project = await this.getProjectById(projectId);
    
    const member = project.members.find(
      (m) => m.userId._id.toString() === userId.toString() || m.userId.toString() === userId.toString()
    );

    if (!member) {
      throw new ApiError(403, 'Bạn không được mời tham gia dự án này');
    }

    if (member.status === 'active') {
      throw new ApiError(400, 'Bạn đã là thành viên chính thức của dự án này');
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
      throw new ApiError(403, 'Bạn không được mời tham gia dự án này');
    }

    const member = project.members[memberIndex];

    if (member.status === 'active') {
      throw new ApiError(400, 'Bạn đã là thành viên chính thức của dự án này');
    }

    if (action === 'accept') {
      project.members[memberIndex].status = 'active';
      await project.save();
      return project;
    } else if (action === 'decline') {
      return projectRepository.removeMember(projectId, userId);
    } else {
      throw new ApiError(400, 'Hành động không hợp lệ');
    }
  }
}

module.exports = new ProjectService();
