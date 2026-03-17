const catchAsync = require('../utils/catchAsync');
const uploadService = require('../services/upload.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class UploadController {
  /**
   * POST /api/upload
   */
  uploadFile = catchAsync(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, 'Vui lòng chọn một file hình ảnh để tải lên');
    }

    const imageUrl = uploadService.handleUpload(req.file);

    res.status(200).json(new ApiResponse(200, { imageUrl }, 'Tải ảnh lên thành công'));
  });
}

module.exports = new UploadController();
