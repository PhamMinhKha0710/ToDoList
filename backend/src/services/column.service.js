class ColumnService {
  constructor({
    columnRepository,
    Column,
    ApiError,
    mongoose,
    columnSocket,
  }) {
    this.columnRepository = columnRepository;
    this.Column = Column;
    this.ApiError = ApiError;
    this.mongoose = mongoose;
    this.columnSocket = columnSocket;
  }

  async createColumn(columnData) {
    const { projectId, title, color } = columnData;

    const count = await this.Column.countDocuments({ projectId });

    const newColumn = await this.columnRepository.create({
      projectId,
      title,
      color,
      position: count,
    });

    this.columnSocket.emitColumnCreated(projectId.toString(), newColumn);

    return newColumn;
  }

  async getColumnsByProjectId(projectId) {
    const columns = await this.Column.find({ projectId }).sort({ position: 1 });
    return columns.map(c => c.toObject ? c.toObject() : c);
  }

  async getColumnById(columnId) {
    const column = await columnRepository.findById(columnId);
    if (!column) {
      throw new ApiError(404, 'Không tìm thấy cột');
    }
    return column;
  }

  async updateColumn(columnId, updateData) {
    const column = await this.columnRepository.findById(columnId);
    if (!column) {
      throw new this.ApiError(404, 'Không tìm thấy cột');
    }
    const updated = await this.columnRepository.updateById(columnId, updateData);

    this.columnSocket.emitColumnUpdated(column.projectId.toString(), updated);

    return updated;
  }

  async deleteColumn(columnId) {
    const column = await this.columnRepository.findById(columnId);
    if (!column) {
      throw new this.ApiError(404, 'Không tìm thấy cột');
    }

    const projectId = column.projectId;
    const deletedPosition = column.position;

    await this.columnRepository.deleteById(columnId);

    await this.Column.updateMany(
      { projectId, position: { $gt: deletedPosition } },
      { $inc: { position: -1 } }
    );

    this.columnSocket.emitColumnDeleted(projectId.toString(), columnId);

    return null;
  }

  async reorderColumns(projectId, orderedColumnIds) {
    const columns = await this.Column.find({ projectId, _id: { $in: orderedColumnIds } });
    if (columns.length !== orderedColumnIds.length) {
      throw new this.ApiError(400, 'Một số column không thuộc project này');
    }

    const bulkOps = orderedColumnIds.map((id, index) => ({
      updateOne: {
        filter: {
          _id: new this.mongoose.Types.ObjectId(id),
          projectId: new this.mongoose.Types.ObjectId(projectId)
        },
        update: { $set: { position: index } },
      },
    }));

    await this.Column.bulkWrite(bulkOps);

    const sorted = await this.Column.find({ projectId }).sort({ position: 1 });

    this.columnSocket.emitColumnsReordered(projectId.toString(), sorted);

    return sorted;
  }
}

module.exports = new ColumnService({
  columnRepository: require('../repositories/column.repository'),
  Column: require('../entities/Column'),
  ApiError: require('../utils/ApiError'),
  mongoose: require('mongoose'),
  columnSocket: {
    emitColumnCreated: require('../sockets/column.socket').emitColumnCreated,
    emitColumnUpdated: require('../sockets/column.socket').emitColumnUpdated,
    emitColumnDeleted: require('../sockets/column.socket').emitColumnDeleted,
    emitColumnsReordered: require('../sockets/column.socket').emitColumnsReordered,
  },
});
