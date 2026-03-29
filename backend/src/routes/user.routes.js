const express = require("express");
const userController = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

// Tất cả các route của user đều yêu cầu đăng nhập
router.use(authenticate);

router.get("/search", userController.searchUsers);

module.exports = router;
