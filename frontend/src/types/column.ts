import { z } from 'zod';

export interface Column {
  _id: string;
  projectId: string;
  title: string;
  color?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export const createColumnSchema = z.object({
  projectId: z.string().min(1, 'ID dự án là bắt buộc'),
  title: z.string().min(1, 'Tiêu đề cột không được để trống'),
  color: z.string().optional()
});

export type CreateColumnPayload = z.infer<typeof createColumnSchema>;

export const updateColumnSchema = z.object({
  title: z.string().min(1, 'Tiêu đề cột không được để trống').optional(),
  color: z.string().optional()
});

export type UpdateColumnPayload = z.infer<typeof updateColumnSchema>;
