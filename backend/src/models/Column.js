const { Schema, model } = require('mongoose');

const columnSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: '#0733fa',
    },
    taskOrder: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
  },
  { timestamps: true }
);

module.exports = model('Column', columnSchema);
