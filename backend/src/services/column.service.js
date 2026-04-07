const eventBus = require('../utils/eventBus');

class ColumnService {
  constructor({ columnRepository, Column, ApiError, mongoose }) {
    this.columnRepository = columnRepository;
    this.Column = Column;
    this.ApiError = ApiError;
    this.mongoose = mongoose;
  }

  async createColumn(columnData, userId) {
    const { projectId, title, color } = columnData;
    const count = await this.Column.countDocuments({ projectId });

    const newColumn = await this.columnRepository.create({
      projectId, title, color, position: count,
    });

    eventBus.emitAsync('column.created', {
      column: newColumn,
      projectId: projectId.toString(),
      userId,
    });

    return newColumn;
  }

  async getColumnsByProjectId(projectId) {
    const columns = await this.Column.find({ projectId }).sort({ position: 1 });
    return columns.map(c => c.toObject ? c.toObject() : c);
  }

  async getColumnById(columnId) {
    const column = await this.columnRepository.findById(columnId);
    if (!column) throw new this.ApiError(404, 'Không tìm thấy cột');
    return column;
  }

  async updateColumn(columnId, updateData, userId) {
    const column = await this.columnRepository.findById(columnId);
    if (!column) throw new this.ApiError(404, 'Không tìm thấy cột');

    const updated = await this.columnRepository.updateById(columnId, updateData);

    const differences = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && JSON.stringify(column[key]) !== JSON.stringify(updateData[key])) {
        differences[key] = { old: column[key], new: updateData[key] };
      }
    });

    eventBus.emitAsync('column.updated', {
      column: updated,
      oldColumn: column,
      projectId: column.projectId.toString(),
      userId,
      differences,
    });

    return updated;
  }

  async deleteColumn(columnId, userId) {
    const column = await this.columnRepository.findById(columnId);
    if (!column) throw new this.ApiError(404, 'Không tìm thấy cột');

    const projectId = column.projectId;
    const deletedPosition = column.position;

    await this.columnRepository.deleteById(columnId);

    await this.Column.updateMany(
      { projectId, position: { $gt: deletedPosition } },
      { $inc: { position: -1 } }
    );

    const tasksInColumn = await this.mongoose.model('Task').find({ columnId }).select('title priority status').lean();

    eventBus.emitAsync('column.deleted', {
      columnId,
      column,
      projectId: projectId.toString(),
      userId,
      tasksInColumn,
    });

    return null;
  }

  async reorderColumns(projectId, orderedColumnIds, userId) {
    const columns = await this.Column.find({ projectId, _id: { $in: orderedColumnIds } });
    if (columns.length !== orderedColumnIds.length) {
      throw new this.ApiError(400, 'Một số column không thuộc project này');
    }

    const oldColumns = await this.Column.find({ projectId }).sort({ position: 1 }).select('_id').lean();
    const oldOrder = oldColumns.map(c => c._id.toString());

    const bulkOps = orderedColumnIds.map((id, index) => ({
      updateOne: {
        filter: {
          _id: new this.mongoose.Types.ObjectId(id),
          projectId: new this.mongoose.Types.ObjectId(projectId),
        },
        update: { $set: { position: index } },
      },
    }));

    await this.Column.bulkWrite(bulkOps);
    const sorted = await this.Column.find({ projectId }).sort({ position: 1 });

    eventBus.emitAsync('columns.reordered', {
      columns: sorted,
      projectId: projectId.toString(),
      userId,
      oldOrder,
      newOrder: orderedColumnIds,
    });

    return sorted;
  }
}

module.exports = ColumnService;
