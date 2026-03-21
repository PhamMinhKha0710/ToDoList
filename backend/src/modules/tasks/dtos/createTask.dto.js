/**
 * Chuẩn hóa dữ liệu tạo Task từ request body
 */
const toCreateTaskDTO = (body) => {
  const data = {
    columnId: body.columnId,
    title: body.title,
  };

  if (body.description !== undefined) data.description = body.description;
  if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId;
  if (body.status !== undefined) data.status = body.status;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate;
  if (body.color !== undefined) data.color = body.color;
  if (body.tags !== undefined) data.tags = body.tags;

  return data;
};

module.exports = { toCreateTaskDTO };
