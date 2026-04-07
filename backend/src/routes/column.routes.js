const express = require('express');
const { columnController } = require('../container');
const columnValidator = require('../validators/column.validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireColumnOwner, requireProjectOwnerFromBody } = require('../middlewares/column.middleware');
const { isProjectMember } = require('../middlewares/project.middleware');

const router = express.Router();

router.use(authenticate);

router.route('/project/:projectId')
  .get(isProjectMember, columnController.getProjectColumns);

router.route('/project/:projectId/reorder')
  .put(isProjectMember, columnController.reorderColumns);

router.route('/')
  .post(validate(columnValidator.createColumnSchema), requireProjectOwnerFromBody, columnController.createColumn);

router.route('/:columnId')
  .get(columnController.getColumnById)
  .put(validate(columnValidator.updateColumnSchema), requireColumnOwner, columnController.updateColumn)
  .delete(requireColumnOwner, columnController.deleteColumn);

module.exports = router;
