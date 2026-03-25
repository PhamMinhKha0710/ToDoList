export type NotificationType = 'project_invite' | 'task_assigned' | 'new_comment' | 'task_update' | 'member_joined' | 'member_declined';

export interface Notification {
  _id: string;
  recipientId: string;
  type: NotificationType;
  title?: string;
  message?: string;
  read: boolean;
  metadata?: {
    projectId?: string;
    projectName?: string;
    taskId?: string;
    taskTitle?: string;
    commentId?: string;
    [key: string]: any;
  };
  createdAt: string;
}
