class AttachmentRepository {
  constructor({ Attachment }) {
    this.Attachment = Attachment;
  }

  createAttachment = async (attachmentData) => {
    return await this.Attachment.create(attachmentData);
  };

  getAttachmentsByTaskId = async (taskId) => {
    return await this.Attachment.find({ taskId }).sort({ createdAt: -1 });
  };

  getAttachmentById = async (attachmentId) => {
    return await this.Attachment.findById(attachmentId);
  };

  deleteAttachment = async (attachmentId) => {
    return await this.Attachment.findByIdAndDelete(attachmentId);
  };
}

module.exports = new AttachmentRepository({
  Attachment: require('../../entities/Attachment'),
});
