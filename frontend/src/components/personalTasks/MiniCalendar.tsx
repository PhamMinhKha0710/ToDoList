import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WeekView } from "./WeekView";
import type { PersonalTask } from "@/types/personalTask";

interface MiniCalendarProps {
  tasks: PersonalTask[];
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  variant?: "default" | "large";
  viewMode?: "month" | "week";
  onViewModeChange?: (mode: "month" | "week") => void;
  onTaskClick?: (task: PersonalTask) => void;
  onDayClick?: (date: Date) => void;
}

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function MiniCalendar({
  tasks,
  selectedDate,
  onSelectDate,
  variant = "default",
  viewMode: externalViewMode,
  onViewModeChange,
  onTaskClick,
  onDayClick,
}: MiniCalendarProps) {
  const isLarge = variant === "large";
  const [internalViewMode, setInternalViewMode] = useState<"month" | "week">("month");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const viewMode = externalViewMode ?? internalViewMode;

  const handleViewModeChange = (mode: "month" | "week") => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const taskDatesSet = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.endDate) set.add(format(new Date(t.endDate), "yyyy-MM-dd"));
      if (t.startDate) set.add(format(new Date(t.startDate), "yyyy-MM-dd"));
    });
    return set;
  }, [tasks]);

  const handlePrev = () => setCurrentMonth((m) => subMonths(m, 1));
  const handleNext = () => setCurrentMonth((m) => addMonths(m, 1));

  const handleDayClick = (day: Date) => {
    if (selectedDate && isSameDay(selectedDate, day)) {
      onSelectDate(null);
    } else {
      onSelectDate(day);
    }
  };

  return (
    <div className={isLarge ? "rounded-xl border bg-card p-5" : "rounded-xl border bg-card p-4"}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={isLarge ? "text-base font-semibold capitalize" : "text-sm font-semibold capitalize"}>
          {format(currentMonth, "MMMM yyyy", { locale: vi })}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handlePrev}
            aria-label="Tháng trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleNext}
            aria-label="Tháng sau"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Month / Week toggle */}
      <div className="flex items-center gap-1 mb-3 p-1 bg-muted/60 rounded-lg border w-fit">
        <Button
          variant={viewMode === "month" ? "secondary" : "ghost"}
          size="sm"
          className="h-6 px-2.5 text-xs font-medium"
          onClick={() => handleViewModeChange("month")}
        >
          Tháng
        </Button>
        <Button
          variant={viewMode === "week" ? "secondary" : "ghost"}
          size="sm"
          className="h-6 px-2.5 text-xs font-medium"
          onClick={() => handleViewModeChange("week")}
        >
          Tuần
        </Button>
      </div>

      {/* Month view */}
      {viewMode === "month" && (
        <>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0 mb-1">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className={
                  isLarge
                    ? "text-center text-xs font-medium text-muted-foreground py-1"
                    : "text-center text-[10px] font-medium text-muted-foreground py-1"
                }
              >
                {label}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const selected = selectedDate ? isSameDay(day, selectedDate) : false;
              const hasTask = taskDatesSet.has(dateKey);

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg text-xs transition-all duration-150 hover:bg-muted cursor-pointer",
                    isLarge ? "h-11 text-sm" : "h-9",
                    !inMonth && "text-muted-foreground/30",
                    today && !selected && "bg-primary/10 text-primary font-semibold",
                    selected && "bg-primary text-primary-foreground font-semibold"
                  )}
                >
                  {format(day, "d")}
                  {hasTask && inMonth && (
                    <span
                      className={cn(
                        "absolute rounded-full",
                        isLarge ? "bottom-1.5 h-1.5 w-1.5" : "bottom-1 h-1 w-1",
                        selected ? "bg-primary-foreground" : "bg-primary"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Week view */}
      {viewMode === "week" && onTaskClick && onDayClick && (
        <WeekView
          tasks={tasks}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          onTaskClick={onTaskClick}
          onDayClick={onDayClick}
        />
      )}
    </div>
  );
}
