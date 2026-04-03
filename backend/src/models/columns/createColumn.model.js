/**
 * Create Column Model — Lọc và chuẩn hóa dữ liệu tạo cột từ request body
 * @param {Object} body
 * @returns {Object}
 */
const toCreateColumnModel = ({ projectId, title, color }) => {
  const data = {
    projectId,
    title,
  };
  if (color) {
    data.color = color;
  }
  return data;
};

module.exports = { toCreateColumnModel };
