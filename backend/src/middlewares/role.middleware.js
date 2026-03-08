const ApiError = require('../utils/ApiError');

/**
 * Middleware factory kiểm tra role của người dùng
 * Sử dụng sau authenticate middleware
 *
 * @param {...string} roles - Danh sách role được phép (vd: 'admin')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Bạn chưa đăng nhập'));
  }
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Bạn không có quyền thực hiện hành động này'));
  }
  next();
};

module.exports = { requireRole };
