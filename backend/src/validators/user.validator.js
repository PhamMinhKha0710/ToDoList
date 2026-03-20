const Joi = require("joi");

const updateProfileSchema = Joi.object({
  displayName: Joi.string().trim().max(50).messages({
    "string.max": "Tên hiển thị không được vượt quá 50 ký tự",
  }),
  fullName: Joi.string().trim().max(50).optional().allow(""), // Add if the frontend sends it
  avatarUrl: Joi.string().trim().allow("").optional(),
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
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
};
