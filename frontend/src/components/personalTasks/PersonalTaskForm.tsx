import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPersonalTaskSchema, type CreatePersonalTaskFormValues } from "@/schemas/personalTask.schema";
import type { PersonalTask } from "@/types/personalTask";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PersonalTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreatePersonalTaskFormValues) => void;
  defaultValues?: Partial<PersonalTask>;
  prefillDateForCreate?: Date;
  isSubmitting?: boolean;
}

const TASK_COLORS = [
  { value: "red", bg: "bg-red-500" },
  { value: "blue", bg: "bg-blue-500" },
  { value: "green", bg: "bg-emerald-500" },
  { value: "yellow", bg: "bg-amber-400" },
  { value: "orange", bg: "bg-orange-500" },
  { value: "pink", bg: "bg-pink-500" },
  { value: "cyan", bg: "bg-cyan-500" },
];

export function PersonalTaskForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  prefillDateForCreate,
  isSubmitting = false,
}: PersonalTaskFormProps) {
  const isEditing = !!defaultValues?._id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreatePersonalTaskFormValues>({
    resolver: zodResolver(createPersonalTaskSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      priority: defaultValues?.priority || "normal",
      status: defaultValues?.status || "todo",
      startDate: defaultValues?.startDate
        ? new Date(defaultValues.startDate).toISOString().split("T")[0]
        : "",
      endDate: defaultValues?.endDate
        ? new Date(defaultValues.endDate).toISOString().split("T")[0]
        : "",
      color: defaultValues?.color || "",
    },
  });

  useEffect(() => {
    if (!open) return;
    const defaultDateStr = defaultValues?._id
      ? undefined
      : prefillDateForCreate
        ? format(prefillDateForCreate, "yyyy-MM-dd")
        : undefined;

    reset({
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      priority: defaultValues?.priority || "normal",
      status: defaultValues?.status || "todo",
      startDate:
        defaultValues?.startDate
          ? new Date(defaultValues.startDate).toISOString().split("T")[0]
          : defaultDateStr || "",
      endDate:
        defaultValues?.endDate
          ? new Date(defaultValues.endDate).toISOString().split("T")[0]
          : defaultDateStr || "",
      color: defaultValues?.color || "",
    });
  }, [open, defaultValues, prefillDateForCreate, reset]);

  const selectedColor = watch("color");

  const handleFormSubmit = (values: CreatePersonalTaskFormValues) => {
    onSubmit(values);
    reset();
  };

  const handleOpenChange = (state: boolean) => {
    if (!state) reset();
    onOpenChange(state);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Chỉnh sửa công việc" : "Tạo công việc mới"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin công việc cá nhân."
              : "Thêm công việc mới vào danh sách cá nhân."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">Tiêu đề *</Label>
            <Input
              id="task-title"
              placeholder="Nhập tiêu đề công việc..."
              {...register("title")}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-desc">Mô tả</Label>
            <Textarea
              id="task-desc"
              placeholder="Mô tả chi tiết (tùy chọn)..."
              rows={3}
              {...register("description")}
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Độ ưu tiên</Label>
              <Select
                value={watch("priority")}
                onValueChange={(val) => setValue("priority", val as CreatePersonalTaskFormValues["priority"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">🔴 Khẩn cấp</SelectItem>
                  <SelectItem value="high">🟠 Cao</SelectItem>
                  <SelectItem value="normal">🔵 Bình thường</SelectItem>
                  <SelectItem value="low">⚪ Thấp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={watch("status")}
                onValueChange={(val) => setValue("status", val as CreatePersonalTaskFormValues["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Cần làm</SelectItem>
                  <SelectItem value="in_progress">Đang làm</SelectItem>
                  <SelectItem value="done">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Ngày bắt đầu</Label>
              <Input id="start-date" type="date" {...register("startDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Ngày kết thúc</Label>
              <Input id="end-date" type="date" {...register("endDate")} />
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Màu nhãn</Label>
            <div className="flex items-center gap-2">
              {TASK_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setValue("color", selectedColor === c.value ? "" : c.value)}
                  className={cn(
                    "h-7 w-7 rounded-full transition-all duration-150 border-2",
                    c.bg,
                    selectedColor === c.value
                      ? "border-foreground scale-110 ring-2 ring-offset-2 ring-offset-background ring-foreground/20"
                      : "border-transparent hover:scale-110"
                  )}
                  aria-label={`Color ${c.value}`}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
