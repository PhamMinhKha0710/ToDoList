/**
 * Column DTO — Chuẩn hóa dữ liệu trả về của Column
 * @param {Object} column
 */
const toColumnDTO = (column) => {
  if (!column) return null;
  
  return {
    _id: column._id,
    projectId: column.projectId,
    title: column.title,
    color: column.color,
    taskOrder: column.taskOrder || [],
    createdAt: column.createdAt,
    updatedAt: column.updatedAt,
  };
};

module.exports = { toColumnDTO };
