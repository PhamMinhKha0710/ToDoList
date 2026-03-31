const Comment = require('../entities/Comment');

class CommentRepository {
  async create(commentData) {
    const comment = new Comment(commentData);
    return await comment.save();
  }

  async findById(id) {
    return await Comment.findById(id);
  }

  async findByTaskId(taskId) {
    return await Comment.find({ taskId }).sort({ createdAt: 1 });
  }

  async updateById(id, data) {
    return await Comment.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id) {
    return await Comment.findByIdAndDelete(id);
  }
}

module.exports = new CommentRepository();
