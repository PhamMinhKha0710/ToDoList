import { useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { SubTask } from "@/types/task";

interface TaskSubtasksProps {
  subTasks?: SubTask[];
  onChange?: (subTasks: SubTask[]) => void;
  isEditing?: boolean;
}

export const TaskSubtasks = ({
  subTasks = [],
  onChange,
  isEditing = true,
}: TaskSubtasksProps) => {
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");

  const handleAdd = () => {
    if (!newSubTaskTitle.trim()) return;
    
    const newSubTask: SubTask = {
      title: newSubTaskTitle.trim(),
      status: "todo",
      createdAt: new Date().toISOString(),
      position: subTasks.length,
    };

    onChange?.([...subTasks, newSubTask]);
    setNewSubTaskTitle("");
  };

  const handleToggle = (index: number) => {
    const updated = [...subTasks];
    updated[index] = {
      ...updated[index],
      status: updated[index].status === "done" ? "todo" : "done",
    };
    onChange?.(updated);
  };

  const handleRemove = (index: number) => {
    const updated = subTasks.filter((_, i) => i !== index);
    onChange?.(updated);
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    const updated = [...subTasks];
    updated[index] = { ...updated[index], title: newTitle };
    onChange?.(updated);
  };

  const completedCount = subTasks.filter((s) => s.status === "done").length;
  const progress = subTasks.length > 0 ? (completedCount / subTasks.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <ListTodo className="w-4 h-4" /> Danh sách công việc con ({subTasks.length})
        </h3>
        {subTasks.length > 0 && (
          <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
            {completedCount}/{subTasks.length} Hoàn thành
          </span>
        )}
      </div>

      {subTasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-tighter">
            <span>Tiến độ</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-muted" />
        </div>
      )}

      <div className="space-y-2">
        {subTasks.map((subTask, index) => (
          <div
            key={subTask._id || index}
            className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <button
              type="button"
              onClick={() => handleToggle(index)}
              className={`shrink-0 transition-colors ${
                subTask.status === "done" ? "text-primary" : "text-muted-foreground hover:text-primary"
              }`}
            >
              {subTask.status === "done" ? (
                <CheckCircle2 className="w-5 h-5 fill-primary/10" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>

            {isEditing ? (
              <input
                type="text"
                value={subTask.title}
                onChange={(e) => handleTitleChange(index, e.target.value)}
                className={`flex-1 bg-transparent border-none p-0 text-[14px] font-medium outline-none transition-all ${
                  subTask.status === "done" ? "text-muted-foreground line-through opacity-70" : "text-foreground"
                }`}
              />
            ) : (
                <span className={`flex-1 text-[14px] font-medium ${
                  subTask.status === "done" ? "text-muted-foreground line-through opacity-70" : "text-foreground"
                }`}>
                  {subTask.title}
                </span>
            )}

            {isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                className="w-8 h-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="flex items-center gap-2 pt-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Thêm nhiệm vụ con mới..."
              value={newSubTaskTitle}
              onChange={(e) => setNewSubTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-xl text-sm font-medium focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground"
            />
            <Plus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          <Button
            onClick={handleAdd}
            disabled={!newSubTaskTitle.trim()}
            className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-sm disabled:opacity-50 transition-all"
          >
            Thêm
          </Button>
        </div>
      )}

      {subTasks.length === 0 && !isEditing && (
        <div className="text-center py-8 bg-muted/30 border border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground text-sm italic">Chưa có nhiệm vụ con nào.</p>
        </div>
      )}
    </div>
  );
};
