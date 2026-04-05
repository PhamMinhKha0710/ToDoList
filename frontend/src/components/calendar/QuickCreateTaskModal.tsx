import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import { columnService } from "@/services/column.service";
import { taskService } from "@/services/task.service";
import { personalTaskService } from "@/services/personalTask.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, User, Briefcase } from "lucide-react";
import { queryKeys } from "@/constants/queryKeys";

interface QuickCreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: string;
}

const COLOR_PRESETS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#ef4444", // red
  "#f59e0b", // orange
  "#10b981", // green
  "#64748b", // slate
];

export const QuickCreateTaskModal = ({
  open,
  onOpenChange,
  initialDate,
}: QuickCreateTaskModalProps) => {
  const queryClient = useQueryClient();
  const [taskType, setTaskType] = useState<"project" | "personal">("project");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedColumnId, setSelectedColumnId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [color, setColor] = useState("#3b82f6");

  useEffect(() => {
    if (initialDate && open) {
      const dateTime = `${initialDate}T09:00`;
      setDueDate(dateTime);
      setStartDate(dateTime);
      setEndDate(dateTime);
    }
  }, [initialDate, open]);

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.getProjects(),
    enabled: open,
  });

  const { data: columnsData, isLoading: isLoadingColumns } = useQuery({
    queryKey: ["project-columns", selectedProjectId],
    queryFn: () => columnService.getProjectColumns(selectedProjectId),
    enabled: !!selectedProjectId && selectedProjectId !== "none",
  });

  useEffect(() => {
    console.log("QuickCreateTaskModal debug:", {
      taskType,
      projectsData,
      selectedProjectId,
      columnsData,
      isLoadingProjects,
      isLoadingColumns
    });
  }, [taskType, projectsData, selectedProjectId, columnsData, isLoadingProjects, isLoadingColumns]);

  const createProjectTaskMutation = useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => {
      toast.success("Đã thêm công việc dự án mới!");
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("Có lỗi xảy ra khi tạo công việc");
    },
  });

  const createPersonalTaskMutation = useMutation({
    mutationFn: personalTaskService.createPersonalTask,
    onSuccess: () => {
      toast.success("Đã thêm công việc cá nhân mới!");
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalTasks.all() });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("Có lỗi xảy ra khi tạo công việc");
    },
  });

  const resetForm = () => {
    setSelectedProjectId("");
    setSelectedColumnId("");
    setTitle("");
    setColor("#3b82f6");
  };

  const handleCreate = async () => {
    if (!title) {
      toast.error("Vui lòng nhập tiêu đề công việc");
      return;
    }

    if (taskType === "project") {
      const columnIdToUse = selectedColumnId;
      if (!selectedProjectId || selectedProjectId === "none" || !columnIdToUse) {
        toast.error("Vui lòng chọn dự án và cột");
        return;
      }

      const formData = new FormData();
      formData.append("columnId", columnIdToUse);
      formData.append("title", title);
      if (dueDate) {
        formData.append("dueDate", new Date(dueDate).toISOString());
      }
      if (startDate) {
        formData.append("startDate", new Date(startDate).toISOString());
      }
      if (endDate) {
        formData.append("endDate", new Date(endDate).toISOString());
      }
      formData.append("color", color);
      createProjectTaskMutation.mutate(formData);
    } else {
      const payload = {
        title,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        color: color,
      };
      createPersonalTaskMutation.mutate(payload);
    }
  };

  const projects = projectsData?.data?.projects || [];
  const columns = columnsData || [];

  const isPending = createProjectTaskMutation.isPending || createPersonalTaskMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center pr-8">
            <span>Thêm công việc nhanh</span>
            <div className="flex bg-slate-100 p-1 rounded-lg text-[13px]">
              <button
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  taskType === "project" ? "bg-white shadow-sm text-primary font-bold" : "text-slate-500"
                }`}
                onClick={() => setTaskType("project")}
              >
                <Briefcase className="w-3.5 h-3.5" /> Dự án
              </button>
              <button
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  taskType === "personal" ? "bg-white shadow-sm text-primary font-bold" : "text-slate-500"
                }`}
                onClick={() => setTaskType("personal")}
              >
                <User className="w-3.5 h-3.5" /> Cá nhân
              </button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {taskType === "project" ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="project">Dự án <span className="text-destructive">*</span></Label>
                <Select
                  value={selectedProjectId}
                  onValueChange={(val) => {
                    setSelectedProjectId(val);
                    setSelectedColumnId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingProjects ? "Đang tải dự án..." : "Chọn dự án"} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="column">Cột <span className="text-destructive">*</span></Label>
                <Select
                  value={selectedColumnId}
                  onValueChange={setSelectedColumnId}
                  disabled={!selectedProjectId || isLoadingColumns}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingColumns ? "Đang tải cột..." : "Chọn cột"} />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column) => (
                      <SelectItem key={column._id} value={column._id}>
                        {column.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Tiêu đề <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề công việc..."
                />
              </div>

              <div className="grid gap-2">
                <Label>Màu sắc</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
                        color === c ? "border-slate-900 ring-2 ring-slate-100 scale-110" : "border-slate-100 hover:border-slate-300"
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Setting color to:", c);
                        setColor(c);
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Ngày bắt đầu</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">Ngày kết thúc</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dueDate">Hạn chót</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="title-p">Tiêu đề <span className="text-destructive">*</span></Label>
                <Input
                  id="title-p"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề công việc..."
                />
              </div>

              <div className="grid gap-2">
                <Label>Màu sắc</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
                        color === c ? "border-slate-900 ring-2 ring-slate-100 scale-110" : "border-slate-100 hover:border-slate-300"
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Setting personal color to:", c);
                        setColor(c);
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate-p">Ngày bắt đầu</Label>
                  <Input
                    id="startDate-p"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate-p">Ngày kết thúc</Label>
                  <Input
                    id="endDate-p"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleCreate} disabled={isPending}>
            {isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Tạo công việc
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
