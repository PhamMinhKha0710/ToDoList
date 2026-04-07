/**
 * CreateComment Model — Chuan hoa du lieu tao Comment
 * @param {Object} data
 */
const toCreateCommentModel = (data) => {
  if (!data) return null;

  return {
    taskId: data.taskId,
    authorId: data.authorId,
    content: data.content,
    parentId: data.parentId || null,
  };
};

module.exports = { toCreateCommentModel };