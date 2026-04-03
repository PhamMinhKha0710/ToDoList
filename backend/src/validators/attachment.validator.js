const Joi = require('joi');

const uploadAttachmentSchema = Joi.object({
  taskId: Joi.string().required().messages({
    'string.empty': 'Id của Task không được để trống',
    'any.required': 'Id của Task là bắt buộc',
  }),
});

module.exports = {
  uploadAttachmentSchema,
};
