const express = require('express');
const twoFactorController = require('../controllers/twoFactor.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public endpoint: resolves 2FA login sequence via temporary tokens
router.post('/authenticate', twoFactorController.authenticate);

// Required to be authenticated to interact with basic 2FA settings
router.use(auth);

router.post('/generate', twoFactorController.generate);
router.post('/verify-setup', twoFactorController.verifySetup);

module.exports = router;
