/**
 * Chuẩn hóa dữ liệu cập nhật Task từ request body
 */
const toUpdateTaskDTO = (body) => {
  const data = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId;
  if (body.status !== undefined) data.status = body.status;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate;
  if (body.color !== undefined) data.color = body.color;
  if (body.tags !== undefined) data.tags = body.tags;

  return data;
};

module.exports = { toUpdateTaskDTO };
