const { Router } = require('express');
const { adminController } = require('../../container');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { updateUserStatusSchema } = require('../../validators/user.validator');
const { adminCreateProjectSchema, adminUpdateProjectSchema } = require('../../validators/project.validator');

const router = Router();

// GET /api/admin/users
router.get('/users', authenticate, requireRole('admin'), adminController.getAllUsers);

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', authenticate, requireRole('admin'), adminController.updateRole);

// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', authenticate, requireRole('admin'), adminController.resetPassword);

// PATCH /api/admin/users/:id/active
router.patch('/users/:id/active', authenticate, requireRole('admin'), validate(updateUserStatusSchema), adminController.setActive);

// GET /api/admin/dashboard/tasks
router.get('/dashboard/tasks', authenticate, requireRole('admin'), adminController.getDashboardTasks);

// Project Management
router.get('/projects', authenticate, requireRole('admin'), adminController.getAllProjects);
router.post('/projects', authenticate, requireRole('admin'), validate(adminCreateProjectSchema), adminController.createProject);
router.put('/projects/:id', authenticate, requireRole('admin'), validate(adminUpdateProjectSchema), adminController.updateProject);
router.delete('/projects/:id', authenticate, requireRole('admin'), adminController.deleteProject);

module.exports = router;
