/**
 * Column Model — Chuẩn hóa dữ liệu trả về của Column
 * @param {Object} column
 */
const toColumnModel = (column) => {
  if (!column) return null;
  
  return {
    _id: column._id,
    projectId: column.projectId,
    title: column.title,
    color: column.color,
    position: column.position,
    taskOrder: column.taskOrder || [],
    createdAt: column.createdAt,
    updatedAt: column.updatedAt,
  };
};

module.exports = { toColumnModel };
