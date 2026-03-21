const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');

// Các module khác sẽ được thêm dần khi implement
// const projectRoutes = require('../modules/projects/project.routes');
// const columnRoutes = require('../modules/columns/column.routes');
// const taskRoutes = require('../modules/tasks/task.routes');
// const commentRoutes = require('../modules/comments/comment.routes');
// const attachmentRoutes = require('../modules/attachments/attachment.routes');
// const notificationRoutes = require('../modules/notifications/notification.routes');
// const personalTaskRoutes = require('../modules/personal-tasks/personalTask.routes');
// const adminRoutes = require('../modules/admin/admin.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin/users', userRoutes);
// router.use('/projects', projectRoutes);
// router.use('/columns', columnRoutes);
// router.use('/tasks', taskRoutes);
// router.use('/comments', commentRoutes);
// router.use('/attachments', attachmentRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/personal-tasks', personalTaskRoutes);
// router.use('/admin', adminRoutes);

module.exports = router;
