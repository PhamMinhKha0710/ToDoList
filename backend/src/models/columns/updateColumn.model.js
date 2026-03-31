/**
 * Update Column Model — Lọc và chuẩn hóa dữ liệu cập nhật cột từ request body
 * @param {Object} body
 * @returns {Object}
 */
const toUpdateColumnModel = ({ title, color }) => {
  const data = {};
  if (title !== undefined) {
    data.title = title;
  }
  if (color !== undefined) {
    data.color = color;
  }
  return data;
};

module.exports = { toUpdateColumnModel };
