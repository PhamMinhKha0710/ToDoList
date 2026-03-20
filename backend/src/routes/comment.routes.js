const express = require('express');
const commentController = require('../controllers/comment.controller');
const commentValidator = require('../validators/comment.validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.route('/task/:taskId')
  .get(commentController.getCommentsByTaskId);

router.route('/')
  .post(validate(commentValidator.createCommentSchema), commentController.createComment);

router.route('/:commentId')
  .put(validate(commentValidator.updateCommentSchema), commentController.updateComment)
  .delete(commentController.deleteComment);

module.exports = router;
