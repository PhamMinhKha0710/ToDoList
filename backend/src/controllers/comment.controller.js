const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { toCommentModel } = require('../models/comments/commentResponse.model.js');

class CommentController {
  constructor({ commentService, ApiResponse, catchAsync }) {
    this.commentService = commentService;

  }

  getCommentsByTaskId = catchAsync(async (req, res) => {
    const comments = await this.commentService.getCommentsByTaskId(req.params.taskId);
    new ApiResponse(200, 'Lấy danh sách bình luận thành công', { comments: comments.map(toCommentModel) }).send(res);
  });

  createComment = catchAsync(async (req, res) => {
    const commentData = { ...req.body, authorId: req.user._id };
    const comment = await this.commentService.createComment(commentData);
    new ApiResponse(201, 'Tạo bình luận thành công', { comment: toCommentModel(comment) }).send(res);
  });

  updateComment = catchAsync(async (req, res) => {
    const { content } = req.body;
    const comment = await this.commentService.updateComment(req.params.commentId, req.user._id, content);
    new ApiResponse(200, 'Cập nhật bình luận thành công', { comment: toCommentModel(comment) }).send(res);
  });

  deleteComment = catchAsync(async (req, res) => {
    await this.commentService.deleteComment(req.params.commentId, req.user._id, req.user.role);
    new ApiResponse(200, 'Xóa bình luận thành công').send(res);
  });
}

module.exports = CommentController;
