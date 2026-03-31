/**
 * Comment DTO — Chuẩn hóa dữ liệu trả về của Comment
 * @param {Object} comment
 */
const toCommentDTO = (comment) => {
  if (!comment) return null;

  return {
    _id: comment._id,
    taskId: comment.taskId,
    authorId: comment.authorId, // Nên truyền vào object đã populate
    content: comment.content,
    parentId: comment.parentId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
};

module.exports = { toCommentDTO };
