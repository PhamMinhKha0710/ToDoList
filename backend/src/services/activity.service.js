class ActivityService {
  constructor({ ActivityLog, emitActivityCreated }) {
    this.ActivityLog = ActivityLog;
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

    this.emitActivityCreated(projectId, populated);

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
  emitActivityCreated: require('../sockets/activity.socket').emitActivityCreated,
});
