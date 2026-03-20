const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  otp: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    enum: ['CHANGE_PASSWORD', 'UPDATE_EMAIL'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Document automatically deleted after 300 seconds (5 phút)
  }
});

module.exports = mongoose.model('Otp', otpSchema);
