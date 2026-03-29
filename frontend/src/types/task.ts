import type { TaskPriorityType, TaskStatusType } from '@/schemas/task.schema';
import type { User } from './user';

export interface Attachment {
  _id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  columnId: string;
  projectId: string;
  creator?: User;
  creatorId: string;
  assignees?: User[];
  assigneeIds: string[];
  title: string;
  description?: string;
  status: TaskStatusType;
  priority: TaskPriorityType;
  dueDate?: string;
  color?: string;
  tags?: { name: string; color?: string }[];
  // attachments không còn nằm cứng trong Task, nhưng ở frontend có thể để dạng custom field
  attachments?: Attachment[];
  position: number;
  createdAt: string;
  updatedAt: string;
  // Unified fields for calendar
  isPersonal?: boolean;
  startDate?: string;
  endDate?: string;
}
