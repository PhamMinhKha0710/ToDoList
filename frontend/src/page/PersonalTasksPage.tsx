import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isSameDay, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

import { personalTaskService } from "@/services/personalTask.service";
import { queryKeys } from "@/constants/queryKeys";
import type { PersonalTask, PersonalTaskStatus, SubTask } from "@/types/personalTask";
import type { CreatePersonalTaskFormValues } from "@/schemas/personalTask.schema";
import { getErrorMessage } from "@/types/error";

import { Button } from "@/components/ui/button";
import { PersonalTaskList } from "@/components/personalTasks/PersonalTaskList";
import { PersonalTaskForm } from "@/components/personalTasks/PersonalTaskForm";
import { PersonalTaskDetail } from "@/components/personalTasks/PersonalTaskDetail";
import { MiniCalendar } from "@/components/personalTasks/MiniCalendar";
import { TodayFocus } from "@/components/personalTasks/TodayFocus";
import { WeeklyProgress } from "@/components/personalTasks/WeeklyProgress";
import { cn } from "@/lib/utils";

type FilterTab = PersonalTaskStatus | "all";

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "todo", label: "Cần làm" },
  { value: "in_progress", label: "Đang làm" },
  { value: "done", label: "Hoàn thành" },
];

const PersonalTasksPage = () => {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | undefined>(undefined);

  // Detail dialog state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<PersonalTask | null>(null);

  // ── Queries ──────────────────────────────────────────────
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: queryKeys.personalTasks.all(),
    queryFn: personalTaskService.getPersonalTasks,
  });

  // Filter by selected date from calendar
  const filteredTasks = useMemo(() => {
    if (!selectedDate) return tasks;

    if (viewMode === "week") {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return tasks.filter((t) => {
        if (t.endDate) {
          const d = parseISO(t.endDate);
          if (isWithinInterval(d, { start: weekStart, end: weekEnd })) return true;
        }
        if (t.startDate) {
          const d = parseISO(t.startDate);
          if (isWithinInterval(d, { start: weekStart, end: weekEnd })) return true;
        }
        return false;
      });
    }

    return tasks.filter((t) => {
      const matchEnd = t.endDate && isSameDay(parseISO(t.endDate), selectedDate);
      const matchStart = t.startDate && isSameDay(parseISO(t.startDate), selectedDate);
      return matchEnd || matchStart;
    });
  }, [tasks, selectedDate, viewMode]);

  // ── Mutations ────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.personalTasks.all() });

  const createMutation = useMutation({
    mutationFn: personalTaskService.createPersonalTask,
    onSuccess: (newTask) => {
      queryClient.setQueryData<PersonalTask[]>(
        queryKeys.personalTasks.all(),
        (old) => {
          if (!old) return [newTask];
          if (old.some((t) => t._id === newTask._id)) return old;
          return [newTask, ...old];
        }
      );
      invalidate();
      setFormOpen(false);
      toast.success("Đã tạo công việc mới");
    },
    onError: () => toast.error("Không thể tạo công việc"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PersonalTask> }) =>
      personalTaskService.updatePersonalTask(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<PersonalTask[]>(
        queryKeys.personalTasks.all(),
        (old) => old?.map((t) => (t._id === updated._id ? updated : t))
      );
      invalidate();
      setFormOpen(false);
      if (selectedTask?._id === updated._id) setSelectedTask(updated);
      toast.success("Đã cập nhật công việc");
    },
    onError: (err: unknown) =>
      toast.error(getErrorMessage(err) || "Không thể cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: personalTaskService.deletePersonalTask,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<PersonalTask[]>(
        queryKeys.personalTasks.all(),
        (old) => old?.filter((t) => t._id !== deletedId)
      );
      invalidate();
      toast.success("Đã xóa công việc");
    },
    onError: () => toast.error("Không thể xóa công việc"),
  });

  // Normalise empty date strings so they reach the API as undefined (Mongoose Date field)
  const normaliseDates = (data: CreatePersonalTaskFormValues): CreatePersonalTaskFormValues => ({
    ...data,
    startDate: data.startDate || undefined,
    endDate: data.endDate || undefined,
  });

  // ── Handlers ─────────────────────────────────────────────
  const handleCreateOrUpdate = useCallback(
    (values: CreatePersonalTaskFormValues) => {
      const payload = normaliseDates(values);
      if (editingTask?._id) {
        updateMutation.mutate({ id: editingTask._id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    },
    [editingTask, createMutation, updateMutation]
  );

  const handleToggleStatus = useCallback(
    (task: PersonalTask) => {
      const newStatus: PersonalTaskStatus = task.status === "done" ? "todo" : "done";
      updateMutation.mutate({ id: task._id, data: { status: newStatus } });
    },
    [updateMutation]
  );

  const handleTaskClick = useCallback((task: PersonalTask) => {
    setSelectedTask(task);
    setDetailOpen(true);
  }, []);

  const handleEdit = useCallback((task: PersonalTask) => {
    setEditingTask(task);
    setFormOpen(true);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingTask(undefined);
    setFormOpen(true);
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setFormOpen(true);
  }, []);

  // ── Subtask Handlers ──────────────────────────────────────
  const handleToggleSubTask = useCallback(
    (taskId: string, subTaskId: string) => {
      const task = tasks.find((t) => t._id === taskId);
      if (!task) return;
      const updated = task.subTasks.map((s) =>
        s._id === subTaskId ? { ...s, status: s.status === "done" ? "todo" as const : "done" as const } : s
      );
      updateMutation.mutate({ id: taskId, data: { subTasks: updated } });
    },
    [tasks, updateMutation]
  );

  const handleAddSubTask = useCallback(
    (taskId: string, title: string) => {
      const task = tasks.find((t) => t._id === taskId);
      if (!task) return;
      const newSub: SubTask = {
        _id: `temp-${Date.now()}`,
        title,
        status: "todo",
        position: task.subTasks.length,
        createdAt: new Date().toISOString(),
      };
      updateMutation.mutate({ id: taskId, data: { subTasks: [...task.subTasks, newSub] } });
    },
    [tasks, updateMutation]
  );

  const handleDeleteSubTask = useCallback(
    (taskId: string, subTaskId: string) => {
      const task = tasks.find((t) => t._id === taskId);
      if (!task) return;
      const updated = task.subTasks.filter((s) => s._id !== subTaskId);
      updateMutation.mutate({ id: taskId, data: { subTasks: updated } });
    },
    [tasks, updateMutation]
  );

  const handleUpdateSubTask = useCallback(
    (taskId: string, subTaskId: string, title: string) => {
      const task = tasks.find((t) => t._id === taskId);
      if (!task) return;
      const updated = task.subTasks.map((s) =>
        s._id === subTaskId ? { ...s, title } : s
      );
      updateMutation.mutate({ id: taskId, data: { subTasks: updated } });
    },
    [tasks, updateMutation]
  );

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    return { total, done, inProgress, todo };
  }, [tasks]);

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b bg-background">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Công việc cá nhân
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và theo dõi công việc hàng ngày của bạn.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick stats */}
          <div className="hidden md:flex items-center gap-4 mr-4 text-sm">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.total}</span> tổng
            </span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-emerald-600">{stats.done}</span> xong
            </span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-sky-600">{stats.inProgress}</span> đang làm
            </span>
          </div>
          <Button onClick={handleOpenCreate} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Thêm công việc
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[7fr_3fr] p-8 max-w-[1600px] mx-auto">
          {/* Calendar column — wider, on the left */}
          <aside className="flex flex-col gap-4 min-w-0">
            <MiniCalendar
              tasks={tasks}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              variant="large"
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onTaskClick={handleTaskClick}
              onDayClick={handleDayClick}
            />
            <TodayFocus
              tasks={tasks}
              onToggleStatus={handleToggleStatus}
              onTaskClick={handleTaskClick}
            />
            <WeeklyProgress tasks={tasks} />
          </aside>

          {/* Task list column */}
          <div className="min-w-0">
            {/* Filter tabs */}
            <div className="flex flex-wrap max-w-full items-center bg-muted/50 rounded-lg p-1 border mb-6 w-fit">
              {FILTER_TABS.map((tab) => (
                <Button
                  key={tab.value}
                  variant={activeFilter === tab.value ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveFilter(tab.value)}
                  className="px-3"
                >
                  {tab.label}
                  {tab.value !== "all" && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {tab.value === "todo"
                        ? stats.todo
                        : tab.value === "in_progress"
                        ? stats.inProgress
                        : stats.done}
                    </span>
                  )}
                </Button>
              ))}
            </div>

            {/* Selected date indicator */}
            {selectedDate && (
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <span>
                  Lọc theo ngày:{" "}
                  <span className="font-medium text-foreground">
                    {selectedDate.toLocaleDateString("vi-VN")}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setSelectedDate(null)}
                >
                  Bỏ lọc
                </Button>
              </div>
            )}

            {/* Task list */}
            <PersonalTaskList
              tasks={filteredTasks}
              isLoading={isLoading}
              activeFilter={activeFilter}
              onTaskClick={handleTaskClick}
              onToggleStatus={handleToggleStatus}
            />
          </div>
        </div>
      </div>

      {/* Form Dialog */}
      <PersonalTaskForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTask(undefined);
        }}
        onSubmit={handleCreateOrUpdate}
        defaultValues={editingTask}
        prefillDateForCreate={!editingTask ? (selectedDate ?? new Date()) : undefined}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Detail Dialog */}
      <PersonalTaskDetail
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        onToggleSubTask={handleToggleSubTask}
        onAddSubTask={handleAddSubTask}
        onDeleteSubTask={handleDeleteSubTask}
        onUpdateSubTask={handleUpdateSubTask}
      />
    </div>
  );
};

export default PersonalTasksPage;
