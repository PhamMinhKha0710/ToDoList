const { Schema, model } = require('mongoose');

const activityLogSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    // null nếu user đã bị xóa
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Ví dụ: 'TASK_CREATED', 'TASK_UPDATED', 'COLUMN_DELETED', 'MEMBER_INVITED'
    action: {
      type: String,
      required: true,
    },
    // Loại đối tượng: 'task', 'column', 'member', ...
    entityType: {
      type: String,
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    // Chi tiết thay đổi lưu dưới dạng JSON string
    detail: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = model('ActivityLog', activityLogSchema);
