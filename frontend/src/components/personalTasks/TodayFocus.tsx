import { useMemo } from "react";
import { isToday, parseISO, format } from "date-fns";
import { Check, Circle, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PersonalTask } from "@/types/personalTask";

interface TodayFocusProps {
  tasks: PersonalTask[];
  onToggleStatus: (task: PersonalTask) => void;
  onTaskClick: (task: PersonalTask) => void;
}

export function TodayFocus({ tasks, onToggleStatus, onTaskClick }: TodayFocusProps) {
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => {
      const hasEndToday = t.endDate && isToday(parseISO(t.endDate));
      const hasStartToday = t.startDate && isToday(parseISO(t.startDate));
      return hasEndToday || hasStartToday;
    });
  }, [tasks]);

  const doneCount = todayTasks.filter((t) => t.status === "done").length;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sun className="h-4 w-4 text-amber-500" />
          Hôm nay
        </h3>
        <span className="text-xs text-muted-foreground">
          {format(new Date(), "dd/MM")}
        </span>
      </div>

      {todayTasks.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Không có công việc nào cho hôm nay.
        </p>
      ) : (
        <>
          <div className="space-y-1.5">
            {todayTasks.slice(0, 5).map((task) => {
              const isDone = task.status === "done";
              return (
                <div
                  key={task._id}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => onTaskClick(task)}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus(task);
                    }}
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      isDone
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-border group-hover:border-foreground/30"
                    )}
                  >
                    {isDone && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                  </button>
                  <span
                    className={cn(
                      "text-xs truncate flex-1",
                      isDone && "line-through text-muted-foreground"
                    )}
                  >
                    {task.title}
                  </span>
                </div>
              );
            })}
          </div>

          {todayTasks.length > 5 && (
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              +{todayTasks.length - 5} công việc khác
            </p>
          )}

          {/* Mini summary */}
          <div className="mt-3 pt-3 border-t flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Circle className="h-3 w-3 text-emerald-500 fill-emerald-500" />
            <span>
              {doneCount}/{todayTasks.length} hoàn thành
            </span>
          </div>
        </>
      )}
    </div>
  );
}
