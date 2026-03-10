const columnRepository = require('./column.repository');
const Project = require('../../models/Project');
const ApiError = require('../../utils/ApiError');

class ColumnService {
  async createColumn(columnData) {
    const { projectId, title, color } = columnData;

    // Kểm tra project có tồn tại không
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Không tìm thấy dự án');
    }

    const newColumn = await columnRepository.create({
      projectId,
      title,
      color,
    });

    // Thêm column ID vào mảng columnOrder của project
    await Project.findByIdAndUpdate(projectId, {
      $push: { columnOrder: newColumn._id },
    });

    return newColumn;
  }

  async getColumnsByProjectId(projectId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Không tìm thấy dự án');
    }

    // Lấy các cột
    const columns = await columnRepository.findByProjectId(projectId);
    
    // Sort columns by project's columnOrder
    const columnOrderMap = new Map();
    project.columnOrder.forEach((id, index) => {
      columnOrderMap.set(id.toString(), index);
    });

    columns.sort((a, b) => {
      const idxA = columnOrderMap.has(a._id.toString()) ? columnOrderMap.get(a._id.toString()) : 9999;
      const idxB = columnOrderMap.has(b._id.toString()) ? columnOrderMap.get(b._id.toString()) : 9999;
      return idxA - idxB;
    });

    return columns;
  }

  async updateColumn(columnId, updateData) {
    const column = await columnRepository.findById(columnId);
    if (!column) {
      throw new ApiError(404, 'Không tìm thấy cột');
    }

    return columnRepository.updateById(columnId, updateData);
  }

  async deleteColumn(columnId) {
    const column = await columnRepository.findById(columnId);
    if (!column) {
      throw new ApiError(404, 'Không tìm thấy cột');
    }

    // Xóa column khỏi bảng Column
    await columnRepository.deleteById(columnId);

    // Xóa column ID khỏi mảng columnOrder của project
    await Project.findByIdAndUpdate(column.projectId, {
      $pull: { columnOrder: columnId },
    });

    return null;
  }
}

module.exports = new ColumnService();
