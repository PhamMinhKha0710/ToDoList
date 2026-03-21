const express = require('express');
const attachmentController = require('./attachment.controller');
const attachmentValidator = require('./attachment.validator');
const { validate } = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

const router = express.Router();

router.use(authenticate);

// Middleware xử lý lỗi từ multer (VD: File size limit, wrong type) có thể được handle ở error middleware chung
// Nhưng file upload() của multer là middleware express cơ bản.
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
