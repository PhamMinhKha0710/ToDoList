/**
 * Register DTO — Lọc và chuẩn hóa dữ liệu đăng ký từ request body
 * @param {Object} body
 * @returns {{ email, password, displayName }}
 */
const toRegisterDTO = ({ email, password, displayName }) => ({
  email,
  password,
  displayName: displayName || '',
});

module.exports = { toRegisterDTO };
