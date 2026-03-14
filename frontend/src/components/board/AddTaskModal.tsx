import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import {
  createTaskSchema,
  type CreateTaskPayload,
  TaskPriority,
} from "@/schemas/task.schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";
import { Loader2, Flag, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useKanbanStore } from "@/stores/kanban.store";
import { TaskAttachments } from "@/components/taskDetail/TaskAttachments";

const PRESET_COLORS = [
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

interface AddTaskModalProps {
  columnId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddTaskModal = ({
  columnId,
  open,
  onOpenChange,
}: AddTaskModalProps) => {
  const queryClient = useQueryClient();
  const { addTask } = useKanbanStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CreateTaskPayload>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      columnId,
      title: "",
      description: "",
      priority: TaskPriority.NORMAL,
      color: PRESET_COLORS[0],
      tags: [],
      attachments: [],
    },
  });

  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);

  const selectedColor = watch("color");
  const selectedPriority = watch("priority");
  const tags = watch("tags") || [];
  const attachments = watch("attachments") || [];

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    if (
      tags.some((t) => t.name.toLowerCase() === newTagName.trim().toLowerCase())
    ) {
      toast.error("Tag này đã tồn tại");
      return;
    }
    setValue("tags", [
      ...tags,
      { name: newTagName.trim(), color: newTagColor },
    ]);
    setNewTagName("");
  };

  const handleRemoveTag = (tagName: string) => {
    setValue(
      "tags",
      tags.filter((t) => t.name !== tagName),
    );
  };

  const createMutation = useMutation({
    mutationFn: taskService.createTask,
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi tạo công việc",
      );
    },
  });

  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const onSubmit = async (data: CreateTaskPayload) => {
    try {
      setIsUploadingFiles(true);
      
      const formData = new FormData();
      formData.append('columnId', data.columnId);
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.assigneeId) formData.append('assigneeId', data.assigneeId);
      if (data.status) formData.append('status', data.status);
      if (data.priority) formData.append('priority', data.priority);
      if (data.color) formData.append('color', data.color);
      
      if (data.dueDate) {
        try {
          formData.append('dueDate', new Date(data.dueDate).toISOString());
        } catch (e) {
          console.error("Invalid date format", e);
        }
      }

      if (data.tags && data.tags.length > 0) {
        formData.append('tags', JSON.stringify(data.tags));
      }

      // Append files to 'files' key
      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach((att: any) => {
          if (att.file) {
            formData.append('files', att.file);
          }
        });
      }

      const newTask = await createMutation.mutateAsync(formData);

      toast.success("Đã thêm công việc mới!");
      addTask(columnId, newTask);
      queryClient.invalidateQueries({ queryKey: ["tasks", columnId] });
      reset();
      onOpenChange(false);
    } catch (error: any) {
      // toast error is handled by mutation onError
    } finally {
      setIsUploadingFiles(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          reset();
          setNewTagName("");
          setNewTagColor(PRESET_COLORS[0]);
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto w-full p-0">
        <div className="p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-800">
              Thêm công việc mới
            </DialogTitle>
            <DialogDescription>
              Nhập chi tiết công việc bạn muốn thêm vào cột này.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit as any)}
            className="mt-6 flex flex-col gap-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Left Column (Information) */}
              <div className="md:col-span-3 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold">
                    Tiêu đề <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Nhập tiêu đề công việc..."
                    {...register("title")}
                    autoFocus
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-sm font-semibold"
                  >
                    Mô tả
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Thêm mô tả chi tiết (tùy chọn)..."
                    className="resize-none min-h-[100px]"
                    {...register("description")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Độ ưu tiên</Label>
                    <Select
                      value={selectedPriority}
                      onValueChange={(val: any) => setValue("priority", val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn độ ưu tiên" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TaskPriority.URGENT}>
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-destructive fill-destructive" />
                            <span>Khẩn cấp</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={TaskPriority.HIGH}>
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-orange-500 fill-orange-500" />
                            <span>Cao</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={TaskPriority.NORMAL}>
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-blue-500 fill-blue-500" />
                            <span>Bình thường</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={TaskPriority.LOW}>
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-gray-500 fill-gray-500" />
                            <span>Thấp</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-sm font-semibold">
                      Ngày hết hạn
                    </Label>
                    <Input id="dueDate" type="date" {...register("dueDate")} />
                  </div>
                </div>

                {/* Tags Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Phân loại (Tags)
                  </Label>

                  {/* Tag List */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <div
                          key={tag.name}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 shadow-sm text-xs font-bold text-slate-700 bg-white"
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: tag.color || "#ec4899" }}
                          />
                          {tag.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag.name)}
                            className="text-slate-400 hover:text-red-500 transition-colors ml-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Tag Input */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Nhập tên tag mới..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1"
                    />
                    <div
                      className="relative w-10 h-10 shrink-0 border rounded-md overflow-hidden cursor-pointer"
                      title="Chọn màu cho tag"
                    >
                      <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="absolute inset-[-10px] w-20 h-20 cursor-pointer opacity-0 z-10"
                      />
                      <div className="w-full h-full flex items-center justify-center bg-slate-50">
                        <div
                          className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: newTagColor }}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddTag}
                      disabled={!newTagName.trim()}
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column (Attachments & Settings) */}
              <div className="md:col-span-2 space-y-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 h-fit">
                <TaskAttachments
                  attachments={attachments}
                  onChange={(newAtt) => setValue("attachments", newAtt)}
                  isEditing={true}
                />

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Màu sắc đánh dấu
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`w-7 h-7 rounded-md border-2 transition-all ${selectedColor === c ? "border-primary md:scale-110 shadow-sm" : "border-transparent hover:scale-105"}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setValue("color", c)}
                      />
                    ))}

                    <div
                      className="relative w-7 h-7 rounded-md border-2 border-transparent hover:scale-105 transition-all outline-none"
                      title="Màu tự chọn"
                    >
                      <input
                        type="color"
                        {...register("color")}
                        className="absolute inset-[-5px] w-10 h-10 cursor-pointer opacity-0 z-10"
                      />
                      <div
                        className="w-full h-full rounded-md border border-border"
                        style={{ backgroundColor: selectedColor || "#fff" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-slate-100 flex-shrink-0 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || isUploadingFiles}
              >
                {createMutation.isPending || isUploadingFiles ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploadingFiles ? "Đang tải file..." : "Đang thêm..."}
                  </>
                ) : (
                  "Thêm công việc"
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
