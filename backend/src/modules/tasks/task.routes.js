const express = require('express');
const taskController = require('./task.controller');
const taskValidator = require('./task.validator');
const { validate } = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
// NOTE: Optional middlewares for checking column / task owner can be added here
// const { requireColumnOwner, requireProjectOwnerFromBody } = require('../../middlewares/column.middleware');

const router = express.Router();

router.use(authenticate);

router.route('/column/:columnId')
  .get(taskController.getTasksByColumnId);

router.route('/')
  .post(validate(taskValidator.createTaskSchema), taskController.createTask);

router.route('/move')
  .post(validate(taskValidator.moveTaskSchema), taskController.moveTask);

router.route('/:taskId')
  .get(taskController.getTaskById)
  .put(validate(taskValidator.updateTaskSchema), taskController.updateTask)
  .delete(taskController.deleteTask);

router.route('/:taskId/tags')
  .post(validate(taskValidator.addTagsSchema), taskController.addTags);

router.route('/:taskId/tags/:tagName')
  .delete(taskController.removeTag);

module.exports = router;
