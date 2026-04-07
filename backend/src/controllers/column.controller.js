const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { toColumnModel } = require('../models/columns/column.model');
const { toCreateColumnModel } = require('../models/columns/createColumn.model');
const { toUpdateColumnModel } = require('../models/columns/updateColumn.model');

class ColumnController {
  constructor({ columnService, ApiResponse, catchAsync }) {
    this.columnService = columnService;

  }

  createColumn = catchAsync(async (req, res) => {
    const columnData = toCreateColumnModel(req.body);
    const column = await this.columnService.createColumn(columnData, req.user._id);
    new ApiResponse(201, 'Tạo cột thành công', { column: toColumnModel(column) }).send(res);
  });

  getProjectColumns = catchAsync(async (req, res) => {
    const columns = await this.columnService.getColumnsByProjectId(req.params.projectId);
    new ApiResponse(200, 'Lấy danh sách cột thành công', { columns: columns.map(toColumnModel) }).send(res);
  });

  getColumnById = catchAsync(async (req, res) => {
    const column = await this.columnService.getColumnById(req.params.columnId);
    new ApiResponse(200, 'Lấy thông tin cột thành công', { column: toColumnModel(column) }).send(res);
  });

  updateColumn = catchAsync(async (req, res) => {
    const updateData = toUpdateColumnModel(req.body);
    const column = await this.columnService.updateColumn(req.params.columnId, updateData, req.user._id);
    new ApiResponse(200, 'Cập nhật cột thành công', { column: toColumnModel(column) }).send(res);
  });

  deleteColumn = catchAsync(async (req, res) => {
    await this.columnService.deleteColumn(req.params.columnId, req.user._id);
    new ApiResponse(200, 'Xóa cột thành công').send(res);
  });

  reorderColumns = catchAsync(async (req, res) => {
    const { orderedColumnIds } = req.body;
    const columns = await this.columnService.reorderColumns(req.params.projectId, orderedColumnIds, req.user._id);
    new ApiResponse(200, 'Sắp xếp lại cột thành công', { columns: columns.map(toColumnModel) }).send(res);
  });
}

module.exports = ColumnController;
