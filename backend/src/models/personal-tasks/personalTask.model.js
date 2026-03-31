/**
 * PersonalTask Model — Chuẩn hóa dữ liệu trả về của PersonalTask
 * @param {Object} task
 */
const toPersonalTaskModel = (task) => {
  if (!task) return null;

  return {
    _id: task._id,
    userId: task.userId,
    title: task.title,
    description: task.description,
    startDate: task.startDate,
    endDate: task.endDate,
    priority: task.priority,
    status: task.status,
    color: task.color,
    subTasks: task.subTasks || [],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
};

module.exports = { toPersonalTaskModel };
