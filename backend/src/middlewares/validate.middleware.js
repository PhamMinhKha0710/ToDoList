const ApiError = require('../utils/ApiError');

/**
 * Middleware factory dùng để validate request body/query/params bằng Joi schema
 *
 * @param {Joi.Schema} schema - Schema Joi để validate
 * @param {'body'|'query'|'params'} target - Phần của request cần validate (mặc định 'body')
 */
const validate = (schema, target = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[target], { abortEarly: false, stripUnknown: true });
  if (error) {
    const message = error.details.map((d) => d.message).join('; ');
    return next(new ApiError(422, message));
  }
  req[target] = value; // gán lại giá trị đã được clean
  next();
};

module.exports = { validate };
