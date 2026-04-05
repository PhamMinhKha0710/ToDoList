import { useMemo } from "react";
import { Check, Calendar, ChevronRight, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { PersonalTask } from "@/types/personalTask";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

interface PersonalTaskCardProps {
  task: PersonalTask;
  onClick: (task: PersonalTask) => void;
  onToggleStatus: (task: PersonalTask) => void;
}

const PRIORITY_CONFIG = {
  urgent: { label: "Khẩn cấp", className: "bg-red-500/15 text-red-600 border-red-500/20" },
  high: { label: "Cao", className: "bg-amber-500/15 text-amber-600 border-amber-500/20" },
  normal: { label: "Bình thường", className: "bg-sky-500/15 text-sky-600 border-sky-500/20" },
  low: { label: "Thấp", className: "bg-slate-500/15 text-slate-500 border-slate-500/20" },
} as const;

const COLOR_STRIPE: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  cyan: "bg-cyan-500",
};

function formatDueDate(dateStr?: string) {
  if (!dateStr) return null;
  const date = parseISO(dateStr);
  if (isToday(date)) return "Hôm nay";
  if (isTomorrow(date)) return "Ngày mai";
  return format(date, "dd MMM", { locale: vi });
}

export function PersonalTaskCard({ task, onClick, onToggleStatus }: PersonalTaskCardProps) {
  const isDone = task.status === "done";
  const priority = PRIORITY_CONFIG[task.priority];
  const stripeColor = task.color ? COLOR_STRIPE[task.color] || "bg-sky-500" : null;

  const subTaskProgress = useMemo(() => {
    if (!task.subTasks?.length) return null;
    const done = task.subTasks.filter((s) => s.status === "done").length;
    return { done, total: task.subTasks.length, percent: Math.round((done / task.subTasks.length) * 100) };
  }, [task.subTasks]);

  const dueDateStr = formatDueDate(task.endDate);
  const isOverdue = task.endDate && isPast(parseISO(task.endDate)) && !isDone;

  return (
    <div
      onClick={() => onClick(task)}
      className={cn(
        "group relative flex gap-3 rounded-xl border bg-card p-4 cursor-pointer",
        "transition-all duration-200 ease-out",
        "hover:shadow-md hover:border-foreground/15 hover:-translate-y-0.5",
        isDone && "opacity-60"
      )}
    >
      {/* Color stripe */}
      {stripeColor && (
        <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-full", stripeColor)} />
      )}

      {/* Checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleStatus(task);
        }}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
          isDone
            ? "border-emerald-500 bg-emerald-500 text-white scale-100"
            : "border-border hover:border-foreground/40 hover:scale-110"
        )}
        aria-label={isDone ? "Mark as todo" : "Mark as done"}
      >
        {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "text-sm font-medium leading-snug transition-all duration-200",
              isDone && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </h3>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
        </div>

        {task.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        {/* Meta row */}
        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 font-medium", priority.className)}>
            {priority.label}
          </Badge>

          {dueDateStr && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] text-muted-foreground",
                isOverdue && "text-red-500 font-medium"
              )}
            >
              <Calendar className="h-3 w-3" />
              {dueDateStr}
            </span>
          )}

          {subTaskProgress && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <ListTodo className="h-3 w-3" />
              {subTaskProgress.done}/{subTaskProgress.total}
            </span>
          )}
        </div>

        {/* Subtask progress bar */}
        {subTaskProgress && (
          <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${subTaskProgress.percent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
