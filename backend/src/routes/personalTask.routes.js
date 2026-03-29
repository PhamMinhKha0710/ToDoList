const express = require('express');
const personalTaskController = require('../controllers/personalTask.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.route('/')
  .post(personalTaskController.createPersonalTask)
  .get(personalTaskController.getPersonalTasks);

router.route('/:taskId')
  .get(personalTaskController.getPersonalTaskById)
  .put(personalTaskController.updatePersonalTask)
  .delete(personalTaskController.deletePersonalTask);

module.exports = router;
