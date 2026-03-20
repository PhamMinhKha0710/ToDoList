/**
 * Login DTO — Lọc và chuẩn hóa dữ liệu đăng nhập từ request body
 * @param {Object} body
 * @returns {{ email, password }}
 */
const toLoginDTO = ({ email, password }) => ({ email, password });

module.exports = { toLoginDTO };
