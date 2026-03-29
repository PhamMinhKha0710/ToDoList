/**
 * userResponse DTO
 * Loại bỏ các field nhạy cảm trước khi trả về client
 * @param {Object} user - Mongoose User document hoặc plain object
 * @returns {Object} safe user object
 */
const toUserResponse = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.otpCode;
  delete obj.otpExpires;
  delete obj.__v;
  return obj;
};

module.exports = { toUserResponse };
