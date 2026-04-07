const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
class UploadController {
  constructor({ uploadService, ApiError, ApiResponse, catchAsync }) {
    this.uploadService = uploadService;

  }

  /**
   * POST /api/upload
   */
  uploadFile = catchAsync(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, 'Vui lòng chọn một file hình ảnh để tải lên');
    }

    const imageUrl = this.uploadService.handleUpload(req.file);

    new ApiResponse(200, 'Tải ảnh lên thành công', { imageUrl }).send(res);
  });
}

module.exports = UploadController;
