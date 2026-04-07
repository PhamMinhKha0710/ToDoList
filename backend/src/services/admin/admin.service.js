const eventBus = require('../../utils/eventBus');

class AdminService {
  constructor({ User, Task, Project, ApiError, authService }) {
    this.User = User;
    this.Task = Task;
    this.Project = Project;
    this.ApiError = ApiError;
    this.authService = authService;
  }

  async getAllUsers({ page = 1, limit = 10, search = '' } = {}) {
    const filter = { role: { $ne: 'admin' } };
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.User.find(filter, '-passwordHash -otpCode -otpExpires -__v')
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.User.countDocuments(filter),
    ]);

    return {
      users,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    };
  }

  async updateUserRole(userId, role) {
    const user = await this.User.findById(userId);
    if (!user) throw new this.ApiError(404, 'Người dùng không tồn tại');
    user.role = role;
    await user.save();
    return user;
  }

  async resetUserPassword(userId) {
    const user = await this.User.findById(userId);
    if (!user) throw new this.ApiError(404, 'Người dùng không tồn tại');
    await this.authService.forgotPassword({ email: user.email });
    return true;
  }

  async setUserActiveStatus(userId, isActive) {
    const user = await this.User.findById(userId);
    if (!user) throw new this.ApiError(404, 'Người dùng không tồn tại');
    user.isActive = isActive;
    await user.save();

    if (isActive === false) {
      eventBus.emitAsync('admin.user.locked', { userId });
    }

    return user;
  }

  async getDashboardStats() {
    const [tasks, users] = await Promise.all([
      this.Task.find({}, '_id title status createdAt').lean(),
      this.User.find({ role: 'user' }, '_id createdAt').lean(),
    ]);
    return { tasks, users };
  }

  async getAllProjects() {
    return await this.Project.find({})
      .populate('members.userId', 'email displayName avatarUrl')
      .sort({ createdAt: -1 }).lean();
  }

  async createAdminProject(projectData) {
    const { name, description, color, ownerId, imageUrl } = projectData;
    const project = new this.Project({
      name, description, color, imageUrl,
      members: [{ userId: ownerId, role: 'owner', status: 'active' }],
    });
    await project.save();
    const populated = await this.Project.findById(project._id).populate('members.userId', 'email displayName avatarUrl');

    eventBus.emitAsync('admin.project.created', { project: populated });

    return populated;
  }

  async updateAdminProject(projectId, updateData) {
    const project = await this.Project.findByIdAndUpdate(projectId, updateData, { new: true })
      .populate('members.userId', 'email displayName avatarUrl');
    if (!project) throw new this.ApiError(404, 'Dự án không tồn tại');

    eventBus.emitAsync('admin.project.updated', {
      project,
      isDeactivated: updateData.isActive === false,
    });

    return project;
  }

  async deleteAdminProject(projectId) {
    const project = await this.Project.findById(projectId)
      .populate('members.userId', 'email displayName avatarUrl');
    if (!project) throw new this.ApiError(404, 'Dự án không tồn tại');

    eventBus.emitAsync('admin.project.deleted', { project, projectId });

    await this.Project.findByIdAndDelete(projectId);
    return project;
  }
}

module.exports = AdminService;
