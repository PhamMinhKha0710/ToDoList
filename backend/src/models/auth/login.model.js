/**
 * Login Model — Lọc và chuẩn hóa dữ liệu đăng nhập từ request body
 * @param {Object} body
 * @returns {{ email, password }}
 */
const toLoginModel = ({ email, password }) => ({ email, password });

module.exports = { toLoginModel };
