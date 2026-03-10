const Joi = require('joi');

const createProjectSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Tên dự án không được để trống',
    'any.required': 'Tên dự án là bắt buộc',
  }),
  description: Joi.string().trim().allow('').optional(),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().trim().optional(),
  description: Joi.string().trim().allow('').optional(),
});

const addMemberSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email của thành viên là bắt buộc',
  }),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
};
