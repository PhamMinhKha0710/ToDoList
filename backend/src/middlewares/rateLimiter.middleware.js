const rateLimit = require('express-rate-limit');

// Rate limiter cho gửi OTP (Tối đa 3 lần / 10 phút)
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 3, 
  message: { 
    success: false, 
    message: 'Bạn đã yêu cầu gửi mã OTP quá nhiều lần. Vui lòng thử lại sau 10 phút.' 
  },
  keyGenerator: (req) => {
    return req.body.email || req.user?.email || req.ip;
  }
});

module.exports = { otpLimiter };
