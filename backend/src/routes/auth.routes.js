const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate.middleware');
const { otpLimiter } = require('../middlewares/rateLimiter.middleware');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  requestOtpSchema,
  verifyOtpSchema,
} = require('../validators/auth.validator');

const router = Router();

// POST /api/v1/auth/register
router.post('/register', validate(registerSchema), controller.register);

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), controller.login);

// POST /api/v1/auth/logout
router.post('/logout', controller.logout);

// POST /api/v1/auth/refresh-token
router.post('/refresh-token', controller.refreshToken);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), controller.forgotPassword);

// POST /api/v1/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), controller.resetPassword);

// POST /api/v1/auth/request-otp
router.post('/request-otp', otpLimiter, validate(requestOtpSchema), controller.requestOtp);

// POST /api/v1/auth/verify-otp
router.post('/verify-otp', validate(verifyOtpSchema), controller.verifyOtp);

module.exports = router;
