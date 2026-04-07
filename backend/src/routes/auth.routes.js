const { Router } = require('express');
const { authController } = require('../container');
const { validate } = require('../middlewares/validate.middleware');
const { otpLimiter } = require('../middlewares/rateLimiter.middleware');
const passport = require('../config/passport');
const {
  registerSchema, loginSchema, forgotPasswordSchema,
  resetPasswordSchema, requestOtpSchema, verifyOtpSchema,
} = require('../validators/auth.validator');
const { CLIENT_URL } = require('../config/env');

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/request-otp', otpLimiter, validate(requestOtpSchema), authController.requestOtp);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${CLIENT_URL}/login?error=google_failed`, session: false }),
  authController.googleCallback
);

module.exports = router;
