const { Router } = require('express');
const authRoutes = require('./auth.routes');
const uploadRoutes = require('./upload.routes');
const activityRoutes = require('./activity.routes');
const userRoutes = require('./user.routes');
const projectRoutes = require('./project.routes');
const columnRoutes = require('./column.routes');
const taskRoutes = require('./task.routes');
const commentRoutes = require('./comment.routes');
const attachmentRoutes = require('./attachment.routes');
const notificationRoutes = require('./notification.routes');
const personalTaskRoutes = require('./personalTask.routes');
const adminRoutes = require('./admin.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/columns', columnRoutes);
router.use('/tasks', taskRoutes);
router.use('/comments', commentRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/personal-tasks', personalTaskRoutes);
router.use('/admin', adminRoutes);

router.use('/upload', uploadRoutes);
router.use('/activities', activityRoutes);

module.exports = router;
