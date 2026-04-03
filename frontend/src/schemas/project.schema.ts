import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Tên dự án không được để trống'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  color: z.string().optional()
});

export type CreateProjectPayload = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();

export type UpdateProjectPayload = z.infer<typeof updateProjectSchema>;
