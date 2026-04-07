const eventBus = require('../utils/eventBus');

class AttachmentService {
  constructor({ fs, path, attachmentRepository, Task, PersonalTask, Column, ApiError }) {
    this.fs = fs;
    this.path = path;
    this.attachmentRepository = attachmentRepository;
    this.Task = Task;
    this.PersonalTask = PersonalTask;
    this.Column = Column;
    this.ApiError = ApiError;
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
      if (file && file.path) this.fs.unlinkSync(file.path);
      throw new this.ApiError(404, 'Không tìm thấy Task để đính kèm file');
    }

    if (!file) throw new this.ApiError(400, 'Không tìm thấy file tải lên');

    const fileUrl = `/uploads/${file.filename}`;
    const attachment = await this.attachmentRepository.createAttachment({
      taskId,
      fileName: file.originalname,
      fileUrl,
    });

    const column = await this.Column.findById(task.columnId).select('projectId').lean();
    if (column) {
      eventBus.emitAsync('attachment.uploaded', {
        projectId: column.projectId.toString(),
        userId,
        taskId,
        taskTitle: task.title,
        fileName: file.originalname,
        fileUrl,
      });
    }

    return attachment;
  };

  getTaskAttachments = async (taskId) => {
    const taskExists = await this._taskExists(taskId);
    if (!taskExists) throw new this.ApiError(404, 'Không tìm thấy Task');
    return await this.attachmentRepository.getAttachmentsByTaskId(taskId);
  };

  deleteAttachment = async (attachmentId, userId) => {
    const attachment = await this.attachmentRepository.getAttachmentById(attachmentId);
    if (!attachment) throw new this.ApiError(404, 'Không tìm thấy file đính kèm');

    const task = await this.Task.findById(attachment.taskId).select('title columnId').lean();
    if (task) {
      const column = await this.Column.findById(task.columnId).select('projectId').lean();
      if (column) {
        eventBus.emitAsync('attachment.deleted', {
          projectId: column.projectId.toString(),
          userId,
          taskId: attachment.taskId,
          taskTitle: task.title,
          fileName: attachment.fileName,
        });
      }
    }

    try {
      const filename = attachment.fileUrl.split('/uploads/')[1];
      if (filename) {
        const filePath = this.path.join(__dirname, '../../public/uploads', filename);
        if (this.fs.existsSync(filePath)) this.fs.unlinkSync(filePath);
      }
    } catch (error) {
      // Silently handle file deletion errors
    }

    await this.attachmentRepository.deleteAttachment(attachmentId);
  };
}

module.exports = AttachmentService;
