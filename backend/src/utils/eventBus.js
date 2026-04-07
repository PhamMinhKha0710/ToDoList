const EventEmitter = require('events');
const logger = require('./logger');

/**
 * EventBus — Singleton dùng Observer Pattern
 * Services emit events (pure business logic), Subscribers handle side-effects (socket, notification, email, activity log)
 *
 * Cách dùng:
 *   eventBus.emit('task.created', { task, userId, projectId });
 *   eventBus.on('task.created', async (payload) => { ... });
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  /**
   * Emit bất đồng bộ — tất cả subscribers chạy song song, lỗi được log mà KHÔNG crash main flow
   * @param {string} event
   * @param {object} payload
   */
  emitAsync(event, payload) {
    const listeners = this.listeners(event);
    if (listeners.length === 0) return;

    listeners.forEach(async (listener) => {
      try {
        await listener(payload);
      } catch (err) {
        logger.error(`[EventBus] Subscriber error on "${event}": ${err.message}`, { stack: err.stack });
      }
    });
  }
}

module.exports = new EventBus();
