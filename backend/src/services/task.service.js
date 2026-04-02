class TaskService {
  constructor({
    taskRepository,
    Column,
    Task,
    PersonalTask,
    ApiError,
    attachmentRepository,
    notificationService,
    activityService,
    taskSocket,
  }) {
    this.taskRepository = taskRepository;
    this.Column = Column;
    this.Task = Task;
    this.PersonalTask = PersonalTask;
    this.ApiError = ApiError;
    this.attachmentRepository = attachmentRepository;
    this.notificationService = notificationService;
    this.activityService = activityService;
    this.taskSocket = taskSocket;
  }

  createTask = async (taskData, files) => {
    const column = await this.Column.findById(taskData.columnId);
    if (!column) {
      throw new this.ApiError(404, "Không tìm thấy cột tương ứng");
    }

    const task = await this.taskRepository.createTask(taskData, files);

    this.taskSocket.emitTaskCreated(column.projectId.toString(), task);

    await this.activityService.createActivityLog({
      projectId: column.projectId,
      userId: taskData.creatorId,
      action: 'TASK_CREATED',
      entityType: 'task',
      entityId: task._id,
      detail: { title: task.title }
    });

    if (task.assignees && task.assignees.length > 0) {
      for (const assigneeId of task.assignees) {
        if (assigneeId.toString() !== task.creatorId.toString()) {
          await this.notificationService.createNotification({
            recipientId: assigneeId,
            type: "task_assigned",
            title: "Công việc mới",
            message: `Bạn được giao task "${task.title}"`,
            metadata: { taskId: task._id, projectId: column.projectId },
          });
        }
      }
    }

    return task;
  };

  getTasksByColumnId = async (columnId) => {
    return await this.taskRepository.getTasksByColumnId(columnId);
  };

  getTaskById = async (taskId) => {
    let task = await this.taskRepository.getTaskById(taskId);
    
    if (!task) {
      // If not found in project tasks, check personal tasks
      task = await this.PersonalTask.findById(taskId).lean();
      if (task) {
        task.isPersonal = true;
      }
    }

    if (!task) {
      throw new this.ApiError(404, "Không tìm thấy task");
    }
    return task;
  };

  updateTask = async (taskId, updateData, userId) => {
    let task = await this.Task.findById(taskId).lean();
    let isPersonal = false;

    if (!task) {
      task = await this.PersonalTask.findById(taskId).lean();
      if (task) isPersonal = true;
    }

    if (!task) {
      throw new this.ApiError(404, "Không tìm thấy task để cập nhật");
    }

    if (isPersonal) {
      const updatedTask = await this.PersonalTask.findByIdAndUpdate(taskId, updateData, { new: true });
      return updatedTask;
    }

    const oldTask = task;
    const updatedTask = await this.taskRepository.updateTask(taskId, updateData);
    
    // ... logic thông báo cho project task như cũ
    const column = await this.Column.findById(updatedTask.columnId)
      .select("projectId")
      .lean();
    if (column) {
      const projectId = column.projectId.toString();
      this.taskSocket.emitTaskUpdated(projectId, updatedTask);

      await this.activityService.createActivityLog({
        projectId,
        userId,
        action: 'TASK_UPDATED',
        entityType: 'task',
        entityId: updatedTask._id,
        detail: updateData
      });

      const oldAssigneesStr = (oldTask.assignees || []).map(id => id.toString());
      const isAssigneesUpdated = updateData.assignees !== undefined;
      let newAssignedIds = [];

      if (isAssigneesUpdated) {
        const currentAssigneesStr = (updateData.assignees || []).map(id => typeof id === 'object' ? (id._id || id).toString() : id.toString());
        newAssignedIds = currentAssigneesStr.filter(id => !oldAssigneesStr.includes(id));

        for (const assigneeId of newAssignedIds) {
          if (userId && assigneeId === userId.toString()) continue;
          await this.notificationService.createNotification({
            recipientId: assigneeId,
            type: "task_assigned",
            title: "Phân công công việc",
            message: `Bạn vừa được phân công vào công việc "${updatedTask.title}"`,
            metadata: { taskId: updatedTask._id, projectId },
          });
        }
      }

      const isMajorUpdate =
        (updateData.status && updateData.status !== oldTask.status) ||
        (updateData.priority && updateData.priority !== oldTask.priority) ||
        updateData.title ||
        updateData.description ||
        (isAssigneesUpdated && oldAssigneesStr.length !== updateData.assignees.length);

      if (isMajorUpdate || newAssignedIds.length > 0) {
        const usersToNotify = new Set();
        if (updatedTask.assignees) {
          updatedTask.assignees.forEach(assignee => {
            const id = assignee._id || assignee;
            const strId = id.toString();
            if (!newAssignedIds.includes(strId)) {
              usersToNotify.add(strId);
            }
          });
        }
        if (updatedTask.creatorId) {
          const cId = updatedTask.creatorId._id || updatedTask.creatorId;
          const strId = cId.toString();
          if (!newAssignedIds.includes(strId)) {
            usersToNotify.add(strId);
          }
        }

        if (userId) usersToNotify.delete(userId.toString());

        for (const recipientId of usersToNotify) {
          await this.notificationService.createNotification({
            recipientId,
            type: "task_update",
            title: "Cập nhật công việc",
            message: `Công việc "${updatedTask.title}" vừa được cập nhật`,
            metadata: { taskId: updatedTask._id, projectId },
          });
        }
      }
    }

    return updatedTask;
  };

  deleteTask = async (taskId, userId) => {
    let task = await this.taskRepository.getTaskById(taskId);
    let isPersonal = false;

    if (!task) {
      task = await this.PersonalTask.findById(taskId);
      if (task) isPersonal = true;
    }

    if (!task) {
      throw new this.ApiError(404, "Không tìm thấy task để xóa");
    }

    if (isPersonal) {
      await this.PersonalTask.findByIdAndDelete(taskId);
      // Có thể thêm log activity cho personal task ở đây nếu muốn
      return;
    }

    const columnId = task.columnId;
    const deletedPosition = task.position;

    await this.taskRepository.deleteTask(taskId);

    await this.Task.updateMany(
      { columnId, position: { $gt: deletedPosition } },
      { $inc: { position: -1 } },
    );

    const column = await this.Column.findById(columnId).select("projectId").lean();
    if (column) {
      this.taskSocket.emitTaskDeleted(column.projectId.toString(), taskId, columnId);
      await this.activityService.createActivityLog({
        projectId: column.projectId,
        userId,
        action: 'TASK_DELETED',
        entityType: 'task',
        entityId: taskId,
        detail: { taskTitle: task.title, columnId }
      });
    }
  };

  moveTask = async (moveData, userId) => {
    const {
      taskId,
      sourceColumnId,
      destinationColumnId,
      sourceTaskIds,
      destinationTaskIds,
    } = moveData;

    const task = await this.taskRepository.getTaskById(taskId);
    if (!task) {
      throw new this.ApiError(404, "Không tìm thấy task");
    }

    if (sourceColumnId === destinationColumnId) {
      await this.taskRepository.reorderTasks(sourceTaskIds, sourceColumnId);
    } else {
      await this.taskRepository.reorderTasks(
        sourceTaskIds,
        sourceColumnId,
        destinationTaskIds,
        destinationColumnId,
        taskId,
      );
    }

    const column = await this.Column.findById(sourceColumnId)
      .select("projectId")
      .lean();
    if (column) {
      this.taskSocket.emitTaskMoved(column.projectId.toString(), {
        taskId,
        sourceColumnId,
        destinationColumnId,
        sourceTaskIds,
        destinationTaskIds,
      });
      await this.activityService.createActivityLog({
        projectId: column.projectId,
        userId,
        action: 'TASK_MOVED',
        entityType: 'task',
        entityId: taskId,
        detail: { sourceColumnId, destinationColumnId }
      });

      if (sourceColumnId !== destinationColumnId) {
        const usersToNotify = new Set();
        if (task.assignees) {
          task.assignees.forEach(assignee => {
            const id = assignee._id || assignee;
            usersToNotify.add(id.toString());
          });
        }
        if (task.creatorId) {
          const cId = task.creatorId._id || task.creatorId;
          usersToNotify.add(cId.toString());
        }

        if (userId) usersToNotify.delete(userId.toString());

        if (usersToNotify.size > 0) {
          const destCol = await this.Column.findById(destinationColumnId).select('title').lean();
          for (const recipientId of usersToNotify) {
            await this.notificationService.createNotification({
              recipientId,
              type: "task_update",
              title: "Di chuyển công việc",
              message: `Công việc "${task.title}" vừa được chuyển sang cột "${destCol?.title || 'khác'}"`,
              metadata: { taskId: task._id, projectId: column.projectId.toString() },
            });
          }
        }
      }
    }
  };

  addTagsToTask = async (taskId, tagsArray) => {
    const task = await this.taskRepository.getTaskById(taskId);
    if (!task) {
      throw new this.ApiError(404, "Không tìm thấy task để thêm tag");
    }

    if (!tagsArray || tagsArray.length === 0) {
      return task;
    }

    const existingNames = task.tags.map((t) => t.name.toLowerCase());
    const newTagsToInsert = tagsArray.filter(
      (t) => !existingNames.includes(t.name.toLowerCase()),
    );

    if (newTagsToInsert.length === 0) {
      return task;
    }

    return await this.taskRepository.addTagsToTask(taskId, newTagsToInsert);
  };

  removeTagFromTask = async (taskId, tagName) => {
    const task = await this.taskRepository.getTaskById(taskId);
    if (!task) {
      throw new this.ApiError(404, "Không tìm thấy task để xóa tag");
    }

    return await this.taskRepository.removeTagFromTask(taskId, tagName);
  };

  getAllTasksForUser = async (userId) => {
    return await this.taskRepository.getAllTasksForUser(userId);
  };
}

module.exports = new TaskService({
  taskRepository: require('../repositories/task.repository'),
  Column: require('../entities/Column'),
  Task: require('../entities/Task'),
  PersonalTask: require('../entities/PersonalTask'),
  ApiError: require('../utils/ApiError'),
  attachmentRepository: require('../repositories/attachment.repository'),
  notificationService: require('./notification.service'),
  activityService: require('./activity.service'),
  taskSocket: {
    emitTaskCreated: require('../sockets/task.socket').emitTaskCreated,
    emitTaskUpdated: require('../sockets/task.socket').emitTaskUpdated,
    emitTaskDeleted: require('../sockets/task.socket').emitTaskDeleted,
    emitTaskMoved: require('../sockets/task.socket').emitTaskMoved,
  },
});
