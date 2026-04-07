/**
 * CreatePersonalTask Model — Chuan hoa du lieu tao PersonalTask
 * @param {Object} data
 */
const toCreatePersonalTaskModel = (data) => {
  if (!data) return null;

  return {
    userId: data.userId,
    title: data.title,
    description: data.description || '',
    startDate: data.startDate,
    endDate: data.endDate,
    priority: data.priority || 'medium',
    status: data.status || 'pending',
    color: data.color || null,
    subTasks: data.subTasks || [],
  };
};

module.exports = { toCreatePersonalTaskModel };