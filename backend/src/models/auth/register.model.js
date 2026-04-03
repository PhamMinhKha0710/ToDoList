/**
 * Register Model — Lọc và chuẩn hóa dữ liệu đăng ký từ request body
 * @param {Object} body
 * @returns {{ email, password, displayName }}
 */
const toRegisterModel = ({ email, password, displayName }) => ({
  email,
  password,
  displayName: displayName || '',
});

module.exports = { toRegisterModel };
