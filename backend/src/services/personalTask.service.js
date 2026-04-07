class PersonalTaskService {
  constructor({ personalTaskRepository, ApiError, emitDashboardUpdated }) {
    this.personalTaskRepository = personalTaskRepository;
    this.ApiError = ApiError;
    this.emitDashboardUpdated = emitDashboardUpdated;
  }

  async createPersonalTask(userId, taskData) {
    const task = await this.personalTaskRepository.create({
      ...taskData,
      userId
    });
    this.emitDashboardUpdated(userId.toString());
    return task;
  }

  async getPersonalTasks(userId) {
    return await this.personalTaskRepository.findByUserId(userId);
  }

  async getPersonalTaskById(taskId, userId) {
    const task = await this.personalTaskRepository.findById(taskId);
    if (!task) throw new this.ApiError(404, 'Không tìm thấy công việc cá nhân');
    if (task.userId.toString() !== userId.toString()) {
      throw new this.ApiError(403, 'Bạn không có quyền truy cập công việc này');
    }
    return task;
  }

  async updatePersonalTask(taskId, updateData, userId) {
    const task = await this.personalTaskRepository.findById(taskId);
    if (!task) throw new this.ApiError(404, 'Không tìm thấy công việc cá nhân');
    if (task.userId.toString() !== userId.toString()) {
      throw new this.ApiError(403, 'Bạn không có quyền chỉnh sửa công việc này');
    }
    const updated = await this.personalTaskRepository.updateById(taskId, updateData);
    this.emitDashboardUpdated(userId.toString());
    return updated;
  }

  async deletePersonalTask(taskId, userId) {
    const task = await this.personalTaskRepository.findById(taskId);
    if (!task) throw new this.ApiError(404, 'Không tìm thấy công việc cá nhân');
    if (task.userId.toString() !== userId.toString()) {
      throw new this.ApiError(403, 'Bạn không có quyền xóa công việc này');
    }
    const result = await this.personalTaskRepository.deleteById(taskId);
    this.emitDashboardUpdated(userId.toString());
    return result;
  }
}

module.exports = new PersonalTaskService({
  personalTaskRepository: require('../repositories/personalTask.repository'),
  ApiError: require('../utils/ApiError'),
  emitDashboardUpdated: require('../sockets/task.socket').emitDashboardUpdated,
});
