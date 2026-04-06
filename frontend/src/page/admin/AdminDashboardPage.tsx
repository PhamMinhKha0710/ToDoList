import { useEffect, useMemo, useState } from "react";
import { adminService } from "@/services/admin/admin.service";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

type TaskStatus = "todo" | "in_progress" | "done";

interface TaskItem {
  _id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
}

const statusLabels: Record<TaskStatus, string> = {
  todo: "Chưa làm",
  in_progress: "Đang làm",
  done: "Hoàn thành",
};

const periodLabels = {
  week: ["4 tuần trước", "3 tuần trước", "2 tuần trước", "Tuần này"],
  month: ["6 tháng trước", "5 tháng trước", "4 tháng trước", "3 tháng trước", "2 tháng trước", "Tháng này"],
};

const STATUS_COLORS: Record<string, string> = {
  todo: "#fb923c", // orange-400
  in_progress: "#60a5fa", // blue-400
  done: "#4ade80", // green-400
};

interface UserItem {
  _id: string;
  createdAt: string;
}

const AdminDashboardPage = () => {
  const [mode, setMode] = useState<"week" | "month">("week");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getDashboardTasks();
        setTasks(res.data.tasks);
        setUsers(res.data.users);
      } catch (error) {
        toast.error("Không thể lấy dữ liệu thống kê");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const taskSummary = useMemo(() => {
    const total = tasks.length;
    const statuses = { todo: 0, in_progress: 0, done: 0 } as Record<TaskStatus, number>;

    tasks.forEach((task) => {
      if (statuses[task.status] !== undefined) {
        statuses[task.status] += 1;
      }
    });

    return {
      total,
      done: statuses.done,
      inProgress: statuses.in_progress,
      todo: statuses.todo,
      statuses,
    };
  }, [tasks]);

  const pieData = useMemo(() => {
    return Object.entries(taskSummary.statuses).map(([status, count]) => ({
      name: statusLabels[status as TaskStatus],
      value: count,
      color: STATUS_COLORS[status] || "#8884d8",
    })).filter(item => item.value > 0);
  }, [taskSummary]);

  const statsData = useMemo(() => {
    const now = new Date();
    const taskResult: { label: string; count: number }[] = [];
    const userResult: { label: string; count: number }[] = [];
    const labels = mode === "week" ? periodLabels.week : periodLabels.month;

    if (mode === "week") {
      for (let i = 3; i >= 0; i -= 1) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - i * 7);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const taskCount = tasks.filter((task) => {
          const created = new Date(task.createdAt);
          return created >= weekStart && created < weekEnd;
        }).length;

        const userCount = users.filter((user) => {
          const created = new Date(user.createdAt);
          return created >= weekStart && created < weekEnd;
        }).length;

        taskResult.push({ label: labels[3 - i], count: taskCount });
        userResult.push({ label: labels[3 - i], count: userCount });
      }
    } else {
      for (let i = 5; i >= 0; i -= 1) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1, 0, 0, 0, 0);

        const taskCount = tasks.filter((task) => {
          const created = new Date(task.createdAt);
          return created >= monthStart && created < monthEnd;
        }).length;

        const userCount = users.filter((user) => {
          const created = new Date(user.createdAt);
          return created >= monthStart && created < monthEnd;
        }).length;

        taskResult.push({ label: labels[5 - i], count: taskCount });
        userResult.push({ label: labels[5 - i], count: userCount });
      }
    }

    return { tasks: taskResult, users: userResult };
  }, [mode, tasks, users]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-background">
        <p className="text-muted-foreground">Đang tải biểu đồ dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Trực quan hóa dữ liệu dự án và theo dõi tiến độ</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${mode === "week" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            onClick={() => setMode("week")}
          >
            Theo tuần
          </button>
          <button
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${mode === "month" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            onClick={() => setMode("month")}
          >
            Theo tháng
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Tổng task</p>
          <p className="text-2xl font-bold text-foreground">{taskSummary.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Hoàn thành</p>
          <p className="text-2xl font-bold text-foreground">{taskSummary.done}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Đang thực hiện</p>
          <p className="text-2xl font-bold text-foreground">{taskSummary.inProgress}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Tổng User</p>
          <p className="text-2xl font-bold text-foreground">{users.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm min-h-[400px] flex flex-col">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Tỉ lệ trạng thái task</h2>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-sm min-h-[400px] flex flex-col">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Số lượng task mới ({mode === "week" ? "tuần" : "tháng"})</h2>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData.tasks}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.2)" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar
                  dataKey="count"
                  name="Số lượng task"
                  fill="#0ea5e9" // sky-500
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-sm min-h-[400px] flex flex-col lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Người dùng đăng ký mới ({mode === "week" ? "tuần" : "tháng"})</h2>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData.users}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.2)" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar
                  dataKey="count"
                  name="Người dùng mới"
                  fill="#8b5cf6" // violet-500
                  radius={[4, 4, 0, 0]}
                  barSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
