const express = require('express');
const uploadController = require('../controllers/upload.controller');
const upload = require('../middlewares/upload.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// Tải file lên - Yêu cầu đăng nhập và sử dụng middleware multer (upload.single('file'))
router.post('/', authenticate, upload.single('file'), uploadController.uploadFile);

module.exports = router;
