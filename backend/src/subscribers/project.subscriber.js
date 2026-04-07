const logger = require('../utils/logger');

/**
 * Project Subscriber — xử lý side-effects khi có project events
 * Socket emit, notification, email, activity log
 */
module.exports = (eventBus, { notificationService, activityService, mailService, getIO, CLIENT_URL }) => {

  eventBus.on('project.created', async ({ project, userId }) => {
    await activityService.createActivityLog({
      projectId: project._id,
      userId,
      action: 'PROJECT_CREATED',
      entityType: 'project',
      entityId: project._id,
      detail: { name: project.name },
    });
  });

  eventBus.on('member.invited', async ({ project, invitedUser, inviterId, role }) => {
    const projectId = project._id.toString();

    // 1. Socket emit — cập nhật member list
    try {
      getIO().to(projectId).emit('project:member_updated', { projectId });
    } catch (err) { /* ignore */ }

    // 2. Notification cho người được mời
    await notificationService.createNotification({
      recipientId: invitedUser._id,
      type: 'project_invite',
      title: 'Lời mời dự án',
      message: `Bạn được mời tham gia dự án "${project.name}"`,
      metadata: { projectId },
    });

    // 3. Email
    const projectUrl = `${CLIENT_URL}/projects/${projectId}/invite`;
    try {
      await mailService.sendProjectInvitationEmail(
        invitedUser.email,
        project.name,
        invitedUser.displayName || 'Thành viên',
        projectUrl,
        project.color,
        project.imageUrl,
      );
    } catch (err) {
      logger.error(`Failed to send project invitation email: ${err.message}`);
    }

    // 4. Cập nhật danh sách project cho người được mời
    try {
      getIO().to(`user:${invitedUser._id}`).emit('project:list_updated');
    } catch (err) { /* ignore */ }

    // 5. Activity log
    await activityService.createActivityLog({
      projectId,
      userId: inviterId,
      action: 'MEMBER_INVITED',
      entityType: 'member',
      entityId: invitedUser._id,
      detail: { email: invitedUser.email, role },
    });
  });

  eventBus.on('member.removed', async ({ project, memberId, removerId }) => {
    const projectId = project._id.toString();

    try {
      getIO().to(projectId).emit('project:member_updated', { projectId });
      getIO().to(`user:${memberId}`).emit('project:list_updated');
    } catch (err) { /* ignore */ }

    await notificationService.createNotification({
      recipientId: memberId,
      type: 'member_removed',
      title: 'Thông báo',
      message: `Bạn đã bị xóa khỏi dự án "${project.name}"`,
      metadata: { projectId },
    });

    await activityService.createActivityLog({
      projectId,
      userId: removerId,
      action: 'MEMBER_REMOVED',
      entityType: 'member',
      entityId: memberId,
      detail: { memberId },
    });
  });

  eventBus.on('member.roleUpdated', async ({ project, memberId, oldRole, newRole, updaterId }) => {
    const projectId = project._id.toString();

    try {
      getIO().to(projectId).emit('project:member_updated', { projectId });
    } catch (err) { /* ignore */ }

    await notificationService.createNotification({
      recipientId: memberId,
      type: 'member_role_updated',
      title: 'Thay đổi vai trò',
      message: `Vai trò của bạn trong dự án "${project.name}" đã thay đổi từ ${oldRole} thành ${newRole}`,
      metadata: { projectId },
    });

    await activityService.createActivityLog({
      projectId,
      userId: updaterId,
      action: 'MEMBER_ROLE_UPDATED',
      entityType: 'member',
      entityId: memberId,
      detail: { oldRole, newRole },
    });
  });

  eventBus.on('invitation.responded', async ({ project, userId, action }) => {
    const projectId = project._id.toString();

    try {
      getIO().to(projectId).emit('project:member_updated', { projectId });
    } catch (err) { /* ignore */ }

    // Thông báo cho owner
    const owner = project.members.find(m => m.role === 'owner');
    if (owner) {
      const ownerId = owner.userId._id ? owner.userId._id.toString() : owner.userId.toString();
      if (ownerId !== userId.toString()) {
        const user = project.members.find(m => {
          const mId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
          return mId === userId.toString();
        });
        const displayName = user?.userId?.displayName || 'Thành viên';

        const type = action === 'accept' ? 'member_joined' : 'member_declined';
        const message = action === 'accept'
          ? `${displayName} đã chấp nhận lời mời tham gia dự án "${project.name}"`
          : `${displayName} đã từ chối lời mời tham gia dự án "${project.name}"`;

        await notificationService.createNotification({
          recipientId: ownerId,
          type,
          title: 'Phản hồi lời mời',
          message,
          metadata: { projectId },
        });
      }
    }

    await activityService.createActivityLog({
      projectId,
      userId,
      action: action === 'accept' ? 'MEMBER_ACCEPTED' : 'MEMBER_DECLINED',
      entityType: 'member',
      entityId: userId,
      detail: { action },
    });
  });

  eventBus.on('member.joined', async ({ project, userId }) => {
    const projectId = project._id.toString();

    try {
      getIO().to(projectId).emit('project:member_updated', { projectId });
    } catch (err) { /* ignore */ }

    await activityService.createActivityLog({
      projectId,
      userId,
      action: 'MEMBER_JOINED_VIA_CODE',
      entityType: 'member',
      entityId: userId,
    });
  });

  logger.info('[Subscriber] Project subscriber registered');
};
