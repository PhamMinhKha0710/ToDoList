const userService = require('./user.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * GET /api/v1/users/search?q=keyword
 */
const searchUsers = catchAsync(async (req, res) => {
  const { q } = req.query;
  const currentUserId = req.user._id;

  const users = await userService.searchUsers(q, currentUserId);
  new ApiResponse(200, 'Tìm kiếm thành công', { users }).send(res);
});

module.exports = {
  searchUsers,
};
