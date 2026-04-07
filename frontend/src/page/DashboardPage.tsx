import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Briefcase, 
  TrendingUp,
  Plus,
  ArrowRight,
  Loader2
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useState } from "react";
import { CreateProjectModal } from "@/components/project/CreateProjectModal";
import relativeTime from "dayjs/plugin/relativeTime";
import { useDashboardSocket } from "@/hooks/use-socket";

dayjs.extend(relativeTime);

const DashboardPage = () => {
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  
  // Initialize real-time dashboard socket listeners
  useDashboardSocket();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardService.getStats,
    // refetchInterval is no longer needed with real-time socket updates
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-destructive">Lỗi tải dữ liệu Dashboard</h2>
        <p className="text-muted-foreground">Vui lòng thử lại sau.</p>
      </div>
    );
  }

  const { summary, chartData, recentActivity, upcomingDeadlines } = data;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between px-8 py-8 border-b bg-background/80 backdrop-blur-md sticky top-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Tổng quan
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Chào mừng trở lại! Đây là tóm tắt công việc của bạn.
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 md:mt-0">
           <Button 
            variant="outline" 
            className="rounded-xl font-bold"
            asChild
          >
            <Link to={ROUTES.MY_TASKS}>
              <Plus className="mr-2 h-4 w-4" /> Thêm việc cá nhân
            </Link>
          </Button>
          <Button 
            className="shadow-lg shadow-primary/20 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all"
            onClick={() => setIsCreateProjectOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Dự án mới
          </Button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto relative z-10 custom-scrollbar space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <StatCard 
            title="Đang thực hiện" 
            value={summary.activeTasks} 
            icon={<Clock className="h-5 w-5 text-blue-500" />} 
            description="Số công việc chưa hoàn thành"
          />
          <StatCard 
            title="Hạn hôm nay" 
            value={summary.dueToday} 
            icon={<Calendar className="h-5 w-5 text-orange-500" />} 
            description="Cần hoàn thành ngay"
            alert={summary.dueToday > 0}
          />
          <StatCard 
            title="Quá hạn" 
            value={summary.overdue} 
            icon={<AlertCircle className="h-5 w-5 text-red-500" />} 
            description="Công việc đã quá thời hạn"
            alert={summary.overdue > 0}
            color="text-red-600"
          />
          <StatCard 
            title="Xong tuần này" 
            value={summary.completedThisWeek} 
            icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} 
            description="Năng suất tuyệt vời!"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <Card className="lg:col-span-2 border-none shadow-xl bg-background/50 backdrop-blur-sm rounded-[2rem] overflow-hidden animate-in zoom-in-95 duration-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Năng suất làm việc</CardTitle>
                  <CardDescription>Số công việc hoàn thành trong 7 ngày qua</CardDescription>
                </div>
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm rounded-[2rem] animate-in slide-in-from-right-4 duration-700">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Hạn chót sắp tới</CardTitle>
              <CardDescription>Đừng để lỡ những việc này</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingDeadlines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground opacity-50">
                  <CheckCircle2 className="h-12 w-12 mb-2" />
                  <p className="text-sm font-medium">Mọi thứ đã sẵn sàng!</p>
                </div>
              ) : (
                upcomingDeadlines.map((task) => (
                  <Link 
                    key={task._id} 
                    to={task.type === 'personal' ? ROUTES.MY_TASKS : `/tasks/${task._id}`}
                    className="flex items-center p-3 rounded-2xl hover:bg-muted/50 transition-all border border-transparent hover:border-border group"
                  >
                    <div className={`w-1.5 h-10 rounded-full mr-3 ${
                      task.priority === 'urgent' ? 'bg-red-500' : 
                      task.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {dayjs(task.dueDate).format('DD/MM')} • {task.type === 'personal' ? 'Cá nhân' : 'Dự án'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))
              )}
              <Separator className="my-4" />
              <Button variant="ghost" className="w-full text-xs font-bold text-muted-foreground hover:text-primary" asChild>
                <Link to={ROUTES.PROJECTS}>Xem tất cả công việc</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm rounded-[2.5rem] animate-in fade-in duration-1000">
           <CardHeader className="px-8 pt-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Hoạt động gần đây</CardTitle>
                  <CardDescription>Những thay đổi mới nhất trong không gian của bạn</CardDescription>
                </div>
              </div>
           </CardHeader>
           <CardContent className="px-8 pb-8">
              <div className="space-y-6 mt-4">
                {recentActivity.length === 0 ? (
                  <p className="text-center py-10 text-muted-foreground">Chưa có hoạt động nào được ghi lại.</p>
                ) : (
                  recentActivity.map((log, idx) => (
                    <div key={log._id} className="relative flex gap-4 group">
                      {idx !== recentActivity.length - 1 && (
                        <div className="absolute left-6 top-10 bottom-[-24px] w-0.5 bg-muted group-hover:bg-primary/20 transition-colors" />
                      )}
                      <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                        <AvatarImage src={log.userId.avatarUrl} />
                        <AvatarFallback className="bg-primary/5 text-primary font-bold">
                          {log.userId.displayName?.[0]?.toUpperCase() || log.userId.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm">
                            <span className="font-bold text-foreground">{log.userId.displayName || log.userId.email}</span>
                            <span className="text-muted-foreground mx-1">đã</span>
                            <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider">
                              {(() => {
                                switch(log.action) {
                                  case 'TASK_CREATED': return 'tạo công việc';
                                  case 'TASK_UPDATED': return 'cập nhật công việc';
                                  case 'TASK_MOVED': return 'di chuyển công việc';
                                  case 'TASK_DELETED': return 'xóa công việc';
                                  case 'COLUMN_CREATED': return 'tạo cột';
                                  case 'COLUMN_UPDATED': return 'cập nhật cột';
                                  case 'COLUMN_DELETED': return 'xóa cột';
                                  case 'PROJECT_CREATED': return 'tạo dự án';
                                  case 'PROJECT_UPDATED': return 'cập nhật dự án';
                                  default: return log.action.replace(/_/g, ' ').toLowerCase();
                                }
                              })()}
                            </Badge>
                          </p>
                          <span className="text-xs text-muted-foreground font-medium">{dayjs(log.createdAt).fromNow()}</span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {log.projectId ? (
                            <>Trong dự án <span className="font-bold text-primary">{log.projectId.name}</span></>
                          ) : 'Trong không gian cá nhân'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
           </CardContent>
        </Card>
      </div>

      <CreateProjectModal 
        open={isCreateProjectOpen} 
        onOpenChange={setIsCreateProjectOpen} 
      />
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  alert?: boolean;
  color?: string;
}

const StatCard = ({ title, value, icon, description, alert, color }: StatCardProps) => (
  <Card className={`border-none shadow-lg rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${alert ? 'bg-orange-50/50' : 'bg-background/50'} backdrop-blur-sm group`}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-secondary rounded-2xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {alert && <Badge className="bg-orange-500 hover:bg-orange-600 animate-pulse">Chú ý</Badge>}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-muted-foreground tracking-wide uppercase">{title}</p>
        <h3 className={`text-3xl font-bold ${color || 'text-foreground'}`}>{value}</h3>
        <p className="text-xs text-muted-foreground font-medium">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default DashboardPage;
