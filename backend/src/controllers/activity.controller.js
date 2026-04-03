const activityService = require('../services/activity.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

class ActivityController {
  /**
   * GET /api/activities/project/:projectId
   */
  getProjectActivities = catchAsync(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    
    const activities = await activityService.getActivitiesByProject(req.params.projectId, limit, offset);
    new ApiResponse(200, 'Lấy lịch sử dự án thành công', { activities }).send(res);
  });

  /**
   * GET /api/activities/task/:taskId
   */
  getTaskActivities = catchAsync(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    
    const activities = await activityService.getActivitiesByTask(req.params.taskId, limit, offset);
    new ApiResponse(200, 'Lấy lịch sử tác vụ thành công', { activities }).send(res);
  });
}

module.exports = new ActivityController();
