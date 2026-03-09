const { Router } = require('express');
const controller = require('./auth.controller');
const { validate } = require('../../middlewares/validate.middleware');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('./auth.validator');

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

module.exports = router;
