const { Schema, model } = require('mongoose');

const memberSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'member'],
      default: 'member',
    },
  },
  { _id: false }
);

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      default: '#3b82f6', // Default blue color
    },
    description: {
      type: String,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
    columnOrder: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Column',
      },
    ],
  },
  { timestamps: true }
);

module.exports = model('Project', projectSchema);
