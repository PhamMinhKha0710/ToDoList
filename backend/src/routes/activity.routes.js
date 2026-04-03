const express = require('express');
const activityController = require('../controllers/activity.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/project/:projectId', activityController.getProjectActivities);
router.get('/task/:taskId', activityController.getTaskActivities);

module.exports = router;
