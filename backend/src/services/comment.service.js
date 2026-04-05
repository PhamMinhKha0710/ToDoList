class CommentService {
  constructor({
    commentRepository,
    ApiError,
    Task,
    PersonalTask,
    Column,
    projectService,
    commentSocket,
    notificationService,
  }) {
    this.commentRepository = commentRepository;
    this.ApiError = ApiError;
    this.Task = Task;
    this.PersonalTask = PersonalTask;
    this.Column = Column;
    this.projectService = projectService;
    this.commentSocket = commentSocket;
    this.notificationService = notificationService;
  }

  createComment = async (commentData) => {
    const comment = await this.commentRepository.create(commentData);
    const populated = await this.commentRepository.findById(comment._id);
    await populated.populate("authorId", "displayName email avatarUrl");

    const taskIdStr = commentData.taskId.toString();
    this.commentSocket.emitCommentCreated(taskIdStr, populated);

    let task = await this.Task.findById(commentData.taskId).lean();
    let isPersonal = false;
    if (!task) {
        task = await this.PersonalTask.findById(commentData.taskId).lean();
        if (task) isPersonal = true;
    }

    if (task) {
      const column = await this.Column.findById(task.columnId).select('projectId').lean();
      const projectId = column?.projectId?.toString() || null;

      const recipients = new Set();
      if (task.creatorId && task.creatorId.toString() !== commentData.authorId.toString()) {
        recipients.add(task.creatorId.toString());
      } else if (task.userId && task.userId.toString() !== commentData.authorId.toString()) {
        // Case for PersonalTask
        recipients.add(task.userId.toString());
      }

      if (task.assignees) {
        task.assignees.forEach(id => {
            if (id.toString() !== commentData.authorId.toString()) {
                recipients.add(id.toString());
            }
        });
      }

      if (commentData.mentions && Array.isArray(commentData.mentions)) {
        for (const mentionId of commentData.mentions) {
          if (mentionId.toString() !== commentData.authorId.toString()) {
            await this.notificationService.createNotification({
              recipientId: mentionId,
              type: 'mention',
              title: 'Nhắc đến',
              message: `${populated.authorId.displayName} đã nhắc đến bạn trong task "${task.title}"`,
              metadata: { taskId: task._id, commentId: comment._id, projectId }
            }, taskIdStr);
            recipients.delete(mentionId.toString());
          }
        }
      }

      for (const recipientId of recipients) {
        await this.notificationService.createNotification({
          recipientId,
          type: 'new_comment',
          title: 'Bình luận mới',
          message: `${populated.authorId.displayName} đã bình luận trong task "${task.title}"`,
          metadata: { taskId: task._id, commentId: comment._id, projectId }
        }, taskIdStr);
      }
    }

    return populated;
  };

  getCommentsByTaskId = async (taskId) => {
    const comments = await this.commentRepository.findByTaskId(taskId);
    // Since findByTaskId returns a list, we need to populate each one or use a more advanced repository method.
    // Given the project's style, we can populate directly on the result if it's a query or just ensure repository returns populated data.
    // For now, I'll keep it simple and populate here.
    return await this.commentRepository.findByTaskId(taskId)
      .then(docs => Promise.all(docs.map(doc => doc.populate("authorId", "displayName email avatarUrl"))));
  };

  updateComment = async (commentId, authorId, content) => {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new this.ApiError(404, "Không tìm thấy bình luận");

    if (comment.authorId.toString() !== authorId.toString()) {
      throw new this.ApiError(
        403,
        "Bạn chỉ có thể chỉnh sửa bình luận của chính mình",
      );
    }

    const updated = await this.commentRepository.updateById(commentId, { content });
    await updated.populate("authorId", "displayName email avatarUrl");

    this.commentSocket.emitCommentUpdated(comment.taskId.toString(), updated);

    return updated;
  };

  deleteComment = async (commentId, userId, userRole) => {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new this.ApiError(404, "Không tìm thấy bình luận");

    const isAuthor = comment.authorId.toString() === userId.toString();
    let isManager = false;

    if (!isAuthor) {
      let task = await this.Task.findById(comment.taskId);
      let isPersonal = false;
      if (!task) {
          task = await this.PersonalTask.findById(comment.taskId);
          if (task) isPersonal = true;
      }

      if (task && !isPersonal) {
        const column = await this.Column.findById(task.columnId);
        if (column) {
          const project = await this.projectService.getProjectById(column.projectId);
          const member = project.members.find((m) => {
            const mUserId = m.userId._id
              ? m.userId._id.toString()
              : m.userId.toString();
            return mUserId === userId.toString();
          });
          if (member && (member.role === "admin" || member.role === "owner")) {
            isManager = true;
          }
        }
      }

      for (const recipientId of recipients) {
        await this.notificationService.createNotification({
          recipientId,
          type: 'new_comment',
          title: 'Bình luận mới',
          message: `${populated.authorId.displayName} đã bình luận trong task "${task.title}"`,
          metadata: { taskId: task._id, commentId: comment._id, projectId }
        }, taskIdStr);
      }
    }

    if (!isAuthor && !isManager) {
      throw new this.ApiError(403, "Bạn không có quyền xóa bình luận này");
    }

    const taskId = comment.taskId.toString();
    const idComment = comment._id.toString();

    await this.commentRepository.deleteById(commentId);

    this.commentSocket.emitCommentDeleted(taskId, idComment);
  };
}

module.exports = new CommentService({
  commentRepository: require('../repositories/comment.repository'),
  ApiError: require('../utils/ApiError'),
  Task: require('../entities/Task'),
  PersonalTask: require('../entities/PersonalTask'),
  Column: require('../entities/Column'),
  projectService: require('./project.service'),
  commentSocket: {
    emitCommentCreated: require('../sockets/comment.socket').emitCommentCreated,
    emitCommentDeleted: require('../sockets/comment.socket').emitCommentDeleted,
    emitCommentUpdated: require('../sockets/comment.socket').emitCommentUpdated,
  },
  notificationService: require('./notification.service'),
});

