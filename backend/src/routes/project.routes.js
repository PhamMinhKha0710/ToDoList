const { Router } = require('express');
const { projectController } = require('../container');
const { authenticate } = require('../middlewares/auth.middleware');
const { isProjectMember, isProjectManagerOrAbove } = require('../middlewares/project.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createProjectSchema, updateProjectSchema, addMemberSchema,
  updateMemberRoleSchema, respondInvitationSchema,
} = require('../validators/project.validator');

const router = Router();

router.use(authenticate);

// Project invite code routes (công khai cho user đã login)
router.get('/invite-code/:inviteCode', projectController.getProjectByInviteCode);
router.post('/invite-code/:inviteCode/join', projectController.joinByInviteCode);

// Project CRUD
router.route('/')
  .get(projectController.getUserProjects)
  .post(validate(createProjectSchema), projectController.createProject);

router.route('/:projectId')
  .get(isProjectMember, projectController.getProjectById)
  .put(isProjectManagerOrAbove, validate(updateProjectSchema), projectController.updateProject)
  .delete(isProjectManagerOrAbove, projectController.deleteProject);

// Project stats
router.get('/:projectId/stats', isProjectMember, projectController.getProjectStats);

// Member management
router.post('/:projectId/members', isProjectManagerOrAbove, validate(addMemberSchema), projectController.addMember);
router.delete('/:projectId/members/:memberId', isProjectManagerOrAbove, projectController.removeMember);
router.patch('/:projectId/members/:memberId/role', isProjectManagerOrAbove, validate(updateMemberRoleSchema), projectController.updateMemberRole);

// Invitation
router.get('/:projectId/invitation', projectController.getInvitationDetails);
router.post('/:projectId/invitation/respond', validate(respondInvitationSchema), projectController.respondToInvitation);

// Invite code
router.get('/:projectId/invite-code', isProjectManagerOrAbove, projectController.getInviteCode);
router.post('/:projectId/invite-code/regenerate', isProjectManagerOrAbove, projectController.regenerateInviteCode);
router.delete('/:projectId/invite-code', isProjectManagerOrAbove, projectController.deleteInviteCode);

module.exports = router;
