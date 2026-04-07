const userDashboardService = require('../services/user-dashboard.service');
const catchAsync = require('../utils/catchAsync');

const getDashboardStats = catchAsync(async (req, res) => {
  const stats = await userDashboardService.getDashboardStats(req.user._id);
  res.json({
    success: true,
    data: stats
  });
});

module.exports = {
  getDashboardStats
};
