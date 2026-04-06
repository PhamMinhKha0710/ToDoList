/**
 * Chuẩn hóa dữ liệu đầu vào cho mảng Tags
 * @param {Array} tagsArray
 */
const toAddTagsModel = (tagsArray) => {
  if (!Array.isArray(tagsArray)) return [];

  return tagsArray.map((tag) => ({
    name: tag.name?.trim(),
    color: tag.color?.trim() || '#cccccc', // Default color if not provided
  }));
};

module.exports = { toAddTagsModel };
