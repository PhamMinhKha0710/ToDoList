const columnRepository = require('./column.repository');
const Column = require('../../models/Column');
const ApiError = require('../../utils/ApiError');

class ColumnService {
  async createColumn(columnData) {
    const { projectId, title, color } = columnData;

    // Tính position mới = số column hiện tại của project
    const count = await Column.countDocuments({ projectId });

    const newColumn = await columnRepository.create({
      projectId,
      title,
      color,
      position: count,
    });

    return newColumn;
  }

  async getColumnsByProjectId(projectId) {
    // Sort theo position trực tiếp thay vì dùng columnOrder[]
    const columns = await Column.find({ projectId }).sort({ position: 1 });
    return columns.map(c => c.toObject ? c.toObject() : c);
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

    const projectId = column.projectId;
    const deletedPosition = column.position;

    // Xóa column
    await columnRepository.deleteById(columnId);

    // Compact positions của các column còn lại trong project
    await Column.updateMany(
      { projectId, position: { $gt: deletedPosition } },
      { $inc: { position: -1 } }
    );

    return null;
  }

  /**
   * Reorder columns theo thứ tự mới (từ drag-drop)
   * @param {string} projectId
   * @param {string[]} orderedColumnIds - Mảng column IDs theo thứ tự mới
   */
  async reorderColumns(projectId, orderedColumnIds) {
    // Validate tất cả columns thuộc project này
    const columns = await Column.find({ projectId, _id: { $in: orderedColumnIds } });
    if (columns.length !== orderedColumnIds.length) {
      throw new ApiError(400, 'Một số column không thuộc project này');
    }

    // Bulk update positions
    const bulkOps = orderedColumnIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, projectId },
        update: { $set: { position: index } },
      },
    }));

    await Column.bulkWrite(bulkOps);

    // Trả về columns đã được sắp xếp
    return Column.find({ projectId }).sort({ position: 1 });
  }
}

module.exports = new ColumnService();
