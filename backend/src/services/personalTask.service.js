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

  async getPersonalTaskById(taskId, userId) {
    const task = await this.personalTaskRepository.findById(taskId);
    if (!task) {
      throw new this.ApiError(404, 'Không tìm thấy công việc cá nhân');
    }
    if (task.userId.toString() !== userId.toString()) {
      throw new this.ApiError(403, 'Bạn không có quyền truy cập công việc này');
    }
    return task;
  }

  async updatePersonalTask(taskId, updateData, userId) {
    const task = await this.personalTaskRepository.findById(taskId);
    if (!task) {
      throw new this.ApiError(404, 'Không tìm thấy công việc cá nhân');
    }
    if (task.userId.toString() !== userId.toString()) {
      throw new this.ApiError(403, 'Bạn không có quyền chỉnh sửa công việc này');
    }
    return await this.personalTaskRepository.updateById(taskId, updateData);
  }

  async deletePersonalTask(taskId, userId) {
    const task = await this.personalTaskRepository.findById(taskId);
    if (!task) {
      throw new this.ApiError(404, 'Không tìm thấy công việc cá nhân');
    }
    if (task.userId.toString() !== userId.toString()) {
      throw new this.ApiError(403, 'Bạn không có quyền xóa công việc này');
    }
    return await this.personalTaskRepository.deleteById(taskId);
  }
}

module.exports = new PersonalTaskService({
  personalTaskRepository: require('../repositories/personalTask.repository'),
  ApiError: require('../utils/ApiError'),
});

