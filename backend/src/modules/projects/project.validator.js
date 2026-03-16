const Joi = require('joi');

const VALID_ROLES = ['owner', 'admin', 'member', 'viewer'];

const createProjectSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Tên dự án không được để trống',
    'any.required': 'Tên dự án là bắt buộc',
  }),
  description: Joi.string().trim().allow('').optional(),
  members: Joi.array().items(
    Joi.object({
      userId: Joi.string().required(),
      role: Joi.string().valid(...VALID_ROLES).required(),
    })
  ).optional(),
  imageUrl: Joi.string().trim().allow('').optional(),
  color: Joi.string().trim().allow('').optional(),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().trim().optional(),
  description: Joi.string().trim().allow('').optional(),
  imageUrl: Joi.string().trim().allow('').optional(),
  color: Joi.string().trim().allow('').optional(),
});

const addMemberSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email của thành viên là bắt buộc',
  }),
  role: Joi.string().valid('admin', 'member', 'viewer').default('member'),
});

const updateMemberRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'member', 'viewer').required().messages({
    'any.only': 'Role không hợp lệ. Phải là admin, member hoặc viewer',
    'any.required': 'Trường role là bắt buộc',
  }),
});

const respondInvitationSchema = Joi.object({
  action: Joi.string().valid('accept', 'decline').required().messages({
    'any.only': 'Hành động không hợp lệ. Chỉ chấp nhận "accept" hoặc "decline".',
    'any.required': 'Hành động là bắt buộc (action)',
  }),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  respondInvitationSchema,
};
