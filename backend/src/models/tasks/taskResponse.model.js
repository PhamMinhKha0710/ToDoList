/**
 * Chuẩn định dạng đối tượng Task trước khi trả về cho Client
 */
const toTaskResponseDTO = (task) => {
  if (!task) return null;

  return {
    _id: task._id,
    columnId: task.columnId,
    creator: task.creatorId, // Có thể đã được populate
    creatorId: task.creatorId?._id || task.creatorId, // Fallback
    assignees: task.assignees, // Mảng users (đã được populate hoặc list ID)
    assigneeIds: Array.isArray(task.assignees) ? task.assignees.map(a => a._id || a) : [], // Fallback
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    color: task.color,
    tags: task.tags,
    attachments: (task.attachments || []).map(att => ({
      ...att.toObject?.() || att,
      name: att.fileName,
      url: att.fileUrl
    })),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    position: task.position,
  };
};

module.exports = { toTaskResponseDTO };
