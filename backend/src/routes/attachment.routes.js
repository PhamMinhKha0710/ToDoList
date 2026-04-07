const express = require('express');
const { attachmentController } = require('../container');
const attachmentValidator = require('../validators/attachment.validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(authenticate);

router.route('/task/:taskId')
  .get(attachmentController.getTaskAttachments)
  .post(
    validate(attachmentValidator.uploadAttachmentSchema, 'params'),
    upload.single('file'),
    attachmentController.uploadAttachment
  );

router.route('/:attachmentId')
  .delete(attachmentController.deleteAttachment);

module.exports = router;
