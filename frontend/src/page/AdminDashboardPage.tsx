import { useMemo, useState } from "react";

type TaskStatus = "todo" | "in_progress" | "done";

interface TaskItem {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
}

const sampleTasks: TaskItem[] = [
  { id: "1", title: "Thiết kế UI", status: "done", createdAt: "2026-03-05T09:12:00.000Z" },
  { id: "2", title: "Hoàn thiện API", status: "in_progress", createdAt: "2026-03-08T07:20:00.000Z" },
  { id: "3", title: "Tạo unit tests", status: "todo", createdAt: "2026-03-10T10:00:00.000Z" },
  { id: "4", title: "Báo cáo kinh doanh", status: "done", createdAt: "2026-03-12T14:30:00.000Z" },
  { id: "5", title: "Tối ưu query", status: "in_progress", createdAt: "2026-03-17T11:45:00.000Z" },
  { id: "6", title: "Kiểm tra bảo mật", status: "todo", createdAt: "2026-03-19T08:00:00.000Z" },
  { id: "7", title: "Tài liệu tính năng", status: "done", createdAt: "2026-03-20T13:25:00.000Z" },
];

const statusLabels: Record<TaskStatus, string> = {
  todo: "Chưa làm",
  in_progress: "Đang làm",
  done: "Hoàn thành",
};

const periodLabels = {
  week: ["4 tuần trước", "3 tuần trước", "2 tuần trước", "Tuần này"],
  month: ["6 tháng trước", "5 tháng trước", "4 tháng trước", "3 tháng trước", "2 tháng trước", "Tháng này"],
};

const AdminDashboardPage = () => {
  const [mode, setMode] = useState<"week" | "month">("week");

  const taskSummary = useMemo(() => {
    const total = sampleTasks.length;
    const statuses = { todo: 0, in_progress: 0, done: 0 } as Record<TaskStatus, number>;

    sampleTasks.forEach((task) => {
      statuses[task.status] += 1;
    });

    return {
      total,
      done: statuses.done,
      inProgress: statuses.in_progress,
      todo: statuses.todo,
      statuses,
    };
  }, []);

  const periodData = useMemo(() => {
    const now = new Date();
    const result: number[] = [];

    if (mode === "week") {
      for (let i = 3; i >= 0; i -= 1) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - i * 7);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const count = sampleTasks.filter((task) => {
          const created = new Date(task.createdAt);
          return created >= weekStart && created < weekEnd;
        }).length;

        result.push(count);
      }
    } else {
      for (let i = 5; i >= 0; i -= 1) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1, 0, 0, 0, 0);

        const count = sampleTasks.filter((task) => {
          const created = new Date(task.createdAt);
          return created >= monthStart && created < monthEnd;
        }).length;

        result.push(count);
      }
    }

    return result;
  }, [mode]);

  const maxPeriod = Math.max(...periodData, 1);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Trực quan hóa dữ liệu dự án và theo dõi tiến độ</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`rounded-md px-4 py-2 text-sm font-medium ${mode === "week" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setMode("week")}
          >
            Theo tuần
          </button>
          <button
            className={`rounded-md px-4 py-2 text-sm font-medium ${mode === "month" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setMode("month")}
          >
            Theo tháng
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Tổng task</p>
          <p className="text-2xl font-bold">{taskSummary.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Hoàn thành</p>
          <p className="text-2xl font-bold">{taskSummary.done}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Đang thực hiện</p>
          <p className="text-2xl font-bold">{taskSummary.inProgress}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Chưa làm</p>
          <p className="text-2xl font-bold">{taskSummary.todo}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Tỉ lệ trạng thái task</h2>
          <div className="grid gap-3">
            {Object.entries(taskSummary.statuses).map(([status, count]) => {
              const percent = Math.round(((count as number) / taskSummary.total) * 100);
              const colors: Record<string, string> = {
                todo: "bg-orange-400",
                in_progress: "bg-blue-400",
                done: "bg-green-400",
              };
              return (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{statusLabels[status as TaskStatus]}</span>
                    <span>{count} ({percent}%)</span>
                  </div>
                  <div className="h-2 rounded bg-slate-200">
                    <div className={`${colors[status] ?? "bg-slate-500"} h-full rounded`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Số lượng task mới ({mode === "week" ? "tuần" : "tháng"})</h2>
          <div className="grid gap-2">
            {(mode === "week" ? periodLabels.week : periodLabels.month).map((label, idx) => {
              const count = periodData[idx] || 0;
              const percent = Math.round((count / maxPeriod) * 100);
              return (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{label}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-3 w-full rounded bg-slate-200">
                    <div className="h-full rounded bg-sky-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Cập nhật</h2>
        <p className="text-sm text-muted-foreground">Đã sửa lỗi build: xóa requires phụ thuộc Chart.js chưa cài. Nếu bạn cài chart.js/react-chartjs-2, tôi sẽ bật lại biểu đồ dạng canvas dễ thương.</p>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
