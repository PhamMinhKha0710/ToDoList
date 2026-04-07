const logger = require('../utils/logger');

/**
 * Task Subscriber — xử lý side-effects khi có task events
 * Socket emit, notification, activity log
 */
module.exports = (eventBus, { taskSocket, notificationService, activityService }) => {

  eventBus.on('task.created', async ({ task, projectId, userId }) => {
    // 1. Socket emit
    taskSocket.emitTaskCreated(projectId, task);

    // 2. Notification cho assignees
    if (task.assignees && task.assignees.length > 0) {
      for (const assignee of task.assignees) {
        const assigneeId = assignee._id ? assignee._id.toString() : assignee.toString();
        if (assigneeId !== userId.toString()) {
          await notificationService.createNotification({
            recipientId: assigneeId,
            type: 'task_assigned',
            title: 'Nhiệm vụ mới',
            message: `Bạn được giao nhiệm vụ "${task.title}"`,
            metadata: { taskId: task._id, projectId },
          }, projectId);
        }
      }
    }

    // 3. Activity log
    await activityService.createActivityLog({
      projectId,
      userId,
      action: 'TASK_CREATED',
      entityType: 'task',
      entityId: task._id,
      detail: { title: task.title, status: task.status, priority: task.priority },
    });

    logger.info(`[Subscriber] task.created processed: ${task._id}`);
  });

  eventBus.on('task.updated', async ({ task, existingTask, projectId, userId, updateData }) => {
    if (!projectId) return;

    taskSocket.emitTaskUpdated(projectId, task);

    // Notification nếu có assignee mới
    if (updateData.assignees) {
      const oldIds = (existingTask.assignees || []).map(u => (u._id || u).toString());
      const newIds = (updateData.assignees || []).map(id => id.toString());
      const newlyAssigned = newIds.filter(id => !oldIds.includes(id));

      for (const assigneeId of newlyAssigned) {
        if (assigneeId !== userId.toString()) {
          await notificationService.createNotification({
            recipientId: assigneeId,
            type: 'task_assigned',
            title: 'Nhiệm vụ mới',
            message: `Bạn được giao nhiệm vụ "${task.title}"`,
            metadata: { taskId: task._id, projectId },
          }, projectId);
        }
      }
    }

    // Tính differences cho activity log
    const differences = {};
    const trackFields = ['title', 'description', 'status', 'priority', 'dueDate', 'startDate', 'endDate'];
    trackFields.forEach(key => {
      if (updateData[key] !== undefined && JSON.stringify(existingTask[key]) !== JSON.stringify(updateData[key])) {
        differences[key] = { old: existingTask[key], new: updateData[key] };
      }
    });

    await activityService.createActivityLog({
      projectId,
      userId,
      action: 'TASK_UPDATED',
      entityType: 'task',
      entityId: task._id,
      detail: { title: task.title, differences },
    });
  });

  eventBus.on('task.deleted', async ({ taskId, columnId, projectId, taskTitle, userId }) => {
    if (!projectId) return;

    taskSocket.emitTaskDeleted(projectId, taskId, columnId);

    await activityService.createActivityLog({
      projectId,
      userId,
      action: 'TASK_DELETED',
      entityType: 'task',
      entityId: taskId,
      detail: { title: taskTitle },
    });
  });

  eventBus.on('task.moved', async ({ moveData, projectId, userId }) => {
    if (!projectId) return;

    taskSocket.emitTaskMoved(projectId, moveData);

    await activityService.createActivityLog({
      projectId,
      userId,
      action: 'TASK_MOVED',
      entityType: 'task',
      entityId: moveData.taskId,
      detail: {
        sourceColumnId: moveData.sourceColumnId,
        destinationColumnId: moveData.destinationColumnId,
      },
    });
  });

  logger.info('[Subscriber] Task subscriber registered');
};
