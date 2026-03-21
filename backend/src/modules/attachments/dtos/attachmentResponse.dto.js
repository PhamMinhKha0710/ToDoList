/**
 * Chuẩn hóa đối tượng Attachment trước khi trả về cho Client
 */
const toAttachmentResponseDTO = (attachment) => {
  if (!attachment) return null;

  return {
    _id: attachment._id,
    taskId: attachment.taskId,
    fileName: attachment.fileName,
    fileUrl: attachment.fileUrl,
    createdAt: attachment.createdAt,
  };
};

module.exports = { toAttachmentResponseDTO };
