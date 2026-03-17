const Comment = require("../entities/Comment");
const ApiError = require("../utils/ApiError");
const Task = require("../entities/Task");
const Column = require("../entities/Column");
const projectService = require("./project.service");
const {
  emitCommentCreated,
  emitCommentDeleted,
  emitCommentUpdated,
} = require("../sockets/comment.socket");

const createComment = async (commentData) => {
  const comment = await Comment.create(commentData);
  // Populate author details immediately so frontend can render securely without another fetch
  const populated = await Comment.findById(comment._id).populate(
    "authorId",
    "displayName email avatarUrl",
  );

  // Realtime
  emitCommentCreated(commentData.taskId.toString(), populated);

  return populated;
};

const getCommentsByTaskId = async (taskId) => {
  return await Comment.find({ taskId })
    .populate("authorId", "displayName email avatarUrl")
    .sort({ createdAt: 1 }); // Sort chronologically (oldest first)
};

const updateComment = async (commentId, authorId, content) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Không tìm thấy bình luận");

  if (comment.authorId.toString() !== authorId.toString()) {
    throw new ApiError(
      403,
      "Bạn chỉ có thể chỉnh sửa bình luận của chính mình",
    );
  }

  comment.content = content;
  await comment.save();

  const updated = await Comment.findById(commentId).populate(
    "authorId",
    "displayName email avatarUrl",
  );

  // Realtime
  emitCommentUpdated(comment.taskId.toString(), updated);

  return updated;
};

const deleteComment = async (commentId, userId, userRole) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Không tìm thấy bình luận");

  const isAuthor = comment.authorId.toString() === userId.toString();
  let isManager = false;

  if (!isAuthor) {
    // If not author, check if they are project Admin or Owner
    const task = await Task.findById(comment.taskId);
    if (task) {
      const column = await Column.findById(task.columnId);
      if (column) {
        const project = await projectService.getProjectById(column.projectId);
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
  }

  if (!isAuthor && !isManager) {
    throw new ApiError(403, "Bạn không có quyền xóa bình luận này");
  }

  const taskId = comment.taskId.toString();
  const idComment = comment._id.toString();

  await comment.deleteOne();

  // Realtime
  emitCommentDeleted(taskId, idComment);
};

module.exports = {
  createComment,
  getCommentsByTaskId,
  updateComment,
  deleteComment,
};
