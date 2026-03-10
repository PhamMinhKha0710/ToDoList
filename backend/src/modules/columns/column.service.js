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
