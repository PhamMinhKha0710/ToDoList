import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { projectService } from "@/services/project.service"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
} from "recharts"
import { Loader2, CheckCircle2, Clock, AlertCircle, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ProjectStats as ProjectStatsType } from "@/types/project"

interface ProjectStatisticsDialogProps {
  projectId: string
  projectName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectStatisticsDialog({
  projectId,
  projectName,
  open,
  onOpenChange,
}: ProjectStatisticsDialogProps) {
  const { data: response, isLoading } = useQuery({
    queryKey: ["project-stats", projectId],
    queryFn: () => projectService.getProjectStats(projectId),
    enabled: open,
  })

  const stats = response?.data

  if (isLoading || !stats) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[850px] min-h-[500px] flex items-center justify-center bg-card border-border">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang tải dữ liệu thống kê...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-[850px] max-h-[90vh] overflow-y-auto bg-card border-border p-0 gap-0 shadow-2xl">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Thống kê dự án: <span className="text-primary">{projectName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard 
              label="Tổng số Task" 
              value={stats.summary.totalTasks} 
              icon={<AlertCircle className="h-4 w-4 text-primary" />}
              className="bg-primary/5 border-primary/20"
            />
            <SummaryCard 
              label="Đã hoàn thành" 
              value={stats.summary.completedTasks} 
              icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
              className="bg-green-500/5 border-green-500/20"
            />
            <SummaryCard 
              label="Đang quá hạn" 
              value={stats.summary.overdueTasks} 
              icon={<Clock className="h-4 w-4 text-destructive" />}
              className="bg-destructive/5 border-destructive/20"
              valueClassName="text-destructive"
            />
            <SummaryCard 
              label="Thành viên" 
              value={stats.summary.memberCount} 
              icon={<Users className="h-4 w-4 text-blue-500" />}
              className="bg-blue-500/5 border-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <section className="rounded-xl border bg-background/50 p-5 min-h-[350px] flex flex-col shadow-sm">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                Trạng thái công việc
              </h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Priority Distribution */}
            <section className="rounded-xl border bg-background/50 p-5 min-h-[350px] flex flex-col shadow-sm">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-orange-500 rounded-full" />
                Mức độ ưu tiên
              </h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.priorityDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.1} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      width={80}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: 'hsl(var(--muted) / 0.2)' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar 
                      dataKey="value" 
                      name="Số lượng"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    >
                      {stats.priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* Member Activity Table/List */}
          <section className="rounded-xl border bg-background/50 p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded-full" />
              Hiệu suất thành viên
            </h3>
            <div className="space-y-4">
              {stats.memberDistribution.length > 0 ? (
                stats.memberDistribution.map((member) => (
                  <div key={member.userId} className="flex items-center gap-4 group">
                    <Avatar className="h-9 w-9 border border-border group-hover:border-primary/50 transition-colors">
                      <AvatarImage src={member.avatarUrl} />
                      <AvatarFallback className="text-xs uppercase bg-muted">
                        {member.displayName.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium truncate">{member.displayName}</span>
                        <span className="text-xs text-muted-foreground">
                          {member.completedCount}/{member.taskCount} công việc hoàn thành
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
                          style={{ 
                            width: `${member.taskCount > 0 ? (member.completedCount / member.taskCount) * 100 : 0}%`,
                            opacity: member.taskCount > 0 ? 1 : 0.3
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">Chưa có thành viên nào hoạt động.</p>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SummaryCard({ 
  label, 
  value, 
  icon, 
  className, 
  valueClassName 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-1 transition-all hover:shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground opacity-80">{label}</span>
        {icon}
      </div>
      <span className={`text-2xl font-bold ${valueClassName || "text-foreground"}`}>{value}</span>
    </div>
  )
}
