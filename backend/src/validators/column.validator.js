const Joi = require('joi');

const createColumnSchema = Joi.object({
  projectId: Joi.string().required().messages({
    'string.empty': 'ID dự án không được để trống',
    'any.required': 'ID dự án là bắt buộc',
  }),
  title: Joi.string().trim().required().messages({
    'string.empty': 'Tiêu đề cột không được để trống',
    'any.required': 'Tiêu đề cột là bắt buộc',
  }),
  color: Joi.string().trim().optional(),
});

const updateColumnSchema = Joi.object({
  title: Joi.string().trim().optional(),
  color: Joi.string().trim().optional(),
});

module.exports = {
  createColumnSchema,
  updateColumnSchema,
};
