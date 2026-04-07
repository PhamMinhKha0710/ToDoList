const express = require('express');
const { userController } = require('../container');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { updateProfileSchema, changePasswordSchema } = require('../validators/user.validator');

const router = express.Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.get('/search', userController.searchUsers);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.put('/change-password', validate(changePasswordSchema), userController.changePassword);

module.exports = router;
