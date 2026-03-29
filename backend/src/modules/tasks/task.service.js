class TaskService {
  constructor({ taskRepository, Column, Task, ApiError, attachmentRepository }) {
    this.taskRepository = taskRepository;
    this.Column = Column;
    this.Task = Task;
    this.ApiError = ApiError;
    this.attachmentRepository = attachmentRepository;
  }

  createTask = async (taskData, files) => {
    const column = await this.Column.findById(taskData.columnId);
    if (!column) {
      throw new this.ApiError(404, 'Không tìm thấy cột tương ứng');
    }

    return await this.taskRepository.createTask(taskData, files);
  };

  getTasksByColumnId = async (columnId) => {
    return await this.taskRepository.getTasksByColumnId(columnId);
  };

  getAllTasks = async () => {
    return await this.taskRepository.getAllTasks();
  };

  getTaskById = async (taskId) => {
    const task = await this.taskRepository.getTaskById(taskId);
    if (!task) {
      throw new this.ApiError(404, 'Không tìm thấy task');
    }
    return task;
  };

  updateTask = async (taskId, updateData) => {
    const task = await this.taskRepository.updateTask(taskId, updateData);
    if (!task) {
      throw new this.ApiError(404, 'Không tìm thấy task để cập nhật');
    }
    return task;
  };

  deleteTask = async (taskId) => {
    const task = await this.taskRepository.getTaskById(taskId);
    if (!task) {
      throw new this.ApiError(404, 'Không tìm thấy task để xóa');
    }

    const columnId = task.columnId;
    const deletedPosition = task.position;

    await this.taskRepository.deleteTask(taskId);

    await this.Task.updateMany(
      { columnId, position: { $gt: deletedPosition } },
      { $inc: { position: -1 } }
    );
  };

  moveTask = async (moveData) => {
    const { taskId, sourceColumnId, destinationColumnId, sourceTaskIds, destinationTaskIds } = moveData;

    const task = await this.taskRepository.getTaskById(taskId);
    if (!task) {
      throw new this.ApiError(404, 'Không tìm thấy task');
    }

    if (sourceColumnId === destinationColumnId) {
      await this.taskRepository.reorderTasks(sourceTaskIds, sourceColumnId);
    } else {
      await this.taskRepository.reorderTasks(
        sourceTaskIds,
        sourceColumnId,
        destinationTaskIds,
        destinationColumnId,
        taskId
      );
    }
  };

  addTagsToTask = async (taskId, tagsArray) => {
    const task = await this.taskRepository.getTaskById(taskId);
    if (!task) {
      throw new this.ApiError(404, 'Không tìm thấy task để thêm tag');
    }

    if (!tagsArray || tagsArray.length === 0) {
      return task;
    }

    const existingNames = task.tags.map(t => t.name.toLowerCase());
    const newTagsToInsert = tagsArray.filter(t => !existingNames.includes(t.name.toLowerCase()));

    if (newTagsToInsert.length === 0) {
      return task;
    }

    return await this.taskRepository.addTagsToTask(taskId, newTagsToInsert);
  };

  removeTagFromTask = async (taskId, tagName) => {
    const task = await this.taskRepository.getTaskById(taskId);
    if (!task) {
      throw new this.ApiError(404, 'Không tìm thấy task để xóa tag');
    }

    return await this.taskRepository.removeTagFromTask(taskId, tagName);
  };
}

module.exports = new TaskService({
  taskRepository: require('./task.repository'),
  Column: require('../../entities/Column'),
  Task: require('../../entities/Task'),
  ApiError: require('../../utils/ApiError'),
  attachmentRepository: require('../attachments/attachment.repository'),
});
