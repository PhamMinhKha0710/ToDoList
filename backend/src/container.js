/**
 * DI Container — Nơi DUY NHẤT quản lý và khởi tạo tất cả dependencies
 *
 * Thứ tự: Entities → Utils → Config → 3rd Party → Repositories → Services → Controllers
 *
 * Design Patterns:
 *   - DI Container (Dependency Injection)
 *   - Service Locator
 */

// ─── Entities ─────────────────────────────────────────────────────────────────
const User = require('./entities/User');
const Task = require('./entities/Task');
const Column = require('./entities/Column');
const Project = require('./entities/Project');
const PersonalTask = require('./entities/PersonalTask');
const Notification = require('./entities/Notification');
const Attachment = require('./entities/Attachment');
const ActivityLog = require('./entities/ActivityLog');
const Comment = require('./entities/Comment');
const Otp = require('./entities/Otp');

// ─── Utils ────────────────────────────────────────────────────────────────────
const ApiError = require('./utils/ApiError');
const ApiResponse = require('./utils/ApiResponse');
const catchAsync = require('./utils/catchAsync');

// ─── Config ───────────────────────────────────────────────────────────────────
const { getIO } = require('./config/socket');
const env = require('./config/env');
const logger = require('./utils/logger');

// ─── 3rd Party ────────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const ejs = require('ejs');

// ─── Repositories ─────────────────────────────────────────────────────────────
const ProjectRepository = require('./repositories/project.repository');
const TaskRepository = require('./repositories/task.repository');
const ColumnRepository = require('./repositories/column.repository');
const CommentRepository = require('./repositories/comment.repository');
const NotificationRepository = require('./repositories/notification.repository');
const AttachmentRepository = require('./repositories/attachment.repository');
const PersonalTaskRepository = require('./repositories/personalTask.repository');

// ─── Instantiate Repositories ─────────────────────────────────────────────────
const projectRepository = new ProjectRepository({ Project, Column, Task });
const taskRepository = new TaskRepository({
  Task,
  Attachment,
  mongoose,
});
const columnRepository = new ColumnRepository({ Column });
const commentRepository = new CommentRepository({ Comment });
const notificationRepository = new NotificationRepository({ Notification });
const attachmentRepository = new AttachmentRepository({ Attachment });
const personalTaskRepository = new PersonalTaskRepository({ PersonalTask });

// ─── Socket Emitters ──────────────────────────────────────────────────────────
const { emitNotification } = require('./sockets/notification.socket');
const { emitActivityCreated } = require('./sockets/activity.socket');
const { emitDashboardUpdated } = require('./sockets/task.socket');

// ─── Utils/Encryption ─────────────────────────────────────────────────────────
const encryption = require('./utils/encryption');
const userResponseModel = require('./models/users/userResponse.model');

// ─── Simple Utility Services ──────────────────────────────────────────────────
const TokenService = require('./services/token.service');
const MailService = require('./services/mail.service');

// ─── Instantiate Utility Services ──────────────────────────────────────────────
const tokenService = new TokenService({
  jwt,
  JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES: env.JWT_ACCESS_EXPIRES,
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES: env.JWT_REFRESH_EXPIRES,
});

const mailService = new MailService({
  nodemailer,
  ejs,
  path,
  MAIL_HOST: env.MAIL_HOST,
  MAIL_PORT: env.MAIL_PORT,
  MAIL_USER: env.MAIL_USER,
  MAIL_PASS: env.MAIL_PASS,
  logger,
});

// ─── Main Services (Import Classes) ───────────────────────────────────────────
const ActivityService = require('./services/activity.service');
const NotificationService = require('./services/notification.service');
const AuthService = require('./services/auth.service');
const ProjectService = require('./services/project.service');
const TaskService = require('./services/task.service');
const ColumnService = require('./services/column.service');
const CommentService = require('./services/comment.service');
const UserService = require('./services/user.service');
const PersonalTaskService = require('./services/personalTask.service');
const AttachmentService = require('./services/attachment.service');
const AdminService = require('./services/admin/admin.service');
const TwoFactorService = require('./services/twoFactor.service');
const UploadService = require('./services/upload.service');
const UserDashboardService = require('./services/user-dashboard.service');

// ─── Instantiate Main Services ──────────────────────────────────────────────────

