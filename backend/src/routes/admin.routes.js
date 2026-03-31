const { Router } = require('express');
const controller = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { updateUserStatusSchema } = require('../validators/user.validator');

const router = Router();

// GET /api/admin/users
router.get('/users', authenticate, requireRole('admin'), controller.getAllUsers);

// PATCH /api/admin/users/:id/active
router.patch('/users/:id/active', authenticate, requireRole('admin'), validate(updateUserStatusSchema), controller.setActive);

module.exports = router;
