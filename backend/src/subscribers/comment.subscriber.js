const logger = require('../utils/logger');

/**
 * Comment Subscriber — xử lý side-effects khi có comment events
 */
module.exports = (eventBus, { commentSocket, notificationService, activityService }) => {

  eventBus.on('comment.created', async ({ comment, task, isPersonal, projectId, taskIdStr, authorId, mentions }) => {
    // 1. Socket emit
    commentSocket.emitCommentCreated(taskIdStr, comment);

    if (!task) return;

    // 2. Notification — mentions
    if (mentions && Array.isArray(mentions)) {
      for (const mentionId of mentions) {
        if (mentionId.toString() !== authorId.toString()) {
          await notificationService.createNotification({
            recipientId: mentionId,
            type: 'mention',
            title: 'Nhắc đến',
            message: `${comment.authorId.displayName} đã nhắc đến bạn trong task "${task.title}"`,
            metadata: { taskId: task._id, commentId: comment._id, projectId },
          }, taskIdStr);
        }
      }
    }

    // 3. Notification — recipients (creator + assignees)
    const recipients = new Set();
    const mentionSet = new Set((mentions || []).map(id => id.toString()));

    if (task.creatorId && task.creatorId.toString() !== authorId.toString()) {
      recipients.add(task.creatorId.toString());
    } else if (task.userId && task.userId.toString() !== authorId.toString()) {
      recipients.add(task.userId.toString());
    }

    if (task.assignees) {
      task.assignees.forEach(id => {
        if (id.toString() !== authorId.toString()) recipients.add(id.toString());
      });
    }

    // Loại bỏ những người đã được mention
    for (const recipientId of recipients) {
      if (mentionSet.has(recipientId)) continue;
      await notificationService.createNotification({
        recipientId,
        type: 'new_comment',
        title: 'Bình luận mới',
        message: `${comment.authorId.displayName} đã bình luận trong task "${task.title}"`,
        metadata: { taskId: task._id, commentId: comment._id, projectId },
      }, taskIdStr);
    }

    // 4. Activity log
    if (projectId) {
      await activityService.createActivityLog({
        projectId,
        userId: authorId,
        action: 'COMMENT_CREATED',
        entityType: 'comment',
        entityId: comment._id,
        detail: { taskTitle: task.title, taskId: task._id, contentSnippet: comment.content.substring(0, 50) },
      });
    }
  });

  eventBus.on('comment.updated', async ({ comment, taskId, projectId, authorId, oldContent, taskTitle }) => {
    commentSocket.emitCommentUpdated(taskId, comment);

    if (projectId) {
      await activityService.createActivityLog({
        projectId,
        userId: authorId,
        action: 'COMMENT_UPDATED',
        entityType: 'comment',
        entityId: comment._id,
        detail: {
          taskTitle,
          oldContentSnippet: oldContent.substring(0, 50),
          newContentSnippet: comment.content.substring(0, 50),
          differences: { content: { old: oldContent, new: comment.content } },
        },
      });
    }
  });

  eventBus.on('comment.deleted', async ({ commentId, taskId, projectId, userId, taskTitle, commentSnapshot }) => {
    commentSocket.emitCommentDeleted(taskId, commentId);

    if (projectId) {
      await activityService.createActivityLog({
        projectId,
        userId,
        action: 'COMMENT_DELETED',
        entityType: 'comment',
        entityId: commentId,
        detail: {
          taskTitle,
          taskId,
          oldContentSnippet: commentSnapshot?.content?.substring(0, 50),
        },
      });
    }
  });

  logger.info('[Subscriber] Comment subscriber registered');
};
