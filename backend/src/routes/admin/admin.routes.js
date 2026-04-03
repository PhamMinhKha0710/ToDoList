const { Router } = require('express');
const controller = require('../../controllers/admin/admin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { updateUserStatusSchema } = require('../../validators/user.validator');

const router = Router();

// GET /api/admin/users
router.get('/users', authenticate, requireRole('admin'), controller.getAllUsers);

// PATCH /api/admin/users/:id/active
router.patch('/users/:id/active', authenticate, requireRole('admin'), validate(updateUserStatusSchema), controller.setActive);

// GET /api/admin/dashboard/tasks
router.get('/dashboard/tasks', authenticate, requireRole('admin'), controller.getDashboardTasks);

module.exports = router;
