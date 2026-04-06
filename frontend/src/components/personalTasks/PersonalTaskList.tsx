import { CheckSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonalTaskCard } from "./PersonalTaskCard";
import type { PersonalTask, PersonalTaskStatus } from "@/types/personalTask";

interface PersonalTaskListProps {
  tasks: PersonalTask[];
  isLoading: boolean;
  activeFilter: PersonalTaskStatus | "all";
  onTaskClick: (task: PersonalTask) => void;
  onToggleStatus: (task: PersonalTask) => void;
}

function filterTasks(tasks: PersonalTask[], filter: PersonalTaskStatus | "all"): PersonalTask[] {
  if (filter === "all") return tasks;
  return tasks.filter((t) => t.status === filter);
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-xl border bg-card p-4">
          <Skeleton className="h-5 w-5 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filter }: { filter: PersonalTaskStatus | "all" }) {
  const messages: Record<string, { title: string; desc: string }> = {
    all: { title: "Chưa có công việc nào", desc: "Bắt đầu bằng cách tạo công việc đầu tiên." },
    todo: { title: "Không có việc cần làm", desc: "Tất cả đã được xử lý!" },
    in_progress: { title: "Không có việc đang làm", desc: "Chọn một công việc để bắt đầu." },
    done: { title: "Chưa hoàn thành việc nào", desc: "Hãy hoàn thành task đầu tiên!" },
  };
  const msg = messages[filter] || messages.all;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
        <CheckSquare className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{msg.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-xs">{msg.desc}</p>
    </div>
  );
}

export function PersonalTaskList({
  tasks,
  isLoading,
  activeFilter,
  onTaskClick,
  onToggleStatus,
}: PersonalTaskListProps) {
  if (isLoading) return <LoadingSkeleton />;

  const filtered = filterTasks(tasks, activeFilter);

  if (filtered.length === 0) return <EmptyState filter={activeFilter} />;

  return (
    <div className="space-y-2">
      {filtered.map((task) => (
        <PersonalTaskCard
          key={task._id}
          task={task}
          onClick={onTaskClick}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
}
