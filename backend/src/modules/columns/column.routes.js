const express = require('express');
const columnController = require('./column.controller');
const columnValidator = require('./column.validator');
const { validate } = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireColumnOwner, requireProjectOwnerFromBody } = require('../../middlewares/column.middleware');

const router = express.Router();

router.use(authenticate);

router.route('/')
  .post(validate(columnValidator.createColumnSchema), requireProjectOwnerFromBody, columnController.createColumn);

router.route('/:columnId')
  .put(validate(columnValidator.updateColumnSchema), requireColumnOwner, columnController.updateColumn)
  .delete(requireColumnOwner, columnController.deleteColumn);

module.exports = router;
