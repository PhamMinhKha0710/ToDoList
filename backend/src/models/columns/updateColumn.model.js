/**
 * Update Column DTO — Lọc và chuẩn hóa dữ liệu cập nhật cột từ request body
 * @param {Object} body
 * @returns {Object}
 */
const toUpdateColumnDTO = ({ title, color }) => {
  const data = {};
  if (title !== undefined) {
    data.title = title;
  }
  if (color !== undefined) {
    data.color = color;
  }
  return data;
};

module.exports = { toUpdateColumnDTO };
