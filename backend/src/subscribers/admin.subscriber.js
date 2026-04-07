const logger = require('../utils/logger');

/**
 * Admin Subscriber — xử lý side-effects cho admin actions
 */
module.exports = (eventBus, { getIO }) => {

  eventBus.on('admin.user.locked', async ({ userId }) => {
    try {
      getIO().to(`user:${userId}`).emit('user:locked');
    } catch (err) {
      logger.error(`[AdminSubscriber] Failed to emit user:locked: ${err.message}`);
    }
  });

  eventBus.on('admin.project.created', async ({ project }) => {
    const io = getIO();

    try { io.to('admin:projects').emit('admin:project_list_updated'); } catch (err) { /* ignore */ }

    if (project.members && project.members.length > 0) {
      project.members.forEach(member => {
        const userId = member.userId._id || member.userId;
        try { io.to(`user:${userId}`).emit('project:list_updated'); } catch (err) { /* ignore */ }
      });
    }
  });

  eventBus.on('admin.project.updated', async ({ project, isDeactivated }) => {
    const io = getIO();
    const projectId = project._id.toString();

    if (isDeactivated) {
      try { io.to(projectId).emit('project:deactivated', { projectId }); } catch (err) { /* ignore */ }
    }

    if (project.members && project.members.length > 0) {
      project.members.forEach(member => {
        const userId = member.userId._id || member.userId;
        try { io.to(`user:${userId}`).emit('project:list_updated'); } catch (err) { /* ignore */ }
      });
    }

    try { io.to('admin:projects').emit('admin:project_list_updated'); } catch (err) { /* ignore */ }
  });

  eventBus.on('admin.project.deleted', async ({ project, projectId }) => {
    const io = getIO();

    try { io.to(projectId).emit('project:deleted', { projectId }); } catch (err) { /* ignore */ }

    if (project.members && project.members.length > 0) {
      project.members.forEach(member => {
        const userId = member.userId._id || member.userId;
        try { io.to(`user:${userId}`).emit('project:list_updated'); } catch (err) { /* ignore */ }
      });
    }

    try { io.to('admin:projects').emit('admin:project_list_updated'); } catch (err) { /* ignore */ }
  });

  // Attachment events — activity log only
  eventBus.on('attachment.uploaded', async ({ projectId, userId, taskId, taskTitle, fileName, fileUrl }) => {
    const activityService = require('../container').activityService;
    await activityService.createActivityLog({
      projectId, userId,
      action: 'FILE_ATTACHED',
      entityType: 'task',
      entityId: taskId,
      detail: { taskTitle, fileName, fileUrl, isImage: /\.(jpg|jpeg|png|gif)$/i.test(fileName) },
    });
  });

  eventBus.on('attachment.deleted', async ({ projectId, userId, taskId, taskTitle, fileName }) => {
    const activityService = require('../container').activityService;
    await activityService.createActivityLog({
      projectId, userId,
      action: 'FILE_REMOVED',
      entityType: 'task',
      entityId: taskId,
      detail: { taskTitle, fileName },
    });
  });

  logger.info('[Subscriber] Admin subscriber registered');
};
