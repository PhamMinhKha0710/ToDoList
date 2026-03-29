class TaskRepository {
  constructor({ Task, Attachment, mongoose }) {
    this.Task = Task;
    this.Attachment = Attachment;
    this.mongoose = mongoose;
  }

  createTask = async (taskData, files = []) => {
    const count = await this.Task.countDocuments({ columnId: taskData.columnId });
    const task = await this.Task.create({ ...taskData, position: count });

    let attachments = [];
    if (files && files.length > 0) {
      const attachmentPromises = files.map(file => {
        return this.Attachment.create({
          taskId: task._id,
          fileName: file.originalname,
          fileUrl: `/uploads/${file.filename}`,
        });
      });
      attachments = await Promise.all(attachmentPromises);
    }

    const taskObj = task.toObject();
    taskObj.attachments = attachments;
    return taskObj;
  };

  getTasksByColumnId = async (columnId) => {
    const tasks = await this.Task.find({ columnId })
      .sort({ position: 1 })
      .populate('creatorId assignees', 'displayName email avatar avatarUrl');

    const tasksWithAttachments = await Promise.all(
      tasks.map(async (task) => {
        const taskObj = task.toObject();
        const attachments = await this.Attachment.find({ taskId: task._id });
        taskObj.attachments = attachments;
        return taskObj;
      })
    );

    return tasksWithAttachments;
  };

  getTaskById = async (taskId) => {
    return await this.Task.findById(taskId).populate('creatorId assignees', 'displayName email avatar');
  };

  updateTask = async (taskId, updateData) => {
    return await this.Task.findByIdAndUpdate(taskId, updateData, { new: true });
  };

  deleteTask = async (taskId) => {
    return await this.Task.findByIdAndDelete(taskId);
  };

  compactPositionsInColumn = async (columnId) => {
    const tasks = await this.Task.find({ columnId }).sort({ position: 1 });
    const bulkOps = tasks.map((task, index) => ({
      updateOne: {
        filter: { _id: task._id },
        update: { $set: { position: index } },
      },
    }));
    if (bulkOps.length > 0) {
      await this.Task.bulkWrite(bulkOps);
    }
  };

  reorderTasks = async (sourceTaskIds, sourceColumnId, destTaskIds, destColumnId, movedTaskId) => {
    const ops = [];

    sourceTaskIds.forEach((id, index) => {
      ops.push({
        updateOne: {
          filter: { _id: new this.mongoose.Types.ObjectId(id) },
          update: { $set: { position: index, columnId: new this.mongoose.Types.ObjectId(sourceColumnId) } },
        },
      });
    });

    if (destTaskIds && destColumnId && movedTaskId) {
      destTaskIds.forEach((id, index) => {
        ops.push({
          updateOne: {
            filter: { _id: new this.mongoose.Types.ObjectId(id) },
            update: { $set: { position: index, columnId: new this.mongoose.Types.ObjectId(destColumnId) } },
          },
        });
      });
    }

    if (ops.length > 0) {
      await this.Task.bulkWrite(ops);
    }
  };

  addTagsToTask = async (taskId, tagsArray) => {
    return await this.Task.findByIdAndUpdate(
      taskId,
      { $push: { tags: { $each: tagsArray } } },
      { new: true }
    ).populate('creatorId assignees', 'displayName email avatar');
  };

  removeTagFromTask = async (taskId, tagName) => {
    return await this.Task.findByIdAndUpdate(
      taskId,
      { $pull: { tags: { name: tagName } } },
      { new: true }
    ).populate('creatorId assignees', 'displayName email avatar');
  };
}

module.exports = new TaskRepository({
  Task: require('../../entities/Task'),
  Attachment: require('../../entities/Attachment'),
  mongoose: require('mongoose'),
});
