const { Router } = require('express');
const controller = require('./user.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { updateUserStatusSchema } = require('./user.validator');

const router = Router();

// GET /api/v1/admin/users
router.get('/', authenticate, requireRole('admin'), controller.getAllUsers);

// PATCH /api/v1/admin/users/:id/active
router.patch('/:id/active', authenticate, requireRole('admin'), validate(updateUserStatusSchema), controller.setActive);

module.exports = router;
