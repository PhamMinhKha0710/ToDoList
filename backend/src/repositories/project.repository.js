const Project = require('../entities/Project');

class ProjectRepository {
  async create(projectData) {
    const project = new Project(projectData);
    await project.save();
    return project;
  }

  async findById(projectId) {
    return Project.findById(projectId).populate('members.userId', 'email displayName avatarUrl role');
  }

  async findByUserId(userId) {
    return Project.find({ 'members.userId': userId })
      .populate('members.userId', 'email displayName avatarUrl')
      .sort({ updatedAt: -1 });
  }

  async updateById(projectId, updateData) {
    return Project.findByIdAndUpdate(projectId, updateData, { new: true })
      .populate('members.userId', 'email displayName avatarUrl role');
  }

  async deleteById(projectId) {
    return Project.findByIdAndDelete(projectId);
  }

  async addMember(projectId, memberData) {
    return Project.findByIdAndUpdate(
      projectId,
      { $push: { members: memberData } },
      { new: true }
    ).populate('members.userId', 'email displayName avatarUrl role');
  }

  async removeMember(projectId, userId) {
    return Project.findByIdAndUpdate(
      projectId,
      { $pull: { members: { userId } } },
      { new: true }
    ).populate('members.userId', 'email displayName avatarUrl role');
  }

  async updateMemberRole(projectId, userId, role) {
    return Project.findOneAndUpdate(
      { _id: projectId, 'members.userId': userId },
      { $set: { 'members.$.role': role } },
      { new: true }
    ).populate('members.userId', 'email displayName avatarUrl role');
  }
}

module.exports = new ProjectRepository();
