const eventBus = require('../utils/eventBus');
const logger = require('../utils/logger');

/**
 * Đăng ký tất cả Subscribers vào EventBus
 * Gọi 1 lần khi server khởi động (sau khi socket initialized)
 */
const registerSubscribers = (container) => {
  const deps = {
    // Socket emitters
    taskSocket: require('../sockets/task.socket'),
    columnSocket: require('../sockets/column.socket'),
    commentSocket: require('../sockets/comment.socket'),
    getIO: require('../config/socket').getIO,

    // Services
    notificationService: container.notificationService,
    activityService: container.activityService,
    mailService: require('../services/mail.service'),

    // Config
    CLIENT_URL: require('../config/env').CLIENT_URL,
  };

  // Register each subscriber
  require('./task.subscriber')(eventBus, deps);
  require('./project.subscriber')(eventBus, deps);
  require('./comment.subscriber')(eventBus, deps);
  require('./column.subscriber')(eventBus, deps);
  require('./admin.subscriber')(eventBus, deps);

  logger.info('[Subscribers] All subscribers registered successfully');
};

module.exports = { registerSubscribers };
