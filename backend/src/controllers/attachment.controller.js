const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { toAttachmentResponseModel } = require('../models/attachments/attachmentResponse.model');

class AttachmentController {
  constructor({ attachmentService, ApiResponse, catchAsync }) {
    this.attachmentService = attachmentService;

  }

  uploadAttachment = catchAsync(async (req, res) => {
    const attachment = await this.attachmentService.uploadAttachment(req.params.taskId, req.file, req.user._id);
    new ApiResponse(201, 'Tải lên đính kèm thành công', { attachment: toAttachmentResponseModel(attachment) }).send(res);
  });

  getTaskAttachments = catchAsync(async (req, res) => {
    const attachments = await this.attachmentService.getTaskAttachments(req.params.taskId);
    new ApiResponse(200, 'Lấy danh sách đính kèm thành công', { attachments: attachments.map(toAttachmentResponseModel) }).send(res);
  });

  deleteAttachment = catchAsync(async (req, res) => {
    await this.attachmentService.deleteAttachment(req.params.attachmentId, req.user._id);
    new ApiResponse(200, 'Xóa file đính kèm thành công').send(res);
  });
}

module.exports = AttachmentController;
