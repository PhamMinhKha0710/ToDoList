const ActivityLog = require('../entities/ActivityLog');
const { emitActivityCreated } = require('../sockets/activity.socket');

class ActivityService {
  /**
   * Tạo log hoạt động mới
   */
  async createActivityLog({ projectId, userId, action, entityType, entityId, detail }) {
    if (!projectId) return null;
    
    const activity = await ActivityLog.create({
      projectId,
      userId,
      action,
      entityType,
      entityId,
      detail: detail ? JSON.stringify(detail) : null,
    });
    
    // Populate user details for frontend rendering
    const populated = await ActivityLog.findById(activity._id).populate('userId', 'displayName email avatarUrl');

    // Realtime socket emit to the project room
    emitActivityCreated(projectId, populated);

    return populated;
  }

  /**
   * Lấy lịch sử log của một dự án
   */
  async getActivitiesByProject(projectId, limit = 50, offset = 0) {
    return await ActivityLog.find({ projectId })
      .populate('userId', 'displayName email avatarUrl')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
  }
  
  /**
   * Lấy lịch sử log của một task cụ thể
   */
  async getActivitiesByTask(taskId, limit = 50, offset = 0) {
    return await ActivityLog.find({ entityType: 'task', entityId: taskId })
      .populate('userId', 'displayName email avatarUrl')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
  }
}

module.exports = new ActivityService();
