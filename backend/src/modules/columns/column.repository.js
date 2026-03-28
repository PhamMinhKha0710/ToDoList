class ColumnRepository {
  constructor({ Column }) {
    this.Column = Column;
  }

  async create(columnData) {
    const column = new this.Column(columnData);
    await column.save();
    return column;
  }

  async findById(columnId) {
    return this.Column.findById(columnId);
  }

  async findByProjectId(projectId) {
    return this.Column.find({ projectId });
  }

  async updateById(columnId, updateData) {
    return this.Column.findByIdAndUpdate(columnId, updateData, { new: true });
  }

  async deleteById(columnId) {
    return this.Column.findByIdAndDelete(columnId);
  }
}

module.exports = new ColumnRepository({
  Column: require('../../entities/Column'),
});