const activityService = new ActivityService({
  ActivityLog,
  Project,
  emitActivityCreated,
  getIO,
});

const notificationService = new NotificationService({
  notificationRepository,
  emitNotification,
  getIO,
});

const authService = new AuthService({
  bcrypt,
  crypto,
  User,
  Otp,
  tokenService,
  mailService,
  encryption,
  userResponseModel,
  ApiError,
  CLIENT_URL: env.CLIENT_URL,
});

const projectService = new ProjectService({
  projectRepository,
  User,
  ApiError,
});

const taskService = new TaskService({
  taskRepository,
  Task,
  Column,
  ApiError,
  mongoose,
});

const columnService = new ColumnService({
  columnRepository,
  Column,
  ApiError,
  mongoose,
});

const commentService = new CommentService({
  commentRepository,
  ApiError,
  Task,
  PersonalTask,
  Column,
  projectService,
});

const userService = new UserService({
  User,
  bcrypt,
  ApiError,
  authService,
});

const personalTaskService = new PersonalTaskService({
  personalTaskRepository,
  ApiError,
  emitDashboardUpdated,
});

const attachmentService = new AttachmentService({
  fs,
  path,
  attachmentRepository,
  Task,
  PersonalTask,
  Column,
  ApiError,
});

const adminService = new AdminService({
  User,
  Task,
  Project,
  ApiError,
  authService,
});

const twoFactorService = new TwoFactorService();

const uploadService = new UploadService();

const userDashboardService = new UserDashboardService({
  PersonalTask,
  Task,
  Project,
  ActivityLog,
});

// ─── Controllers (Import Classes) ────────────────────────────────────────────
const ProjectController = require('./controllers/project.controller');
const TaskController = require('./controllers/task.controller');
const ColumnController = require('./controllers/column.controller');
const CommentController = require('./controllers/comment.controller');
const NotificationController = require('./controllers/notification.controller');
const PersonalTaskController = require('./controllers/personalTask.controller');
const UserController = require('./controllers/user.controller');
const AttachmentController = require('./controllers/attachment.controller');
const ActivityController = require('./controllers/activity.controller');
const AuthController = require('./controllers/auth.controller');
const AdminController = require('./controllers/admin/admin.controller');
const TwoFactorController = require('./controllers/twoFactor.controller');
const UploadController = require('./controllers/upload.controller');
const UserDashboardController = require('./controllers/user-dashboard.controller');

// ─── Instantiate Controllers ─────────────────────────────────────────────────

const projectController = new ProjectController({ projectService, ApiResponse, catchAsync });
const taskController = new TaskController({ taskService, ApiResponse, catchAsync });
const columnController = new ColumnController({ columnService, ApiResponse, catchAsync });
const commentController = new CommentController({ commentService, ApiResponse, catchAsync });
const notificationController = new NotificationController({ notificationService, ApiResponse, catchAsync });
const personalTaskController = new PersonalTaskController({ personalTaskService, ApiResponse, catchAsync });
const userController = new UserController({ userService, User, ApiError, ApiResponse, catchAsync });
const attachmentController = new AttachmentController({ attachmentService, ApiResponse, catchAsync });
const activityController = new ActivityController({ activityService, ApiResponse, catchAsync });
const authController = new AuthController({ authService, ApiResponse, catchAsync, CLIENT_URL: env.CLIENT_URL });
const adminController = new AdminController({ adminService, ApiResponse, catchAsync });
const twoFactorController = new TwoFactorController({ twoFactorService, authService, ApiError, ApiResponse, catchAsync });
const uploadController = new UploadController({ uploadService, ApiError, ApiResponse, catchAsync });
const userDashboardController = new UserDashboardController({ userDashboardService, ApiResponse, catchAsync });

// ─── Export Container ─────────────────────────────────────────────────────────

module.exports = {
  // Services
  activityService,
  notificationService,
  authService,
  projectService,
  taskService,
  columnService,
  commentService,
  userService,
  personalTaskService,
  attachmentService,
  adminService,
  twoFactorService,
  uploadService,
  userDashboardService,
  tokenService,
  mailService,

  // Controllers
  projectController,
  taskController,
  columnController,
  commentController,
  notificationController,
  personalTaskController,
  userController,
  attachmentController,
  activityController,
  authController,
  adminController,
  twoFactorController,
  uploadController,
  userDashboardController,
};
