class CommentService {
  constructor({ Comment, ApiError, Task, Column, projectService }) {
    this.Comment = Comment;
    this.ApiError = ApiError;
    this.Task = Task;
    this.Column = Column;
    this.projectService = projectService;
  }

  createComment = async (commentData) => {
    const comment = await this.Comment.create(commentData);
    return await this.Comment.findById(comment._id).populate('authorId', 'displayName email avatarUrl');
  };

  getCommentsByTaskId = async (taskId) => {
    return await this.Comment.find({ taskId })
      .populate('authorId', 'displayName email avatarUrl')
      .sort({ createdAt: 1 });
  };

  updateComment = async (commentId, authorId, content) => {
    const comment = await this.Comment.findById(commentId);
    if (!comment) throw new this.ApiError(404, 'Không tìm thấy bình luận');

    if (comment.authorId.toString() !== authorId.toString()) {
      throw new this.ApiError(403, 'Bạn chỉ có thể chỉnh sửa bình luận của chính mình');
    }

    comment.content = content;
    await comment.save();

    return await this.Comment.findById(commentId).populate('authorId', 'displayName email avatarUrl');
  };

  deleteComment = async (commentId, userId, userRole) => {
    const comment = await this.Comment.findById(commentId);
    if (!comment) throw new this.ApiError(404, 'Không tìm thấy bình luận');

    const isAuthor = comment.authorId.toString() === userId.toString();
    let isManager = false;

    if (!isAuthor) {
      const task = await this.Task.findById(comment.taskId);
      if (task) {
        const column = await this.Column.findById(task.columnId);
        if (column) {
          const project = await this.projectService.getProjectById(column.projectId);
          const member = project.members.find(m => m.userId._id.toString() === userId.toString());
          if (member && (member.role === 'admin' || member.role === 'owner')) {
            isManager = true;
          }
        }
      }
    }

    if (!isAuthor && !isManager) {
      throw new this.ApiError(403, 'Bạn không có quyền xóa bình luận này');
    }

    await comment.deleteOne();
  };
}

module.exports = new CommentService({
  Comment: require('../../entities/Comment'),
  ApiError: require('../../utils/ApiError'),
  Task: require('../../entities/Task'),
  Column: require('../../entities/Column'),
  projectService: require('../projects/project.service'),
});
