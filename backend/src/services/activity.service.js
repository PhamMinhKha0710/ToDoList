class ActivityService {
  constructor({ ActivityLog, Project, emitActivityCreated }) {
    this.ActivityLog = ActivityLog;
    this.Project = Project;
    this.emitActivityCreated = emitActivityCreated;
  }

  async createActivityLog({ projectId, userId, action, entityType, entityId, detail }) {
    if (!projectId) return null;

    const activity = await this.ActivityLog.create({
      projectId,
      userId,
      action,
      entityType,
      entityId,
      detail: detail ? JSON.stringify(detail) : null,
    });

    const populated = await this.ActivityLog.findById(activity._id).populate('userId', 'displayName email avatarUrl');

    // Emit to project room
    this.emitActivityCreated(projectId, populated);

    // Emit to each member's personal room for dashboard update
    try {
      const project = await this.Project.findById(projectId).select('members').lean();
      if (project && project.members) {
        project.members.forEach(member => {
          if (member.status === 'active') {
             const userRoom = `user:${member.userId}`;
             // Notify specific activity (for activity feed)
             this.emitActivityCreated(userRoom, populated);
             // Notify dashboard stats refresh
             getIO().to(userRoom).emit('dashboard:updated');
          }
        });
      }
    } catch (err) {
      console.error('[ActivityService] Dashboard real-time emit failed:', err);
    }

    return populated;
  }

  async getActivitiesByProject(projectId, limit = 50, offset = 0) {
    return await this.ActivityLog.find({ projectId })
      .populate('userId', 'displayName email avatarUrl')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
  }

  async getActivitiesByTask(taskId, limit = 50, offset = 0) {
    return await this.ActivityLog.find({ entityType: 'task', entityId: taskId })
      .populate('userId', 'displayName email avatarUrl')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
  }
}

module.exports = new ActivityService({
  ActivityLog: require('../entities/ActivityLog'),
  Project: require('../entities/Project'),
  emitActivityCreated: require('../sockets/activity.socket').emitActivityCreated,
});
