const express = require('express');
const { taskController } = require('../container');
const taskValidator = require('../validators/task.validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(taskController.getAllTasksForUser)
  .post(upload.array('attachments', 5), validate(taskValidator.createTaskSchema), taskController.createTask);

router.route('/column/:columnId')
  .get(taskController.getTasksByColumnId);

router.post('/move', validate(taskValidator.moveTaskSchema), taskController.moveTask);

router.route('/:taskId')
  .get(taskController.getTaskById)
  .put(validate(taskValidator.updateTaskSchema), taskController.updateTask)
  .delete(taskController.deleteTask);

router.post('/:taskId/tags', validate(taskValidator.addTagsSchema), taskController.addTags);
router.delete('/:taskId/tags/:tagName', taskController.removeTag);

module.exports = router;
