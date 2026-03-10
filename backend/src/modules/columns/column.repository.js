const Column = require('../../models/Column');

class ColumnRepository {
  async create(columnData) {
    const column = new Column(columnData);
    await column.save();
    return column;
  }

  async findById(columnId) {
    return Column.findById(columnId);
  }

  async updateById(columnId, updateData) {
    return Column.findByIdAndUpdate(columnId, updateData, { new: true });
  }

  async deleteById(columnId) {
    return Column.findByIdAndDelete(columnId);
  }
}

module.exports = new ColumnRepository();
