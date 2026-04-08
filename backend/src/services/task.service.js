const eventBus = require('../utils/eventBus');

class TaskService {
  constructor({ taskRepository, Task, Column, ApiError, mongoose }) {
    this.taskRepository = taskRepository;
    this.Task = Task;
    this.Column = Column;
    this.ApiError = ApiError;
    this.mongoose = mongoose;
  }

  async createTask(taskData, files) {
    const column = await this.Column.findById(taskData.columnId);
    if (!column) throw new this.ApiError(404, 'Không tìm thấy cột');

    const count = await this.Task.countDocuments({ columnId: taskData.columnId });
    taskData.position = count;

    const task = await this.taskRepository.createTask(taskData);
    const populated = await this.Task.findById(task._id)
      .populate('assignees', '_id displayName email avatarUrl')
      .populate('creatorId', '_id displayName email avatarUrl');

    const projectId = column.projectId.toString();

    eventBus.emitAsync('task.created', {
      task: populated,
      projectId,
      userId: taskData.creatorId,
      files,
    });

    return populated;
  }

  async getTasksByColumnId(columnId) {
    return await this.taskRepository.getTasksByColumnId(columnId);
  }

  async getTaskById(taskId) {
    const task = await this.taskRepository.getTaskById(taskId);
    if (!task) throw new this.ApiError(404, 'Không tìm thấy tác vụ');
    return task;
  }

  async updateTask(taskId, updateData, userId) {
    const existingTask = await this.Task.findById(taskId).lean();
    if (!existingTask) throw new this.ApiError(404, 'Không tìm thấy tác vụ');

    const task = await this.taskRepository.updateTask(taskId, updateData);
    const populated = await this.Task.findById(task._id)
      .populate('assignees', '_id displayName email avatarUrl')
      .populate('creatorId', '_id displayName email avatarUrl');

    const column = await this.Column.findById(populated.columnId);
    const projectId = column?.projectId?.toString() || null;

    eventBus.emitAsync('task.updated', {
      task: populated,
      existingTask,
      projectId,
      userId,
      updateData,
    });

    return populated;
  }

  async deleteTask(taskId, userId) {
    const task = await this.Task.findById(taskId);
    if (!task) throw new this.ApiError(404, 'Không tìm thấy tác vụ');

    const columnId = task.columnId.toString();
    const column = await this.Column.findById(columnId);
    const projectId = column?.projectId?.toString() || null;

    await this.taskRepository.deleteTask(taskId);

    // Cập nhật position cho các task còn lại
    await this.Task.updateMany(
      { columnId: task.columnId, position: { $gt: task.position } },
      { $inc: { position: -1 } }
    );

    eventBus.emitAsync('task.deleted', {
      taskId,
      columnId,
      projectId,
      taskTitle: task.title,
      userId,
    });
  }

  async moveTask(moveData, userId) {
    const {
      taskId, sourceColumnId, destinationColumnId,
      sourceTaskIds, destinationTaskIds,
    } = moveData;

    // Cập nhật column mới cho task
    await this.Task.findByIdAndUpdate(taskId, { columnId: destinationColumnId });

    // Cập nhật positions
    const updateOps = [];
    sourceTaskIds.forEach((id, index) => {
      updateOps.push({
        updateOne: {
          filter: { _id: new this.mongoose.Types.ObjectId(id) },
          update: { $set: { position: index, columnId: sourceColumnId } },
        },
      });
    });
    destinationTaskIds.forEach((id, index) => {
      updateOps.push({
        updateOne: {
          filter: { _id: new this.mongoose.Types.ObjectId(id) },
          update: { $set: { position: index, columnId: destinationColumnId } },
        },
      });
    });

    if (updateOps.length > 0) {
      await this.Task.bulkWrite(updateOps);
    }

    const sourceColumn = await this.Column.findById(sourceColumnId);
    const projectId = sourceColumn?.projectId?.toString() || null;

    eventBus.emitAsync('task.moved', {
      moveData,
      projectId,
      userId,
    });
  }

  async addTagsToTask(taskId, tagsData) {
    const task = await this.Task.findById(taskId);
    if (!task) throw new this.ApiError(404, 'Không tìm thấy tác vụ');

    const newTags = tagsData.tags.filter(
      (newTag) => !task.tags.some((existing) => existing.name === newTag.name)
    );
    if (newTags.length > 0) {
      task.tags.push(...newTags);
      await task.save();
    }
    return task;
  }

  async removeTagFromTask(taskId, tagName) {
    const task = await this.Task.findById(taskId);
    if (!task) throw new this.ApiError(404, 'Không tìm thấy tác vụ');

    task.tags = task.tags.filter((t) => t.name !== tagName);
    await task.save();
    return task;
  }

  async getAllTasksForUser(userId) {
    const Project = this.mongoose.model('Project');
    const projects = await Project.find({
      'members.userId': userId,
      'members.status': 'active',
    }).select('_id');

    const projectIds = projects.map((p) => p._id);
    const columns = await this.Column.find({ projectId: { $in: projectIds } }).select('_id');
    const columnIds = columns.map((c) => c._id);

    return await this.Task.find({ columnId: { $in: columnIds } })
      .populate('assignees', '_id displayName email avatarUrl')
      .populate('creatorId', '_id displayName email avatarUrl')
      .sort({ createdAt: -1 });
  }
}

module.exports = TaskService;
