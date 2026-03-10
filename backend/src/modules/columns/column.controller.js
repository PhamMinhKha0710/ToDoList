const columnService = require('./column.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/v1/columns
 */
const createColumn = catchAsync(async (req, res) => {
  const column = await columnService.createColumn(req.body);
  new ApiResponse(201, 'Tạo cột thành công', { column }).send(res);
});

/**
 * PUT /api/v1/columns/:columnId
 */
const updateColumn = catchAsync(async (req, res) => {
  const column = await columnService.updateColumn(req.params.columnId, req.body);
  new ApiResponse(200, 'Cập nhật cột thành công', { column }).send(res);
});

/**
 * DELETE /api/v1/columns/:columnId
 */
const deleteColumn = catchAsync(async (req, res) => {
  await columnService.deleteColumn(req.params.columnId);
  new ApiResponse(200, 'Xóa cột thành công').send(res);
});

module.exports = {
  createColumn,
  updateColumn,
  deleteColumn,
};
