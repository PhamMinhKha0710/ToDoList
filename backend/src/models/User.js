const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    displayName: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
