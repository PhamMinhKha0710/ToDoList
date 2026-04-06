class ColumnService {
  constructor({
    columnRepository,
    Column,
    ApiError,
    mongoose,
    columnSocket,
    activityService,
  }) {
    this.columnRepository = columnRepository;
    this.Column = Column;
    this.ApiError = ApiError;
    this.mongoose = mongoose;
    this.columnSocket = columnSocket;
    this.activityService = activityService;
  }

  async createColumn(columnData, userId) {
    const { projectId, title, color } = columnData;

    const count = await this.Column.countDocuments({ projectId });

    const newColumn = await this.columnRepository.create({
      projectId,
      title,
      color,
      position: count,
    });

    this.columnSocket.emitColumnCreated(projectId.toString(), newColumn);

    await this.activityService.createActivityLog({
      projectId,
      userId,
      action: 'COLUMN_CREATED',
      entityType: 'column',
      entityId: newColumn._id,
      detail: { 
        title: newColumn.title, 
        color: newColumn.color, 
        position: newColumn.position,
        projectId: newColumn.projectId
      }
    });

    return newColumn;
  }

  async getColumnsByProjectId(projectId) {
    const columns = await this.Column.find({ projectId }).sort({ position: 1 });
    return columns.map(c => c.toObject ? c.toObject() : c);
  }

  async getColumnById(columnId) {
    const column = await this.columnRepository.findById(columnId);
    if (!column) {
      throw new this.ApiError(404, 'Không tìm thấy cột');
    }
    return column;
  }

  async updateColumn(columnId, updateData, userId) {
    const column = await this.columnRepository.findById(columnId);
    if (!column) {
      throw new this.ApiError(404, 'Không tìm thấy cột');
    }
    const updated = await this.columnRepository.updateById(columnId, updateData);

    this.columnSocket.emitColumnUpdated(column.projectId.toString(), updated);

    const differences = {};
    const fields = Object.keys(updateData);
    fields.forEach(key => {
      if (updateData[key] !== undefined && JSON.stringify(column[key]) !== JSON.stringify(updateData[key])) {
        differences[key] = {
          old: column[key],
          new: updateData[key]
        };
      }
    });

    await this.activityService.createActivityLog({
      projectId: column.projectId,
      userId,
      action: 'COLUMN_UPDATED',
      entityType: 'column',
      entityId: columnId,
      detail: { title: updated.title, differences }
    });

    return updated;
  }

  async deleteColumn(columnId, userId) {
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

    const tasksInColumn = await this.mongoose.model('Task').find({ columnId }).select('title priority status').lean();
    
    await this.activityService.createActivityLog({
      projectId,
      userId,
      action: 'COLUMN_DELETED',
      entityType: 'column',
      entityId: columnId,
      detail: { 
        title: column.title,
        color: column.color,
        position: column.position,
        tasksRemovedCount: tasksInColumn.length,
        tasksInColumn: tasksInColumn.map(t => ({ title: t.title, priority: t.priority }))
      }
    });

    return null;
  }

  async reorderColumns(projectId, orderedColumnIds, userId) {
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

    const oldColumns = await this.Column.find({ projectId }).sort({ position: 1 }).select("_id").lean();
    const oldOrder = oldColumns.map(c => c._id.toString());
    
    await this.Column.bulkWrite(bulkOps);

    const sorted = await this.Column.find({ projectId }).sort({ position: 1 });

    this.columnSocket.emitColumnsReordered(projectId.toString(), sorted);

    await this.activityService.createActivityLog({
      projectId,
      userId,
      action: 'COLUMNS_REORDERED',
      entityType: 'project',
      entityId: projectId,
      detail: { 
        oldOrder, 
        newOrder: orderedColumnIds 
      }
    });

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
  activityService: require('./activity.service'),
});
