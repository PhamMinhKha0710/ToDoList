import axiosInstance from "@/lib/axios";

export interface DashboardSummary {
  activeTasks: number;
  dueToday: number;
  completedThisWeek: number;
  overdue: number;
  totalProjects: number;
}

export interface ChartDataItem {
  date: string;
  fullDate: string;
  count: number;
}

export interface RecentActivity {
  _id: string;
  projectId?: { _id: string; name: string };
  userId: { _id: string; displayName: string; email: string; avatarUrl?: string };
  action: string;
  entityType?: string;
  detail?: string;
  createdAt: string;
}

export interface UpcomingDeadline {
  _id: string;
  title: string;
  type: 'personal' | 'project';
  dueDate: string;
  priority: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  chartData: ChartDataItem[];
  recentActivity: RecentActivity[];
  upcomingDeadlines: UpcomingDeadline[];
}

export const dashboardService = {
  getStats: async (): Promise<DashboardData> => {
    const response = await axiosInstance.get('/user-dashboard/stats');
    return response.data.data;
  },
};
