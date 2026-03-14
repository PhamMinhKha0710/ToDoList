const express = require('express');
const taskController = require('./task.controller');
const taskValidator = require('./task.validator');
const { validate } = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
// NOTE: Optional middlewares for checking column / task owner can be added here
const upload = require('../../middlewares/upload.middleware');

const parseFormData = (req, res, next) => {
  if (req.body.tags && typeof req.body.tags === 'string') {
    try {
      req.body.tags = JSON.parse(req.body.tags);
    } catch (e) {}
  }
  next();
};

const router = express.Router();

router.use(authenticate);

router.route('/column/:columnId')
  .get(taskController.getTasksByColumnId);

router.route('/')
  .post(upload.array('files'), parseFormData, validate(taskValidator.createTaskSchema), taskController.createTask);

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
