import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SubTaskItem } from "./SubTaskItem";
import type { PersonalTask, SubTask } from "@/types/personalTask";
import {
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Plus,
  ListTodo,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

interface PersonalTaskDetailProps {
  task: PersonalTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: PersonalTask) => void;
  onDelete: (taskId: string) => void;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
  onAddSubTask: (taskId: string, title: string) => void;
  onDeleteSubTask: (taskId: string, subTaskId: string) => void;
  onUpdateSubTask: (taskId: string, subTaskId: string, title: string) => void;
}

const PRIORITY_CONFIG = {
  urgent: { label: "Khẩn cấp", className: "bg-red-500/15 text-red-600 border-red-500/20" },
  high: { label: "Cao", className: "bg-amber-500/15 text-amber-600 border-amber-500/20" },
  normal: { label: "Bình thường", className: "bg-sky-500/15 text-sky-600 border-sky-500/20" },
  low: { label: "Thấp", className: "bg-slate-500/15 text-slate-500 border-slate-500/20" },
} as const;

const STATUS_CONFIG = {
  todo: { label: "Cần làm", className: "bg-slate-500/15 text-slate-600" },
  in_progress: { label: "Đang làm", className: "bg-sky-500/15 text-sky-600" },
  done: { label: "Hoàn thành", className: "bg-emerald-500/15 text-emerald-600" },
} as const;

export function PersonalTaskDetail({
  task,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onToggleSubTask,
  onAddSubTask,
  onDeleteSubTask,
  onUpdateSubTask,
}: PersonalTaskDetailProps) {
  const [newSubTask, setNewSubTask] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!task) return null;

  const priority = PRIORITY_CONFIG[task.priority];
  const status = STATUS_CONFIG[task.status];
  const subTasksDone = task.subTasks?.filter((s) => s.status === "done").length || 0;
  const subTasksTotal = task.subTasks?.length || 0;

  const handleAddSubTask = () => {
    const trimmed = newSubTask.trim();
    if (!trimmed) return;
    onAddSubTask(task._id, trimmed);
    setNewSubTask("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubTask();
    }
  };

  const handleDelete = () => {
    onDelete(task._id);
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold leading-snug pr-8">
                {task.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Chi tiết công việc cá nhân
              </DialogDescription>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <Badge variant="outline" className={cn("text-xs", priority.className)}>
              {priority.label}
            </Badge>
            <Badge variant="outline" className={cn("text-xs", status.className)}>
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        {/* Description */}
        {task.description && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {/* Date info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
          {task.startDate && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Bắt đầu: {format(parseISO(task.startDate), "dd/MM/yyyy", { locale: vi })}
            </span>
          )}
          {task.endDate && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Kết thúc: {format(parseISO(task.endDate), "dd/MM/yyyy", { locale: vi })}
            </span>
          )}
        </div>

        {/* Subtasks */}
        <div className="mt-5 border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Công việc con
              {subTasksTotal > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({subTasksDone}/{subTasksTotal})
                </span>
              )}
            </h4>
          </div>

          {/* Subtask progress */}
          {subTasksTotal > 0 && (
            <div className="mb-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${subTasksTotal > 0 ? (subTasksDone / subTasksTotal) * 100 : 0}%` }}
              />
            </div>
          )}

          {/* Subtask list */}
          <div className="space-y-0.5">
            {task.subTasks?.map((sub) => (
              <SubTaskItem
                key={sub._id}
                subTask={sub}
                onToggle={(subId) => onToggleSubTask(task._id, subId)}
                onDelete={(subId) => onDeleteSubTask(task._id, subId)}
                onUpdate={(subId, title) => onUpdateSubTask(task._id, subId, title)}
              />
            ))}
          </div>

          {/* Add subtask */}
          <div className="flex items-center gap-2 mt-3">
            <Input
              placeholder="Thêm công việc con..."
              value={newSubTask}
              onChange={(e) => setNewSubTask(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-sm"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddSubTask}
              disabled={!newSubTask.trim()}
              className="h-8 px-3 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-destructive font-medium">Xác nhận xóa?</span>
              <Button size="sm" variant="destructive" onClick={handleDelete} className="h-7 px-2 text-xs">
                Xóa
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="h-7 px-2 text-xs">
                Hủy
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Xóa
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onEdit(task);
            }}
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Chỉnh sửa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
