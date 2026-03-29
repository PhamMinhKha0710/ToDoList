const User = require('../../entities/User');
const ApiError = require('../../utils/ApiError');
const { toUserResponse } = require('./dtos/userResponse.dto');

// Lấy tất cả user (ẩn thông tin nhạy cảm)
const getAllUsers = async () => {
  const users = await User.find({}, '-passwordHash -otpCode -otpExpires -__v').lean();
  return users;
};

// Đổi trạng thái active của user
const setUserActiveStatus = async (userId, isActive) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Người dùng không tồn tại');
  user.isActive = isActive;
  await user.save();
  return toUserResponse(user);
};

// Tìm kiếm user (loại bỏ user hiện tại)
const searchUsers = async (keyword, currentUserId) => {
  if (!keyword || keyword.trim() === '') {
    return [];
  }
  const regex = new RegExp(keyword, 'i');
  const users = await User.find({
    $and: [
      { _id: { $ne: currentUserId } },
      {
        $or: [
          { email: { $regex: regex } },
          { displayName: { $regex: regex } },
        ],
      },
    ],
  })
    .select('_id email displayName avatarUrl')
    .limit(10)
    .lean();
  return users;
};

module.exports = {
  getAllUsers,
  setUserActiveStatus,
  searchUsers,
};
