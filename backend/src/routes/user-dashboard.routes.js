const express = require('express');
const { userDashboardController } = require('../container');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/stats', userDashboardController.getDashboardStats);

module.exports = router;
