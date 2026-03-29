class AttachmentService {
  constructor({ fs, path, attachmentRepository, Task, ApiError }) {
    this.fs = fs;
    this.path = path;
    this.attachmentRepository = attachmentRepository;
    this.Task = Task;
    this.ApiError = ApiError;
  }

  uploadAttachment = async (taskId, file) => {
    const taskExists = await this.Task.exists({ _id: taskId });
    if (!taskExists) {
      if (file && file.path) {
        this.fs.unlinkSync(file.path);
      }
      throw new this.ApiError(404, 'Không tìm thấy Task để đính kèm file');
    }

    if (!file) {
      throw new this.ApiError(400, 'Không tìm thấy file tải lên');
    }

    const fileUrl = `/uploads/${file.filename}`;

    const attachmentData = {
      taskId,
      fileName: file.originalname,
      fileUrl: fileUrl,
    };

    return await this.attachmentRepository.createAttachment(attachmentData);
  };

  getTaskAttachments = async (taskId) => {
    const taskExists = await this.Task.exists({ _id: taskId });
    if (!taskExists) {
      throw new this.ApiError(404, 'Không tìm thấy Task');
    }

    return await this.attachmentRepository.getAttachmentsByTaskId(taskId);
  };

  deleteAttachment = async (attachmentId) => {
    const attachment = await this.attachmentRepository.getAttachmentById(attachmentId);
    if (!attachment) {
      throw new this.ApiError(404, 'Không tìm thấy file đính kèm');
    }

    try {
      const filename = attachment.fileUrl.split('/uploads/')[1];
      if (filename) {
        const filePath = this.path.join(__dirname, '../../../public/uploads', filename);
        if (this.fs.existsSync(filePath)) {
          this.fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Lỗi khi xóa file vật lý:', error);
    }

    await this.attachmentRepository.deleteAttachment(attachmentId);
  };
}

module.exports = new AttachmentService({
  fs: require('fs'),
  path: require('path'),
  attachmentRepository: require('./attachment.repository'),
  Task: require('../../entities/Task'),
  ApiError: require('../../utils/ApiError'),
});
