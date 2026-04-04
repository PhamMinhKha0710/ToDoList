import { useState } from "react";
import { Check, X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubTask } from "@/types/personalTask";

interface SubTaskItemProps {
  subTask: SubTask;
  onToggle: (subTaskId: string) => void;
  onDelete: (subTaskId: string) => void;
  onUpdate: (subTaskId: string, title: string) => void;
}

export function SubTaskItem({ subTask, onToggle, onDelete, onUpdate }: SubTaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subTask.title);
  const isDone = subTask.status === "done";

  const handleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== subTask.title) {
      onUpdate(subTask._id, trimmed);
    } else {
      setEditTitle(subTask.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditTitle(subTask.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-150",
        "hover:bg-muted/50"
      )}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

      <button
        type="button"
        onClick={() => onToggle(subTask._id)}
        className={cn(
          "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200",
          isDone
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-border hover:border-foreground/40"
        )}
        aria-label={isDone ? "Mark as todo" : "Mark as done"}
      >
        {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>

      {isEditing ? (
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-sm outline-none border-b border-border focus:border-foreground/50 py-0.5 transition-colors"
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={cn(
            "flex-1 text-sm cursor-pointer transition-all duration-200",
            isDone && "line-through text-muted-foreground"
          )}
        >
          {subTask.title}
        </span>
      )}

      <button
        type="button"
        onClick={() => onDelete(subTask._id)}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
        aria-label="Delete subtask"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
