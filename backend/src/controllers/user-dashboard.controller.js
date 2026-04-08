const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

class UserDashboardController {
  constructor({ userDashboardService }) {
    this.userDashboardService = userDashboardService;
  }

  getDashboardStats = catchAsync(async (req, res) => {
    const stats = await this.userDashboardService.getDashboardStats(req.user._id);
    new ApiResponse(200, 'Lấy thống kê dashboard thành công', stats).send(res);
  });
}

module.exports = UserDashboardController;
