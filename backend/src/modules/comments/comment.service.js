const Comment = require('../../models/Comment');
const ApiError = require('../../utils/ApiError');

const createComment = async (commentData) => {
  const comment = await Comment.create(commentData);
  // Populate author details immediately so frontend can render securely without another fetch
  return await Comment.findById(comment._id).populate('authorId', 'displayName email avatarUrl');
};

const getCommentsByTaskId = async (taskId) => {
  return await Comment.find({ taskId })
    .populate('authorId', 'displayName email avatarUrl')
    .sort({ createdAt: 1 }); // Sort chronologically (oldest first)
};

const updateComment = async (commentId, authorId, content) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, 'Không tìm thấy bình luận');

  if (comment.authorId.toString() !== authorId.toString()) {
    throw new ApiError(403, 'Bạn chỉ có thể chỉnh sửa bình luận của chính mình');
  }

  comment.content = content;
  await comment.save();
  
  return await Comment.findById(commentId).populate('authorId', 'displayName email avatarUrl');
};

const deleteComment = async (commentId, userId, userRole) => {
  const Task = require('../../models/Task');
  const Column = require('../../models/Column');
  const projectService = require('../projects/project.service');
  
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, 'Không tìm thấy bình luận');

  const isAuthor = comment.authorId.toString() === userId.toString();
  let isManager = false;

  if (!isAuthor) {
    // If not author, check if they are project Admin or Owner
    const task = await Task.findById(comment.taskId);
    if (task) {
      const column = await Column.findById(task.columnId);
      if (column) {
        const project = await projectService.getProjectById(column.projectId);
        const member = project.members.find(m => m.userId._id.toString() === userId.toString());
        if (member && (member.role === 'admin' || member.role === 'owner')) {
          isManager = true;
        }
      }
    }
  }

  if (!isAuthor && !isManager) {
    throw new ApiError(403, 'Bạn không có quyền xóa bình luận này');
  }

  await comment.deleteOne();
};

module.exports = {
  createComment,
  getCommentsByTaskId,
  updateComment,
  deleteComment,
};
