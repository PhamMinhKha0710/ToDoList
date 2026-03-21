/**
 * Chuẩn định dạng đối tượng Task trước khi trả về cho Client
 */
const toTaskResponseDTO = (task) => {
  if (!task) return null;

  return {
    _id: task._id,
    columnId: task.columnId,
    assignee: task.assigneeId, // Có thể đã được populate
    assigneeId: task.assigneeId?._id || task.assigneeId, // Fallback
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    color: task.color,
    tags: task.tags,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
};

module.exports = { toTaskResponseDTO };
