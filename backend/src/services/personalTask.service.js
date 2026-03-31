const personalTaskRepository = require('../repositories/personalTask.repository');
const ApiError = require('../utils/ApiError');

class PersonalTaskService {
  async createPersonalTask(userId, taskData) {
    return await personalTaskRepository.create({
      ...taskData,
      userId
    });
  }

  async getPersonalTasks(userId) {
    return await personalTaskRepository.findByUserId(userId);
  }

  async getPersonalTaskById(taskId) {
    const task = await personalTaskRepository.findById(taskId);
    if (!task) {
      throw new ApiError(404, 'Không tìm thấy công việc cá nhân');
    }
    return task;
  }

  async updatePersonalTask(taskId, updateData) {
    const task = await personalTaskRepository.findById(taskId);
    if (!task) {
      throw new ApiError(404, 'Không tìm thấy công việc cá nhân');
    }
    return await personalTaskRepository.updateById(taskId, updateData);
  }

  async deletePersonalTask(taskId) {
    const task = await personalTaskRepository.findById(taskId);
    if (!task) {
      throw new ApiError(404, 'Không tìm thấy công việc cá nhân');
    }
    return await personalTaskRepository.deleteById(taskId);
  }
}

module.exports = new PersonalTaskService();
