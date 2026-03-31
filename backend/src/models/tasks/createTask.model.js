/**
 * Chuẩn hóa dữ liệu tạo Task từ request body
 */
const toCreateTaskModel = (body) => {
  const data = {
    columnId: body.columnId,
    title: body.title,
  };

  if (body.description !== undefined) data.description = body.description;
  
  if (body.assignees !== undefined) {
    try {
      data.assignees = typeof body.assignees === 'string' ? JSON.parse(body.assignees) : body.assignees;
    } catch (e) {
      data.assignees = body.assignees;
    }
  }
  if (body.status !== undefined) data.status = body.status;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate;
  if (body.startDate !== undefined) data.startDate = body.startDate;
  if (body.endDate !== undefined) data.endDate = body.endDate;
  if (body.color !== undefined) data.color = body.color;
  
  // Tags might be sent as a JSON string when using FormData
  if (body.tags !== undefined) {
    try {
      data.tags = typeof body.tags === 'string' ? JSON.parse(body.tags) : body.tags;
    } catch (e) {
      data.tags = body.tags;
    }
  }

  return data;
};

module.exports = { toCreateTaskModel };
