export const SOCKET_EVENTS = {
  // Client → Server
  JOIN_PROJECT: 'join:project',
  LEAVE_PROJECT: 'leave:project',

  // Server → Client
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_MOVED: 'task:moved',
  COLUMN_CREATED: 'column:created',
  COLUMN_DELETED: 'column:deleted',
  COMMENT_NEW: 'comment:new',
  COMMENT_DELETED: 'comment:deleted',
  MEMBER_INVITED: 'member:invited',
  NOTIFICATION_NEW: 'notification:new',
} as const
