const Joi = require("joi");

const updateProfileSchema = Joi.object({
  displayName: Joi.string().trim().max(50).messages({
    "string.max": "Tên hiển thị không được vượt quá 50 ký tự",
  }),
  fullName: Joi.string().trim().max(50).optional().allow(""), // Add if the frontend sends it
  avatarUrl: Joi.string().trim().allow("").optional(),
  email: Joi.string().email().optional(),
  otp: Joi.string().length(6).optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Mật khẩu hiện tại là bắt buộc",
  }),
  newPassword: Joi.string().min(8).required().messages({
    "string.min": "Mật khẩu mới phải có ít nhất 8 ký tự",
    "any.required": "Mật khẩu mới là bắt buộc",
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    "any.only": "Mật khẩu xác nhận không khớp",
    "any.required": "Yêu cầu xác nhận mật khẩu mới",
  }),
  otp: Joi.string().length(6).optional().messages({
    "string.length": "Mã OTP phải có 6 chữ số",
  }),
});

const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    'any.required': 'isActive là bắt buộc',
    'boolean.base': 'isActive phải là true hoặc false',
  }),
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  updateUserStatusSchema,
};
