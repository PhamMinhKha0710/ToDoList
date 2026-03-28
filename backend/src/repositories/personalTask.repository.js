const PersonalTask = require('../entities/PersonalTask');

class PersonalTaskRepository {
  async create(taskData) {
    const task = new PersonalTask(taskData);
    return await task.save();
  }

  async findByUserId(userId) {
    return await PersonalTask.find({ userId }).sort({ createdAt: -1 });
  }

  async findById(taskId) {
    return await PersonalTask.findById(taskId);
  }

  async updateById(taskId, updateData) {
    return await PersonalTask.findByIdAndUpdate(taskId, updateData, { new: true });
  }

  async deleteById(taskId) {
    return await PersonalTask.findByIdAndDelete(taskId);
  }
}

module.exports = new PersonalTaskRepository();
