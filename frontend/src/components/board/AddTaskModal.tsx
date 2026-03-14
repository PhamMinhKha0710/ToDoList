import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Loader2, Flag, Plus, X, User as UserIcon } from "lucide-react";
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
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddTaskModal = ({
  columnId,
  open,
  onOpenChange,
}: Omit<AddTaskModalProps, 'projectId'>) => {
  const { addTask, members: projectMembers } = useKanbanStore();

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
      assignees: [], // Thêm default cho assignees
    },
  });

  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);

  const [searchAssignee, setSearchAssignee] = useState("");
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
        setIsAssigneeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      if (data.assignees && data.assignees.length > 0) {
        formData.append('assignees', JSON.stringify(data.assignees));
      }
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
                  {/* Multi-Select Assignees */}
                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm font-semibold">Người thực hiện</Label>
                    <div className="border border-slate-200 rounded-md p-2 flex flex-wrap gap-2 min-h-[42px]">
                      {watch("assignees")?.map((assigneeId) => {
                        const member = projectMembers.find((m: any) => (m.userId as any)._id === assigneeId)?.userId as any;
                        if (!member) return null;
                        return (
                          <div key={assigneeId} className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-full text-xs font-medium">
                            <div className="w-5 h-5 rounded-full bg-slate-300 overflow-hidden flex items-center justify-center">
                              {member.avatarUrl ? <img src={member.avatarUrl} alt="avatar" /> : <UserIcon className="w-3 h-3 text-slate-500"/>}
                            </div>
                            <span className="max-w-[100px] truncate">{member.displayName || member.email}</span>
                            <button type="button" onClick={() => setValue("assignees", watch("assignees")?.filter((id) => id !== assigneeId))} className="text-slate-400 hover:text-red-500">
                              <X className="w-3 h-3"/>
                            </button>
                          </div>
                        );
                      })}
                      
                      <div className="relative ml-auto" ref={assigneeRef}>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-7 px-2 text-slate-500 hover:bg-slate-50 text-xs gap-1 border border-dashed border-slate-300 flex items-center justify-center font-bold"
                          onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                        >
                          <Plus className="w-3.5 h-3.5" /> Thêm người
                        </Button>

                        {isAssigneeOpen && (
                          <div className="absolute top-full mt-1.5 right-0 w-[240px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in-0 slide-in-from-top-2">
                            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                               <Input 
                                 placeholder="Tìm kiếm thành viên..." 
                                 value={searchAssignee}
                                 onChange={(e) => setSearchAssignee(e.target.value)}
                                 className="h-8 text-[13px] bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-indigo-400"
                                 autoFocus
                               />
                            </div>
                            <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
                              {(() => {
                                const filtered = projectMembers.filter((m: any) => {
                                  const member = m.userId;
                                  const isSelected = watch("assignees")?.includes(member._id);
                                  if (isSelected) return false;
                                  const term = searchAssignee.toLowerCase();
                                  return (member.displayName || "").toLowerCase().includes(term) || (member.email || "").toLowerCase().includes(term);
                                });

                                if (filtered.length === 0) {
                                  return <div className="p-4 text-[13px] text-slate-500 text-center italic">Không tìm thấy thành viên</div>;
                                }

                                return filtered.map((memberWrap: any) => {
                                  const member = memberWrap.userId;
                                  return (
                                    <div 
                                      key={member._id}
                                      className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                      onClick={() => {
                                        const currentAssignees = watch("assignees") || [];
                                        setValue("assignees", [...currentAssignees, member._id]);
                                        setSearchAssignee("");
                                      }}
                                    >
                                      <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0 border border-slate-300/50">
                                        {member.avatarUrl ? <img src={member.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <UserIcon className="w-3.5 h-3.5 text-slate-400"/>}
                                      </div>
                                      <div className="flex flex-col text-left overflow-hidden">
                                        <span className="text-[13px] font-bold text-slate-700 truncate">{member.displayName || member.email.split('@')[0]}</span>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

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
