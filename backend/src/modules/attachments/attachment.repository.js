const Attachment = require('../../models/Attachment');

const createAttachment = async (attachmentData) => {
  return await Attachment.create(attachmentData);
};

const getAttachmentsByTaskId = async (taskId) => {
  return await Attachment.find({ taskId }).sort({ createdAt: -1 });
};

const getAttachmentById = async (attachmentId) => {
  return await Attachment.findById(attachmentId);
};

const deleteAttachment = async (attachmentId) => {
  return await Attachment.findByIdAndDelete(attachmentId);
};

module.exports = {
  createAttachment,
  getAttachmentsByTaskId,
  getAttachmentById,
  deleteAttachment,
};
