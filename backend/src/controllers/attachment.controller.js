const attachmentService = require('../services/attachment.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { toAttachmentResponseModel } = require('../models/attachments/attachmentResponse.model');

class AttachmentController {
  /**
   * POST /api/v1/attachments/task/:taskId
   * Upload an attachment
   */
  uploadAttachment = catchAsync(async (req, res) => {
    const attachment = await attachmentService.uploadAttachment(req.params.taskId, req.file, req.user._id);
    new ApiResponse(201, 'Tải lên đính kèm thành công', { attachment: toAttachmentResponseModel(attachment) }).send(res);
  });

  /**
   * GET /api/v1/attachments/task/:taskId
   * Get attachments for a specific task
   */
  getTaskAttachments = catchAsync(async (req, res) => {
    const attachments = await attachmentService.getTaskAttachments(req.params.taskId);
    new ApiResponse(200, 'Lấy danh sách đính kèm thành công', { attachments: attachments.map(toAttachmentResponseModel) }).send(res);
  });

  /**
   * DELETE /api/v1/attachments/:attachmentId
   * Delete an attachment
   */
  deleteAttachment = catchAsync(async (req, res) => {
    await attachmentService.deleteAttachment(req.params.attachmentId, req.user._id);
    new ApiResponse(200, 'Xóa file đính kèm thành công').send(res);
  });
}

module.exports = new AttachmentController();
