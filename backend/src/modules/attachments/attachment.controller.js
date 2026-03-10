const attachmentService = require('./attachment.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const { toAttachmentResponseDTO } = require('./dtos/attachmentResponse.dto');

/**
 * POST /api/v1/attachments/task/:taskId
 * Upload an attachment
 */
const uploadAttachment = catchAsync(async (req, res) => {
  const attachment = await attachmentService.uploadAttachment(req.params.taskId, req.file);
  new ApiResponse(201, 'Tải lên đính kèm thành công', { attachment: toAttachmentResponseDTO(attachment) }).send(res);
});

/**
 * GET /api/v1/attachments/task/:taskId
 * Get attachments for a specific task
 */
const getTaskAttachments = catchAsync(async (req, res) => {
  const attachments = await attachmentService.getTaskAttachments(req.params.taskId);
  new ApiResponse(200, 'Lấy danh sách đính kèm thành công', { attachments: attachments.map(toAttachmentResponseDTO) }).send(res);
});

/**
 * DELETE /api/v1/attachments/:attachmentId
 * Delete an attachment
 */
const deleteAttachment = catchAsync(async (req, res) => {
  await attachmentService.deleteAttachment(req.params.attachmentId);
  new ApiResponse(200, 'Xóa file đính kèm thành công').send(res);
});

module.exports = {
  uploadAttachment,
  getTaskAttachments,
  deleteAttachment,
};
