/**
 * Create Column DTO — Lọc và chuẩn hóa dữ liệu tạo cột từ request body
 * @param {Object} body
 * @returns {Object}
 */
const toCreateColumnDTO = ({ projectId, title, color }) => {
  const data = {
    projectId,
    title,
  };
  if (color) {
    data.color = color;
  }
  return data;
};

module.exports = { toCreateColumnDTO };
