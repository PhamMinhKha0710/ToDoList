class PersonalTaskService {
  constructor({ personalTaskRepository, ApiError }) {
    this.personalTaskRepository = personalTaskRepository;
    this.ApiError = ApiError;
  }

  async createPersonalTask(userId, taskData) {
    return await this.personalTaskRepository.create({
      ...taskData,
      userId
    });
  }

  async getPersonalTasks(userId) {
    return await this.personalTaskRepository.findByUserId(userId);
  }

  async getPersonalTaskById(taskId) {
    const task = await this.personalTaskRepository.findById(taskId);
    if (!task) {
      throw new this.ApiError(404, 'Không tìm thấy công việc cá nhân');
    }
    return task;
  }

  async updatePersonalTask(taskId, updateData) {
    const task = await this.personalTaskRepository.findById(taskId);
    if (!task) {
      throw new this.ApiError(404, 'Không tìm thấy công việc cá nhân');
    }
    return await this.personalTaskRepository.updateById(taskId, updateData);
  }

  async deletePersonalTask(taskId) {
    const task = await this.personalTaskRepository.findById(taskId);
    if (!task) {
      throw new this.ApiError(404, 'Không tìm thấy công việc cá nhân');
    }
    return await this.personalTaskRepository.deleteById(taskId);
  }
}

module.exports = new PersonalTaskService({
  personalTaskRepository: require('../repositories/personalTask.repository'),
  ApiError: require('../utils/ApiError'),
});

