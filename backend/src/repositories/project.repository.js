class ProjectRepository {
  constructor({ Project, Column, Task }) {
    this.Project = Project;
    this.Column = Column;
    this.Task = Task;
  }

  async createProject(projectData) {
    const project = new this.Project(projectData);
    await project.save();
    return project;
  }

  async getProjectById(projectId) {
    return this.Project.findById(projectId).populate('members.userId', 'email displayName avatarUrl role');
  }

  async getProjectsByUserId(userId) {
    return this.Project.find({ 'members.userId': userId, isActive: { $ne: false } })
      .populate('members.userId', 'email displayName avatarUrl')
      .sort({ updatedAt: -1 });
  }

  async updateProject(projectId, updateData) {
    return this.Project.findByIdAndUpdate(projectId, updateData, { new: true })
      .populate('members.userId', 'email displayName avatarUrl role');
  }

  async deleteProject(projectId) {
    return this.Project.findByIdAndDelete(projectId);
  }

  async addMember(projectId, memberData) {
    return this.Project.findByIdAndUpdate(
      projectId,
      { $push: { members: memberData } },
      { new: true }
    ).populate('members.userId', 'email displayName avatarUrl role');
  }

  async removeMember(projectId, userId) {
    return this.Project.findByIdAndUpdate(
      projectId,
      { $pull: { members: { userId } } },
      { new: true }
    ).populate('members.userId', 'email displayName avatarUrl role');
  }

  async updateMemberRole(projectId, userId, role) {
    return this.Project.findOneAndUpdate(
      { _id: projectId, 'members.userId': userId },
      { $set: { 'members.$.role': role } },
      { new: true }
    ).populate('members.userId', 'email displayName avatarUrl role');
  }

  async getProjectByInviteCode(inviteCode) {
    return this.Project.findOne({ inviteCode })
      .populate('members.userId', 'email displayName avatarUrl role');
  }

  async getProjectStats(projectId) {
    const columns = await this.Column.find({ projectId });
    const columnIds = columns.map(c => c._id);
    const tasks = await this.Task.find({ columnId: { $in: columnIds } });

    const project = await this.Project.findById(projectId);
    const membersCount = project ? project.members.length : 0;

    return {
      totalTasks: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      membersCount,
    };
  }
}

module.exports = ProjectRepository;
