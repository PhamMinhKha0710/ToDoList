const { Router } = require('express');
const controller = require('../../controllers/admin/admin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { updateUserStatusSchema } = require('../../validators/user.validator');

const { adminCreateProjectSchema, adminUpdateProjectSchema } = require('../../validators/project.validator');

const router = Router();

// GET /api/admin/users
router.get('/users', authenticate, requireRole('admin'), controller.getAllUsers);

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', authenticate, requireRole('admin'), controller.updateRole);

// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', authenticate, requireRole('admin'), controller.resetPassword);

// PATCH /api/admin/users/:id/active
router.patch('/users/:id/active', authenticate, requireRole('admin'), validate(updateUserStatusSchema), controller.setActive);

// GET /api/admin/dashboard/tasks
router.get('/dashboard/tasks', authenticate, requireRole('admin'), controller.getDashboardTasks);

// Project Management
// GET /api/admin/projects
router.get('/projects', authenticate, requireRole('admin'), controller.getAllProjects);

// POST /api/admin/projects
router.post('/projects', authenticate, requireRole('admin'), validate(adminCreateProjectSchema), controller.createProject);

// PUT /api/admin/projects/:id
router.put('/projects/:id', authenticate, requireRole('admin'), validate(adminUpdateProjectSchema), controller.updateProject);

// DELETE /api/admin/projects/:id
router.delete('/projects/:id', authenticate, requireRole('admin'), controller.deleteProject);

module.exports = router;
