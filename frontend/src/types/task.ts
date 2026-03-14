import type { TaskPriorityType, TaskStatusType } from '@/schemas/task.schema';

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
  title: string;
  description?: string;
  assigneeId?: string;
  status: TaskStatusType;
  priority: TaskPriorityType;
  dueDate?: string;
  color?: string;
  tags?: { name: string; color?: string }[];
  // attachments không còn nằm cứng trong Task, nhưng ở frontend có thể để dạng custom field
  attachments?: Attachment[]; 
  order: number;
  createdAt: string;
  updatedAt: string;
}

