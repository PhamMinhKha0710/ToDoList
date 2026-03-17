const { Schema, model } = require('mongoose');

const attachmentSchema = new Schema(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
  },
  // Chỉ cần createdAt, không cần updatedAt
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = model('Attachment', attachmentSchema);
