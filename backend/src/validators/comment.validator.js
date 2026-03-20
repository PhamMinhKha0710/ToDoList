const Joi = require('joi');

const createCommentSchema = Joi.object({
  taskId: Joi.string().required(),
  content: Joi.string().required().trim(),
  parentId: Joi.string().allow(null).optional(),
});

const updateCommentSchema = Joi.object({
  content: Joi.string().required().trim(),
});

module.exports = {
  createCommentSchema,
  updateCommentSchema,
};
