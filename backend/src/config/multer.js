const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer DiskStorage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save to local public/uploads/
  },
  filename: function (req, file, cb) {
    // Generate unique name: timestamp + random string + extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// File filter (optional: restrict by mimetype)
const fileFilter = (req, file, cb) => {
  // Always accept if no restriction, or filter specific types:
  // e.g. /jpeg|jpg|png|gif|pdf|doc|docx/
  if (file.mimetype.match(/\/(jpeg|jpg|png|gif|pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Định dạng file không được hỗ trợ'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit size to 5MB
  },
  fileFilter: fileFilter,
});

module.exports = upload;
