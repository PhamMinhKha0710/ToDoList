class PersonalTaskRepository {
  constructor({ PersonalTask }) {
    this.PersonalTask = PersonalTask;
  }

  async create(taskData) {
    const task = new this.PersonalTask(taskData);
    return await task.save();
  }

  async findByUserId(userId) {
    return await this.PersonalTask.find({ userId }).sort({ createdAt: -1 });
  }

  async findById(taskId) {
    return await this.PersonalTask.findById(taskId);
  }

  async updateById(taskId, updateData) {
    return await this.PersonalTask.findByIdAndUpdate(taskId, updateData, { new: true });
  }

  async deleteById(taskId) {
    return await this.PersonalTask.findByIdAndDelete(taskId);
  }
}

module.exports = PersonalTaskRepository;

