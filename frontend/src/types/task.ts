import { z } from 'zod';

export const TaskPriority = {
  URGENT: 'urgent',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
} as const;

export type TaskPriorityType = typeof TaskPriority[keyof typeof TaskPriority];

export const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
} as const;

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];

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

export const createTaskSchema = z.object({
  columnId: z.string().min(1, 'ID cột là bắt buộc'),
  title: z.string().min(1, 'Tiêu đề công việc không được để trống'),
  description: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().nullable().optional(),
  color: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});

export type CreateTaskPayload = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();

export type UpdateTaskPayload = z.infer<typeof updateTaskSchema>;
