const express = require('express');
const projectController = require('./project.controller');
const projectValidator = require('./project.validator');
const { validate } = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isProjectMember, isProjectOwner } = require('../../middlewares/project.middleware');

const router = express.Router();

router.use(authenticate); // Tất cả route project đều cần đăng nhập

// Lấy danh sách dự án của user và tạo dự án mới
router
  .route('/')
  .get(projectController.getUserProjects)
  .post(validate(projectValidator.createProjectSchema), projectController.createProject);

// Lấy, cập nhật, xóa 1 dự án cụ thể
router
  .route('/:projectId')
  .get(isProjectMember, projectController.getProjectById)
  .put(validate(projectValidator.updateProjectSchema), isProjectOwner, projectController.updateProject)
  .delete(isProjectOwner, projectController.deleteProject);

// Thêm, xóa thành viên trong dự án
router
  .route('/:projectId/members')
  .post(validate(projectValidator.addMemberSchema), isProjectOwner, projectController.addMember);

router
  .route('/:projectId/members/:memberId')
  .put(isProjectOwner, projectController.updateMemberRole)
  .delete(isProjectOwner, projectController.removeMember);

module.exports = router;
