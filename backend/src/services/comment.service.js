const eventBus = require('../utils/eventBus');

class CommentService {
  constructor({ commentRepository, ApiError, Task, PersonalTask, Column, projectService }) {
    this.commentRepository = commentRepository;
    this.ApiError = ApiError;
    this.Task = Task;
    this.PersonalTask = PersonalTask;
    this.Column = Column;
    this.projectService = projectService;
  }

  createComment = async (commentData) => {
    const comment = await this.commentRepository.create(commentData);
    const populated = await this.commentRepository.findById(comment._id);
    await populated.populate('authorId', 'displayName email avatarUrl');

    const taskIdStr = commentData.taskId.toString();

    let task = await this.Task.findById(commentData.taskId).lean();
    let isPersonal = false;
    if (!task) {
      task = await this.PersonalTask.findById(commentData.taskId).lean();
      if (task) isPersonal = true;
    }

    let projectId = null;
    if (task && !isPersonal) {
      const column = await this.Column.findById(task.columnId).select('projectId').lean();
      projectId = column?.projectId?.toString() || null;
    }

    eventBus.emitAsync('comment.created', {
      comment: populated,
      task,
      isPersonal,
      projectId,
      taskIdStr,
      authorId: commentData.authorId,
      mentions: commentData.mentions,
    });

    return populated;
  };

  getCommentsByTaskId = async (taskId) => {
    const docs = await this.commentRepository.findByTaskId(taskId);
    return await Promise.all(docs.map(doc => doc.populate('authorId', 'displayName email avatarUrl')));
  };

  updateComment = async (commentId, authorId, content) => {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new this.ApiError(404, 'Không tìm thấy bình luận');

    if (comment.authorId.toString() !== authorId.toString()) {
      throw new this.ApiError(403, 'Bạn chỉ có thể chỉnh sửa bình luận của chính mình');
    }

    const oldContent = comment.content;
    const updated = await this.commentRepository.updateById(commentId, { content });
    await updated.populate('authorId', 'displayName email avatarUrl');

    let task = await this.Task.findById(comment.taskId).lean();
    let projectId = null;
    if (task) {
      const column = await this.Column.findById(task.columnId).select('projectId').lean();
      projectId = column?.projectId?.toString() || null;
    }

    eventBus.emitAsync('comment.updated', {
      comment: updated,
      taskId: comment.taskId.toString(),
      projectId,
      authorId,
      oldContent,
      taskTitle: task?.title,
    });

    return updated;
  };

  deleteComment = async (commentId, userId) => {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new this.ApiError(404, 'Không tìm thấy bình luận');

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
            const mUserId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
            return mUserId === userId.toString();
          });
          if (member && (member.role === 'admin' || member.role === 'owner')) {
            isManager = true;
          }
        }
      }
    }

    if (!isAuthor && !isManager) {
      throw new this.ApiError(403, 'Bạn không có quyền xóa bình luận này');
    }

    const taskId = comment.taskId.toString();
    const idComment = comment._id.toString();

    await this.commentRepository.deleteById(commentId);

    let task = await this.Task.findById(comment.taskId).lean();
    let projectId = null;
    if (task) {
      const column = await this.Column.findById(task.columnId).select('projectId').lean();
      projectId = column?.projectId?.toString() || null;
    }

    eventBus.emitAsync('comment.deleted', {
      commentId: idComment,
      taskId,
      projectId,
      userId,
      taskTitle: task?.title,
      commentSnapshot: comment,
    });
  };
}

module.exports = CommentService;
