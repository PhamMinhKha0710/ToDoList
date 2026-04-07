/**
 * UpdatePersonalTask Model — Chuan hoa du lieu cap nhat PersonalTask
 * @param {Object} data
 */
const toUpdatePersonalTaskModel = (data) => {
  if (!data) return null;

  return {
    title: data.title,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    priority: data.priority,
    status: data.status,
    color: data.color,
  };
};

module.exports = { toUpdatePersonalTaskModel };