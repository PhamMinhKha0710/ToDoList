const Joi = require('joi');

const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    'any.required': 'isActive là bắt buộc',
    'boolean.base': 'isActive phải là true hoặc false',
  }),
});

module.exports = { updateUserStatusSchema };
