class ProjectRepository {
  constructor({ Project }) {
    this.Project = Project;
  }

  async create(projectData) {
    const project = new this.Project(projectData);
    await project.save();
    return project;
  }

  async findById(projectId) {
    return this.Project.findById(projectId).populate('members.userId', 'email displayName avatarUrl role');
  }

  async findByUserId(userId) {
    return this.Project.find({ 'members.userId': userId, isActive: { $ne: false } })
      .populate('members.userId', 'email displayName avatarUrl')
      .sort({ updatedAt: -1 });
  }

  async updateById(projectId, updateData) {
    return this.Project.findByIdAndUpdate(projectId, updateData, { new: true })
      .populate('members.userId', 'email displayName avatarUrl role');
  }

  async deleteById(projectId) {
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

  async findByInviteCode(inviteCode) {
    return this.Project.findOne({ inviteCode })
      .populate('members.userId', 'email displayName avatarUrl role');
  }
}

module.exports = ProjectRepository;
