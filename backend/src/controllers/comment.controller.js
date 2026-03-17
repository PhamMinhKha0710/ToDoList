const commentService = require('../services/comment.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

class CommentController {
  /**
   * GET /api/v1/comments/task/:taskId
   */
  getCommentsByTaskId = catchAsync(async (req, res) => {
    const comments = await commentService.getCommentsByTaskId(req.params.taskId);
    new ApiResponse(200, 'Lấy danh sách bình luận thành công', { comments }).send(res);
  });

  /**
   * POST /api/v1/comments
   */
  createComment = catchAsync(async (req, res) => {
    const commentData = {
      ...req.body,
      authorId: req.user._id,
    };
    const comment = await commentService.createComment(commentData);
    new ApiResponse(201, 'Tạo bình luận thành công', { comment }).send(res);
  });

  /**
   * PUT /api/v1/comments/:commentId
   */
  updateComment = catchAsync(async (req, res) => {
    const { content } = req.body;
    const comment = await commentService.updateComment(req.params.commentId, req.user._id, content);
    new ApiResponse(200, 'Cập nhật bình luận thành công', { comment }).send(res);
  });

  /**
   * DELETE /api/v1/comments/:commentId
   */
  deleteComment = catchAsync(async (req, res) => {
    await commentService.deleteComment(req.params.commentId, req.user._id, req.user.role); 
    new ApiResponse(200, 'Xóa bình luận thành công').send(res);
  });
}

module.exports = new CommentController();
