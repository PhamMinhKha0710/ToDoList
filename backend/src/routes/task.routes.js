const express = require('express');
const taskController = require('../controllers/task.controller');
const taskValidator = require('../validators/task.validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { canWriteTask, canModifyTask } = require('../middlewares/project.middleware');
const upload = require('../middlewares/upload.middleware');

const parseFormData = (req, res, next) => {
  ['tags', 'assignees'].forEach(field => {
    if (req.body[field] && typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (e) {}
    }
  });
  next();
};

const router = express.Router();

router.use(authenticate);

router.route('/column/:columnId')
  .get(taskController.getTasksByColumnId);

router.route('/')
  .get(taskController.getAllTasksForUser)
  // canWriteTask: chặn Viewer không được tạo task
  .post(upload.array('files'), parseFormData, validate(taskValidator.createTaskSchema), canWriteTask, taskController.createTask);

router.route('/move')
  .post(validate(taskValidator.moveTaskSchema), canModifyTask, taskController.moveTask);

router.route('/:taskId')
  .get(taskController.getTaskById)
  // canModifyTask: Owner/Admin tự do; Member chỉ sửa task của mình; Viewer bị chặn
  .put(validate(taskValidator.updateTaskSchema), canModifyTask, taskController.updateTask)
  .delete(canModifyTask, taskController.deleteTask);

router.route('/:taskId/tags')
  .post(validate(taskValidator.addTagsSchema), taskController.addTags);

router.route('/:taskId/tags/:tagName')
  .delete(taskController.removeTag);

module.exports = router;
