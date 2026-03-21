const userService = require('./user.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

const getAllUsers = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers();
  new ApiResponse(200, 'Danh sách user', users).send(res);
});

const setActive = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive phải là boolean');
  }

  const user = await userService.setUserActiveStatus(id, isActive);
  new ApiResponse(200, 'Cập nhật trạng thái user thành công', user).send(res);
});

module.exports = { getAllUsers, setActive };
