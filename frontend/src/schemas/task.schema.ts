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

export const createTaskSchema = z.object({
  columnId: z.string().min(1, 'ID cột là bắt buộc'),
  title: z.string().min(1, 'Tiêu đề công việc không được để trống'),
  description: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().nullable().optional(),
  color: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  tags: z.array(
    z.object({
      name: z.string().min(1, 'Tên thẻ không được để trống'),
      color: z.string().optional()
    })
  ).optional(),
  attachments: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
      file: z.any().optional(),
    })
  ).optional(),
});

export type CreateTaskPayload = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();

export type UpdateTaskPayload = z.infer<typeof updateTaskSchema>;
