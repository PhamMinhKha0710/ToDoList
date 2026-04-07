const logger = require('../utils/logger');

/**
 * Column Subscriber — xử lý side-effects khi có column events
 */
module.exports = (eventBus, { columnSocket, activityService }) => {

  eventBus.on('column.created', async ({ column, projectId, userId }) => {
    columnSocket.emitColumnCreated(projectId, column);

    await activityService.createActivityLog({
      projectId,
      userId,
      action: 'COLUMN_CREATED',
      entityType: 'column',
      entityId: column._id,
      detail: { title: column.title, color: column.color, position: column.position, projectId: column.projectId },
    });
  });

  eventBus.on('column.updated', async ({ column, oldColumn, projectId, userId, differences }) => {
    columnSocket.emitColumnUpdated(projectId, column);

    await activityService.createActivityLog({
      projectId,
      userId,
      action: 'COLUMN_UPDATED',
      entityType: 'column',
      entityId: column._id,
      detail: { title: column.title, differences },
    });
  });

  eventBus.on('column.deleted', async ({ columnId, column, projectId, userId, tasksInColumn }) => {
    columnSocket.emitColumnDeleted(projectId, columnId);

    await activityService.createActivityLog({
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
        tasksInColumn: tasksInColumn.map(t => ({ title: t.title, priority: t.priority })),
      },
    });
  });

  eventBus.on('columns.reordered', async ({ columns, projectId, userId, oldOrder, newOrder }) => {
    columnSocket.emitColumnsReordered(projectId, columns);

    await activityService.createActivityLog({
      projectId,
      userId,
      action: 'COLUMNS_REORDERED',
      entityType: 'project',
      entityId: projectId,
      detail: { oldOrder, newOrder },
    });
  });

  logger.info('[Subscriber] Column subscriber registered');
};
