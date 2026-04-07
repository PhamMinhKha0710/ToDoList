class CommentRepository {
  constructor({ Comment }) {
    this.Comment = Comment;
  }

  async create(commentData) {
    const comment = new this.Comment(commentData);
    return await comment.save();
  }

  async findById(id) {
    return await this.Comment.findById(id);
  }

  async findByTaskId(taskId) {
    return await this.Comment.find({ taskId }).sort({ createdAt: 1 });
  }

  async updateById(id, data) {
    return await this.Comment.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id) {
    return await this.Comment.findByIdAndDelete(id);
  }
}

module.exports = CommentRepository;

