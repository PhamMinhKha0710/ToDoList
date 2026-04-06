class AttachmentService {
  constructor({ fs, path, attachmentRepository, Task, PersonalTask, Column, ApiError, activityService, CLIENT_URL }) {
    this.fs = fs;
    this.path = path;
    this.attachmentRepository = attachmentRepository;
    this.Task = Task;
    this.PersonalTask = PersonalTask;
    this.Column = Column;
    this.ApiError = ApiError;
    this.activityService = activityService;
    this.CLIENT_URL = CLIENT_URL;
  }

  _taskExists = async (taskId) => {
    const projectTaskExists = await this.Task.exists({ _id: taskId });
    if (projectTaskExists) return true;
    const personalTaskExists = await this.PersonalTask.exists({ _id: taskId });
    return !!personalTaskExists;
  };

  uploadAttachment = async (taskId, file, userId) => {
    const task = await this.Task.findById(taskId).select('title columnId').lean();
    if (!task) {
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

    const attachment = await this.attachmentRepository.createAttachment(attachmentData);

    // Logging Activity
    const column = await this.Column.findById(task.columnId).select('projectId').lean();
    if (column) {
      await this.activityService.createActivityLog({
        projectId: column.projectId,
        userId,
        action: 'FILE_ATTACHED',
        entityType: 'task',
        entityId: taskId,
        detail: {
          taskTitle: task.title,
          fileName: file.originalname,
          fileUrl: fileUrl,
          isImage: /\.(jpg|jpeg|png|gif)$/i.test(file.originalname)
        }
      });
    }

    return attachment;
  };

  getTaskAttachments = async (taskId) => {
    const taskExists = await this._taskExists(taskId);
    if (!taskExists) {
      throw new this.ApiError(404, 'Không tìm thấy Task');
    }

    return await this.attachmentRepository.getAttachmentsByTaskId(taskId);
  };

  deleteAttachment = async (attachmentId, userId) => {
    const attachment = await this.attachmentRepository.getAttachmentById(attachmentId);
    if (!attachment) {
      throw new this.ApiError(404, 'Không tìm thấy file đính kèm');
    }

    const task = await this.Task.findById(attachment.taskId).select('title columnId').lean();
    if (task) {
      const column = await this.Column.findById(task.columnId).select('projectId').lean();
      if (column) {
        await this.activityService.createActivityLog({
          projectId: column.projectId,
          userId,
          action: 'FILE_REMOVED',
          entityType: 'task',
          entityId: attachment.taskId,
          detail: {
            taskTitle: task.title,
            fileName: attachment.fileName
          }
        });
      }
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
  Column: require('../entities/Column'),
  ApiError: require('../utils/ApiError'),
  activityService: require('./activity.service'),
  CLIENT_URL: require('../config/env').CLIENT_URL,
});
