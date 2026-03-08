const { Schema, model } = require('mongoose');

// Tags được nhúng trực tiếp trong task — không cần collection riêng
const tagSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: '#cccccc',
    },
  },
  { _id: false }
);

const taskSchema = new Schema(
  {
    columnId: {
      type: Schema.Types.ObjectId,
      ref: 'Column',
      required: true,
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'normal', 'low'],
      default: 'normal',
    },
    dueDate: {
      type: Date,
    },
    color: {
      type: String,
    },
    tags: {
      type: [tagSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = model('Task', taskSchema);
