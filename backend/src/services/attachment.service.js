const fs = require('fs');
const path = require('path');
const attachmentRepository = require('../repositories/attachment.repository');
const Task = require('../entities/Task');
const ApiError = require('../utils/ApiError');
const { CLIENT_URL } = require('../config/env');

const uploadAttachment = async (taskId, file) => {
  // 1. Verify task exists
  const taskExists = await Task.exists({ _id: taskId });
  if (!taskExists) {
    // If task not found, we should delete the uploaded file to avoid orphaned files
    if (file && file.path) {
      fs.unlinkSync(file.path);
    }
    throw new ApiError(404, 'Không tìm thấy Task để đính kèm file');
  }

  if (!file) {
    throw new ApiError(400, 'Không tìm thấy file tải lên');
  }

  // 2. Build file URL
  const fileUrl = `/uploads/${file.filename}`;

  // 3. Save to DB
  const attachmentData = {
    taskId,
    fileName: file.originalname,
    fileUrl: fileUrl,
  };

  return await attachmentRepository.createAttachment(attachmentData);
};

const getTaskAttachments = async (taskId) => {
  // Verify task exists (optional but good practice)
  const taskExists = await Task.exists({ _id: taskId });
  if (!taskExists) {
    throw new ApiError(404, 'Không tìm thấy Task');
  }

  return await attachmentRepository.getAttachmentsByTaskId(taskId);
};

const deleteAttachment = async (attachmentId) => {
  // 1. Find the attachment record
  const attachment = await attachmentRepository.getAttachmentById(attachmentId);
  if (!attachment) {
    throw new ApiError(404, 'Không tìm thấy file đính kèm');
  }

  // 2. Delete the physical file from local storage
  try {
    const filename = attachment.fileUrl.split('/uploads/')[1];
    if (filename) {
      const filePath = path.join(__dirname, '../../public/uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error('Lỗi khi xóa file vật lý:', error);
    // Ignore physical deletion error, proceed to delete DB record
  }

  // 3. Delete from DB
  await attachmentRepository.deleteAttachment(attachmentId);
};

module.exports = {
  uploadAttachment,
  getTaskAttachments,
  deleteAttachment,
};
