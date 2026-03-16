const Joi = require('joi');

const tagSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Tên tag không được để trống',
    'any.required': 'Tên tag là bắt buộc',
  }),
  color: Joi.string().trim().optional(),
});

const createTaskSchema = Joi.object({
  columnId: Joi.string().required().messages({
    'string.empty': 'ID cột không được để trống',
    'any.required': 'ID cột là bắt buộc',
  }),
  title: Joi.string().trim().required().messages({
    'string.empty': 'Tiêu đề task không được để trống',
    'any.required': 'Tiêu đề task là bắt buộc',
  }),
  description: Joi.string().allow('').optional(),
  assignees: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('todo', 'in_progress', 'done').optional(),
  priority: Joi.string().valid('urgent', 'high', 'normal', 'low').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  color: Joi.string().trim().optional(),
  tags: Joi.array().items(tagSchema).optional(),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().trim().optional(),
  description: Joi.string().allow('').optional(),
  assignees: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('todo', 'in_progress', 'done').optional(),
  priority: Joi.string().valid('urgent', 'high', 'normal', 'low').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  color: Joi.string().trim().optional(),
  tags: Joi.array().items(tagSchema).optional(),
});

const moveTaskSchema = Joi.object({
  taskId: Joi.string().required().messages({
    'any.required': 'taskId là bắt buộc'
  }),
  sourceColumnId: Joi.string().required().messages({
    'any.required': 'sourceColumnId là bắt buộc'
  }),
  destinationColumnId: Joi.string().required().messages({
    'any.required': 'destinationColumnId là bắt buộc'
  }),
  sourceTaskIds: Joi.array().items(Joi.string()).required().messages({
    'any.required': 'sourceTaskIds là bắt buộc'
  }),
  destinationTaskIds: Joi.array().items(Joi.string()).required().messages({
    'any.required': 'destinationTaskIds là bắt buộc'
  }),
  sourceIndex: Joi.number().integer().min(0).required().messages({
    'any.required': 'sourceIndex là bắt buộc'
  }),
  destinationIndex: Joi.number().integer().min(0).required().messages({
    'any.required': 'destinationIndex là bắt buộc'
  }),
});

const addTagsSchema = Joi.array().items(tagSchema).unique('name').optional().messages({
  'array.unique': 'Tên tag không được trùng lặp trong danh sách thêm',
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  addTagsSchema,
};
