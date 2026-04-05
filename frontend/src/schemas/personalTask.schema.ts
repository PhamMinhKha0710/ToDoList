import { z } from "zod";

export const createPersonalTaskSchema = z.object({
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
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "Ngày kết thúc không được trước ngày bắt đầu",
  path: ["endDate"],
});

export type CreatePersonalTaskFormValues = z.infer<typeof createPersonalTaskSchema>;

export const updatePersonalTaskSchema = createPersonalTaskSchema.partial();

export type UpdatePersonalTaskFormValues = z.infer<typeof updatePersonalTaskSchema>;
