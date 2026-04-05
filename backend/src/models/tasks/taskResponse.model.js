/**
 * Chuẩn định dạng đối tượng Task trước khi trả về cho Client
 */
const toTaskResponseModel = (task) => {
  if (!task) return null;

  const isPersonal = task.isPersonal !== undefined ? task.isPersonal : (!!task.userId && !task.columnId);

  return {
    _id: task._id,
    columnId: task.columnId,
    creator: task.creatorId || task.userId, // Dùng userId làm creator cho personal task
    creatorId: (task.creatorId?._id || task.creatorId) || (task.userId?._id || task.userId),
    assignees: task.assignees || [],
    assigneeIds: Array.isArray(task.assignees) ? task.assignees.map(a => a._id || a) : [],
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate || task.endDate || task.startDate,
    startDate: task.startDate,
    endDate: task.endDate,
    isPersonal: isPersonal,
    color: task.color,
    tags: task.tags || [],
    attachments: (task.attachments || []).map(att => ({
      ...att.toObject?.() || att,
      name: att.fileName,
      url: att.fileUrl
    })),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    subTasks: task.subTasks || [],
    position: task.position || 0,
  };
};

module.exports = { toTaskResponseModel };
