const projectRepository = require('./project.repository');
const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');

class ProjectService {
  async createProject(userId, projectData) {
    const members = projectData.members || [];
    // Thêm người tạo vào list members với role 'owner'
    // Lưu ý: Đảm bảo không bị trùng ID nếu frontend có lỡ gửi lên (hiếm)
    const existingOwnerIndex = members.findIndex(m => m.userId.toString() === userId.toString());
    if (existingOwnerIndex === -1) {
      members.push({ userId, role: 'owner' });
    } else {
      members[existingOwnerIndex].role = 'owner';
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
    return null; // Return nothing on delete
  }

  async addMember(projectId, email) {
    const project = await this.getProjectById(projectId);

    // Tìm user theo email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      throw new ApiError(404, 'Không tìm thấy người dùng với email này');
    }

    // Kiểm tra xem user này đã là thành viên chưa
    const isMember = project.members.some(
      (m) => m.userId._id.toString() === userToAdd._id.toString()
    );

    if (isMember) {
      throw new ApiError(400, 'Người dùng này đã là thành viên của dự án');
    }

    const memberData = {
      userId: userToAdd._id,
      role: 'member',
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
}

module.exports = new ProjectService();
