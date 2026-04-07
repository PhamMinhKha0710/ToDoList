/**
 * UpdateSubTask Model — Chuan hoa du lieu cap nhat SubTask
 * @param {Object} data
 */
const toUpdateSubTaskModel = (data) => {
  if (!data) return null;

  return {
    title: data.title,
    isCompleted: data.isCompleted,
  };
};

module.exports = { toUpdateSubTaskModel };