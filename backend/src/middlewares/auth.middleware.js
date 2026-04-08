const { tokenService } = require("../container");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

/**
 * Middleware xác thực JWT Access Token
 * Gắn req.user = { _id, role } nếu hợp lệ
 */
const authenticate = catchAsync(async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Bạn chưa đăng nhập");
  }

  const token = authHeader.split(" ")[1];
  const payload = tokenService.verifyAccessToken(token);
  // console.log("payload: ", payload);
  req.user = payload; // { _id, role, email, displayName }
  next();
});

module.exports = { authenticate };
