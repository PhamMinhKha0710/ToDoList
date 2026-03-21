const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');
const { toUserResponse } = require('./dtos/userResponse.dto');

const getAllUsers = async () => {
  const users = await User.find({}, '-passwordHash -otpCode -otpExpires -__v').lean();
  return users;
};

const setUserActiveStatus = async (userId, isActive) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Người dùng không tồn tại');

  user.isActive = isActive;
  await user.save();

  return toUserResponse(user);
};

module.exports = {
  getAllUsers,
  setUserActiveStatus,
};
