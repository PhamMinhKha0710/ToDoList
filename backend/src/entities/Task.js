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

// SubTask nhúng trong Task
const subTaskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['todo', 'done'],
      default: 'todo',
    },
    color: {
      type: String,
    },
    position: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const taskSchema = new Schema(
  {
    columnId: {
      type: Schema.Types.ObjectId,
      ref: 'Column',
      required: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignees: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
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
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    color: {
      type: String,
    },
    tags: {
      type: [tagSchema],
      default: [],
    },
    subTasks: {
      type: [subTaskSchema],
      default: [],
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = model('Task', taskSchema);
