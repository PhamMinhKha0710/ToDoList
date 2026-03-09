/**
 * Bọc async controller function, tự động catch lỗi và
 * chuyển xuống error middleware (next(err))
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
