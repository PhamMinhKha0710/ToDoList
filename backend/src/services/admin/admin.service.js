class AdminService {
  constructor({ User, Task, Project }) {
    this.User = User;
    this.Task = Task;
    this.Project = Project;
  }

  async getAllUsers() {
    return await this.User.find({}, '-passwordHash -otpCode -otpExpires -__v').lean();
  }

  async setUserActiveStatus(userId, isActive) {
    const user = await this.User.findById(userId);
    if (!user) {
      const ApiError = require('../../utils/ApiError');
      throw new ApiError(404, 'Người dùng không tồn tại');
    }
    user.isActive = isActive;
    await user.save();
    return user;
  }

  async getDashboardTasks() {
    // Return only the fields needed for the dashboard charts to save bandwidth
    return await this.Task.find({}, '_id title status createdAt').lean();
  }

  async getAllProjects() {
    return await this.Project.find({})
      .populate('members.userId', 'email displayName avatarUrl')
      .sort({ createdAt: -1 })
      .lean();
  }

  async createAdminProject(projectData) {
    const { name, description, color, ownerId, imageUrl } = projectData;
    const project = new this.Project({
      name,
      description,
      color,
      imageUrl,
      members: [
        {
          userId: ownerId,
          role: 'owner',
          status: 'active',
        },
      ],
    });
    await project.save();
    return await this.Project.findById(project._id).populate('members.userId', 'email displayName avatarUrl');
  }

  async updateAdminProject(projectId, updateData) {
    const project = await this.Project.findByIdAndUpdate(projectId, updateData, { new: true })
      .populate('members.userId', 'email displayName avatarUrl');
    if (!project) {
      const ApiError = require('../../utils/ApiError');
      throw new ApiError(404, 'Dự án không tồn tại');
    }
    return project;
  }

  async deleteAdminProject(projectId) {
    const project = await this.Project.findByIdAndDelete(projectId);
    if (!project) {
      const ApiError = require('../../utils/ApiError');
      throw new ApiError(404, 'Dự án không tồn tại');
    }
    return project;
  }
}

module.exports = new AdminService({
  User: require('../../entities/User'),
  Task: require('../../entities/Task'),
  Project: require('../../entities/Project'),
});
