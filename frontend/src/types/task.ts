import type { TaskPriorityType, TaskStatusType } from '@/schemas/task.schema';

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
  order: number;
  createdAt: string;
  updatedAt: string;
}

