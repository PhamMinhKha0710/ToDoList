class CommentService {
  constructor({
    Comment,
    ApiError,
    Task,
    Column,
    projectService,
    commentSocket,
    notificationService,
  }) {
    this.Comment = Comment;
    this.ApiError = ApiError;
    this.Task = Task;
    this.Column = Column;
    this.projectService = projectService;
    this.commentSocket = commentSocket;
    this.notificationService = notificationService;
  }

  createComment = async (commentData) => {
    const comment = await this.Comment.create(commentData);
    const populated = await this.Comment.findById(comment._id).populate(
      "authorId",
      "displayName email avatarUrl",
    );

    const taskIdStr = commentData.taskId.toString();

    this.commentSocket.emitCommentCreated(taskIdStr, populated);

    const task = await this.Task.findById(commentData.taskId).lean();
    if (task) {
      const recipients = new Set();
      if (task.creatorId.toString() !== commentData.authorId.toString()) {
        recipients.add(task.creatorId.toString());
      }
      task.assignees.forEach(id => {
        if (id.toString() !== commentData.authorId.toString()) {
          recipients.add(id.toString());
        }
      });

      if (commentData.mentions && Array.isArray(commentData.mentions)) {
        for (const mentionId of commentData.mentions) {
          if (mentionId.toString() !== commentData.authorId.toString()) {
            await this.notificationService.createNotification({
              recipientId: mentionId,
              type: 'mention',
              title: 'Nhắc đến',
              message: `${populated.authorId.displayName} đã nhắc đến bạn trong task "${task.title}"`,
              metadata: { taskId: task._id, commentId: comment._id, projectId: task.columnId ? true : false }
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
          metadata: { taskId: task._id, commentId: comment._id }
        }, taskIdStr);
      }
    }

    return populated;
  };

  getCommentsByTaskId = async (taskId) => {
    return await this.Comment.find({ taskId })
      .populate("authorId", "displayName email avatarUrl")
      .sort({ createdAt: 1 });
  };

  updateComment = async (commentId, authorId, content) => {
    const comment = await this.Comment.findById(commentId);
    if (!comment) throw new this.ApiError(404, "Không tìm thấy bình luận");

    if (comment.authorId.toString() !== authorId.toString()) {
      throw new this.ApiError(
        403,
        "Bạn chỉ có thể chỉnh sửa bình luận của chính mình",
      );
    }

    comment.content = content;
    await comment.save();

    const updated = await this.Comment.findById(commentId).populate(
      "authorId",
      "displayName email avatarUrl",
    );

    this.commentSocket.emitCommentUpdated(comment.taskId.toString(), updated);

    return updated;
  };

  deleteComment = async (commentId, userId, userRole) => {
    const comment = await this.Comment.findById(commentId);
    if (!comment) throw new this.ApiError(404, "Không tìm thấy bình luận");

    const isAuthor = comment.authorId.toString() === userId.toString();
    let isManager = false;

    if (!isAuthor) {
      const task = await this.Task.findById(comment.taskId);
      if (task) {
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
    } else {
       // if task is not in Task collection, it might be PersonalTask. 
       // For PersonalTask, only the author of the comment (who must be the task owner) can delete.
       // (Handled by isAuthor check above)
    }

    if (!isAuthor && !isManager) {
      throw new this.ApiError(403, "Bạn không có quyền xóa bình luận này");
    }

    const taskId = comment.taskId.toString();
    const idComment = comment._id.toString();

    await comment.deleteOne();

    this.commentSocket.emitCommentDeleted(taskId, idComment);
  };
}

module.exports = new CommentService({
  Comment: require('../entities/Comment'),
  ApiError: require('../utils/ApiError'),
  Task: require('../entities/Task'),
  Column: require('../entities/Column'),
  projectService: require('./project.service'),
  commentSocket: {
    emitCommentCreated: require('../sockets/comment.socket').emitCommentCreated,
    emitCommentDeleted: require('../sockets/comment.socket').emitCommentDeleted,
    emitCommentUpdated: require('../sockets/comment.socket').emitCommentUpdated,
  },
  notificationService: require('./notification.service'),
});
