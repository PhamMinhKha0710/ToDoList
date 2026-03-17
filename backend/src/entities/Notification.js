const { Schema, model } = require('mongoose');

const notificationSchema = new Schema(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Loại: 'project_invite' | 'task_assigned' | 'new_comment'
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
    },
    message: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
    // Dữ liệu bổ sung: { projectId, taskId, commentId, ... }
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = model('Notification', notificationSchema);
