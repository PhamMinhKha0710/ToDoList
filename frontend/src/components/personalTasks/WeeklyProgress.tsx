import { useMemo } from "react";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { TrendingUp } from "lucide-react";
import type { PersonalTask } from "@/types/personalTask";

interface WeeklyProgressProps {
  tasks: PersonalTask[];
}

export function WeeklyProgress({ tasks }: WeeklyProgressProps) {
  const { done, total, percent } = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const weekTasks = tasks.filter((t) => {
      if (t.endDate) {
        return isWithinInterval(parseISO(t.endDate), { start: weekStart, end: weekEnd });
      }
      if (t.createdAt) {
        return isWithinInterval(parseISO(t.createdAt), { start: weekStart, end: weekEnd });
      }
      return false;
    });

    const doneCount = weekTasks.filter((t) => t.status === "done").length;
    const totalCount = weekTasks.length;
    const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    return { done: doneCount, total: totalCount, percent: pct };
  }, [tasks]);

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
          <TrendingUp className="h-4 w-4 text-sky-600" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Tiến độ tuần
          </p>
          <p className="text-sm font-semibold">
            {done} / {total} hoàn thành
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 text-right">{percent}%</p>
    </div>
  );
}
