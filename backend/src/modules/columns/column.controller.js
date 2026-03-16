const columnService = require('./column.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const { toColumnDTO } = require('./dtos/column.dto');
const { toCreateColumnDTO } = require('./dtos/createColumn.dto');
const { toUpdateColumnDTO } = require('./dtos/updateColumn.dto');

/**
 * POST /api/columns
 */
const createColumn = catchAsync(async (req, res) => {
  const columnData = toCreateColumnDTO(req.body);
  const column = await columnService.createColumn(columnData);
  new ApiResponse(201, 'Tạo cột thành công', { column: toColumnDTO(column) }).send(res);
});

/**
 * GET /api/columns/project/:projectId
 */
const getProjectColumns = catchAsync(async (req, res) => {
  const columns = await columnService.getColumnsByProjectId(req.params.projectId);
  new ApiResponse(200, 'Lấy danh sách cột thành công', { columns: columns.map(toColumnDTO) }).send(res);
});

/**
 * PUT /api/columns/:columnId
 */
const updateColumn = catchAsync(async (req, res) => {
  const updateData = toUpdateColumnDTO(req.body);
  const column = await columnService.updateColumn(req.params.columnId, updateData);
  new ApiResponse(200, 'Cập nhật cột thành công', { column: toColumnDTO(column) }).send(res);
});

/**
 * DELETE /api/columns/:columnId
 */
const deleteColumn = catchAsync(async (req, res) => {
  await columnService.deleteColumn(req.params.columnId);
  new ApiResponse(200, 'Xóa cột thành công').send(res);
});

/**
 * PUT /api/columns/project/:projectId/reorder
 */
const reorderColumns = catchAsync(async (req, res) => {
  const { orderedColumnIds } = req.body;
  const columns = await columnService.reorderColumns(req.params.projectId, orderedColumnIds);
  new ApiResponse(200, 'Sắp xếp lại cột thành công', { columns: columns.map(toColumnDTO) }).send(res);
});

module.exports = {
  createColumn,
  getProjectColumns,
  updateColumn,
  deleteColumn,
  reorderColumns,
};
