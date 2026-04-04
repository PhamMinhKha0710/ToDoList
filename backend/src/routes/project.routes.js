const express = require("express");
const projectController = require("../controllers/project.controller");
const projectValidator = require("../validators/project.validator");
const { validate } = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  isProjectMember,
  isProjectOwner,
  isProjectManagerOrAbove,
} = require("../middlewares/project.middleware");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

const parseMembers = (req, res, next) => {
  if (req.body.members && typeof req.body.members === "string") {
    try {
      req.body.members = JSON.parse(req.body.members);
    } catch (error) {
      // Ignored, let Joi schema validate it
    }
  }
  next();
};

router.use(authenticate); // Tất cả route project đều cần đăng nhập

// Lấy danh sách dự án của user và tạo dự án mới
router
  .route("/")
  .get(projectController.getUserProjects)
  .post(
    upload.single("file"),
    parseMembers,
    validate(projectValidator.createProjectSchema),
    projectController.createProject,
  );

// Lấy, cập nhật, xóa 1 dự án cụ thể
router
  .route("/:projectId")
  .get(isProjectMember, projectController.getProjectById)
  .put(
    upload.single("file"),
    parseMembers,
    validate(projectValidator.updateProjectSchema),
    isProjectOwner, // Chỉ owner mới được sửa thông tin board
    projectController.updateProject,
  )
  .delete(isProjectOwner, projectController.deleteProject); // Chỉ owner xóa board

// Lấy thông tin lời mời
router
  .route("/:projectId/invitation")
  .get(projectController.getInvitationDetails);

// Trả lời lời mời (chấp nhận/từ chối)
router
  .route("/:projectId/invitation/respond")
  .post(
    validate(projectValidator.respondInvitationSchema),
    projectController.respondToInvitation,
  );

// Thêm thành viên: Owner hoặc Admin
router
  .route("/:projectId/members")
  .post(
    validate(projectValidator.addMemberSchema),
    isProjectManagerOrAbove,
    projectController.addMember,
  );

// Xóa, đổi role thành viên
router
  .route("/:projectId/members/:memberId")
  .put(
    validate(projectValidator.updateMemberRoleSchema),
    isProjectOwner, // Chỉ owner đổi role
    projectController.updateMemberRole,
  )
  .delete(isProjectManagerOrAbove, projectController.removeMember); // Owner hoặc Admin xóa member

// Quản lý mã mời (Chỉ Manager trở lên)
router.route("/:projectId/invite-code")
  .get(isProjectManagerOrAbove, projectController.getInviteCode)
  .delete(isProjectManagerOrAbove, projectController.deleteInviteCode);

router.post("/:projectId/invite-code/regenerate", isProjectManagerOrAbove, projectController.regenerateInviteCode);

// Gia nhập qua mã mời (Dành cho bất kỳ user nào đã login)
router.get("/invite/code/:inviteCode", projectController.getProjectByInviteCode);
router.post("/invite/code/:inviteCode/join", projectController.joinByInviteCode);

module.exports = router;
