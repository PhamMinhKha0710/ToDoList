import { z } from "zod";

export const personalTaskBaseSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(200, "Tiêu đề tối đa 200 ký tự"),
  description: z.string().max(2000, "Mô tả tối đa 2000 ký tự").optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  priority: z.enum(["urgent", "high", "normal", "low"]).default("normal"),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  color: z.string().optional(),
});

const dateRefinement = (data: any) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
};

const dateRefinementConfig = {
  message: "Ngày kết thúc không được trước ngày bắt đầu",
  path: ["endDate"],
};

export const createPersonalTaskSchema = personalTaskBaseSchema.refine(dateRefinement, dateRefinementConfig);

export type CreatePersonalTaskFormValues = z.infer<typeof createPersonalTaskSchema>;

export const updatePersonalTaskSchema = personalTaskBaseSchema.partial().refine(dateRefinement, dateRefinementConfig);

export type UpdatePersonalTaskFormValues = z.infer<typeof updatePersonalTaskSchema>;
