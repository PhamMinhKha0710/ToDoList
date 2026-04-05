import { useMemo, useState } from "react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  parseISO,
  addWeeks,
  subWeeks,
} from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PersonalTask } from "@/types/personalTask";

interface WeekViewProps {
  tasks: PersonalTask[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onTaskClick: (task: PersonalTask) => void;
  onDayClick: (date: Date) => void;
}

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const COLOR_MAP: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  cyan: "bg-cyan-500",
};

const STATUS_LABEL: Record<string, string> = {
  todo: "bg-slate-200 dark:bg-slate-700",
  in_progress: "bg-sky-100 dark:bg-sky-900",
  done: "bg-emerald-100 dark:bg-emerald-900 opacity-60",
};

export function WeekView({
  tasks,
  selectedDate,
  onSelectDate,
  onTaskClick,
  onDayClick,
}: WeekViewProps) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) }),
    [weekStart]
  );

  const tasksByDay = useMemo(() => {
    const map = new Map<string, PersonalTask[]>();
    weekDays.forEach((day) => {
      map.set(format(day, "yyyy-MM-dd"), []);
    });
    tasks.forEach((task) => {
      const dayKey =
        (task.endDate && format(parseISO(task.endDate), "yyyy-MM-dd")) ||
        (task.startDate && format(parseISO(task.startDate), "yyyy-MM-dd"));
      if (dayKey && map.has(dayKey)) {
        map.get(dayKey)!.push(task);
      }
    });
    return map;
  }, [tasks, weekDays]);

  const handlePrevWeek = () => setWeekStart((w) => subWeeks(w, 1));
  const handleNextWeek = () => setWeekStart((w) => addWeeks(w, 1));
  const handleToday = () =>
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handlePrevWeek}
            aria-label="Tuần trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[160px] text-center">
            {format(weekStart, "dd MMM", { locale: vi })}
            {" – "}
            {format(endOfWeek(weekStart, { weekStartsOn: 1 }), "dd MMM yyyy", { locale: vi })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleNextWeek}
            aria-label="Tuần sau"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={handleToday}>
          Hôm nay
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {weekDays.map((day) => {
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex flex-col items-center py-1.5 rounded-lg cursor-pointer select-none transition-colors duration-150",
                isSelected && "bg-primary/10",
                !isSelected && today && "bg-amber-50 dark:bg-amber-950/30",
                !isSelected && !today && "hover:bg-muted/50"
              )}
              onClick={() => onSelectDate(day)}
            >
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {WEEKDAY_LABELS[day.getDay()]}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold leading-none mt-0.5",
                  today && !isSelected && "text-amber-600 dark:text-amber-400"
                )}
              >
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tasks per day */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 gap-px min-h-[200px]">
          {weekDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDay.get(dayKey) || [];
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const today = isToday(day);

            return (
              <div
                key={dayKey}
                className={cn(
                  "flex flex-col rounded-lg border transition-colors duration-150",
                  isSelected && "border-primary/30 bg-primary/5",
                  !isSelected && today && "border-amber-200 dark:border-amber-800",
                  !isSelected && !today && "border-border hover:border-foreground/10"
                )}
              >
                {/* Tasks */}
                <div className="flex-1 p-1 space-y-1 overflow-hidden">
                  {dayTasks.length === 0 ? (
                    <button
                      type="button"
                      className="w-full h-full min-h-[40px] flex items-center justify-center rounded-md hover:bg-muted/60 transition-colors cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDayClick(day);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                    </button>
                  ) : (
                    <div className="space-y-1">
                      {dayTasks.slice(0, 5).map((task) => {
                        const isDone = task.status === "done";
                        const colorClass = task.color ? COLOR_MAP[task.color] : "bg-sky-500";
                        return (
                          <button
                            key={task._id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskClick(task);
                            }}
                            className={cn(
                              "w-full text-left rounded-md px-1.5 py-1 text-[11px] leading-tight cursor-pointer transition-all duration-150 truncate border-l-2",
                              STATUS_LABEL[task.status] || "",
                              isDone
                                ? "line-through text-muted-foreground border-muted-foreground/30"
                                : "text-foreground hover:brightness-95",
                              !isDone && `border-l-2 ${colorClass}`
                            )}
                            title={task.title}
                          >
                            {task.title}
                          </button>
                        );
                      })}
                      {dayTasks.length > 5 && (
                        <p className="text-[10px] text-muted-foreground text-center py-0.5">
                          +{dayTasks.length - 5} nữa
                        </p>
                      )}
                      {/* Add task button */}
                      <button
                        type="button"
                        className="w-full flex items-center justify-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground py-0.5 rounded transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDayClick(day);
                        }}
                      >
                        <Plus className="h-2.5 w-2.5" />
                        Thêm
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
