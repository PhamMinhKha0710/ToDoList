const { Schema, model } = require('mongoose');

// SubTask nhúng trong PersonalTask
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

const personalTaskSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'normal', 'low'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
    },
    color: {
      type: String,
    },
    subTasks: {
      type: [subTaskSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = model('PersonalTask', personalTaskSchema);
