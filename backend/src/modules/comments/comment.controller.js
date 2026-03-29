const commentService = require('./comment.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * GET /api/v1/comments/task/:taskId
 */
const getCommentsByTaskId = catchAsync(async (req, res) => {
  const comments = await commentService.getCommentsByTaskId(req.params.taskId);
  new ApiResponse(200, 'Lấy danh sách bình luận thành công', { comments }).send(res);
});

/**
 * POST /api/v1/comments
 */
const createComment = catchAsync(async (req, res) => {
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
const updateComment = catchAsync(async (req, res) => {
  const { content } = req.body;
  const comment = await commentService.updateComment(req.params.commentId, req.user._id, content);
  new ApiResponse(200, 'Cập nhật bình luận thành công', { comment }).send(res);
});

/**
 * DELETE /api/v1/comments/:commentId
 */
const deleteComment = catchAsync(async (req, res) => {
  // requires knowledge of userRole for Admin/Owner override. 
  // We'll pass req.user._id and req.userRole (if available from middleware)
  // If not using project role middleware here, we might need a specific check later, 
  // but for simplicity we rely on authorId check or assume req.userRole is populated if needed.
  // Actually, we need project context for userRole. For now, we'll try to find project from task from comment.
  
  // Let's implement a robust delete in service, here just pass the user ID.
  await commentService.deleteComment(req.params.commentId, req.user._id, req.user.role); 
  // Note: req.user.role is system role (admin vs user), not project role. 
  // If project role is needed, we should fetch it in service.
  new ApiResponse(200, 'Xóa bình luận thành công').send(res);
});

module.exports = {
  getCommentsByTaskId,
  createComment,
  updateComment,
  deleteComment,
};
