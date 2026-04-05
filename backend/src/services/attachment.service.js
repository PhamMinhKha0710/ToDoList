class AttachmentService {
  constructor({ fs, path, attachmentRepository, Task, PersonalTask, ApiError, CLIENT_URL }) {
    this.fs = fs;
    this.path = path;
    this.attachmentRepository = attachmentRepository;
    this.Task = Task;
    this.PersonalTask = PersonalTask;
    this.ApiError = ApiError;
    this.CLIENT_URL = CLIENT_URL;
  }

  _taskExists = async (taskId) => {
    const projectTaskExists = await this.Task.exists({ _id: taskId });
    if (projectTaskExists) return true;
    const personalTaskExists = await this.PersonalTask.exists({ _id: taskId });
    return !!personalTaskExists;
  };

  uploadAttachment = async (taskId, file) => {
    const taskExists = await this._taskExists(taskId);
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
    const taskExists = await this._taskExists(taskId);
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
        const filePath = this.path.join(__dirname, '../../public/uploads', filename);
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
  attachmentRepository: require('../repositories/attachment.repository'),
  Task: require('../entities/Task'),
  PersonalTask: require('../entities/PersonalTask'),
  ApiError: require('../utils/ApiError'),
  CLIENT_URL: require('../config/env').CLIENT_URL,
});
