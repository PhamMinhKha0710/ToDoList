class UserDashboardService {
  constructor({ PersonalTask, Task, Project, ActivityLog }) {
    this.PersonalTask = PersonalTask;
    this.Task = Task;
    this.Project = Project;
    this.ActivityLog = ActivityLog;
  }

  async getDashboardStats(userId) {
    const now = new Date();
    
    // Calculate start of current week (Monday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7;
    if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    // Generate last 7 days keys (YYYY-MM-DD)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const [personalTasks, projectTasks, userProjects] = await Promise.all([
      this.PersonalTask.find({ userId }).lean(),
      this.Task.find({ assignees: userId }).populate('columnId').lean(),
      this.Project.find({ 'members.userId': userId, 'members.status': 'active' }).select('_id name').lean(),
    ]);

    const projectIds = userProjects.map(p => p._id);

    const activityLogs = await this.ActivityLog.find({
      $or: [
        { userId: userId },
        { projectId: { $in: projectIds } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('userId', 'displayName email avatarUrl')
    .populate('projectId', 'name')
    .lean();

    // Aggregating all tasks
    const allTasks = [
      ...personalTasks.map(t => ({ ...t, type: 'personal' })),
      ...projectTasks.map(t => ({ ...t, type: 'project' }))
    ];

    const activeTasks = allTasks.filter(t => t.status !== 'done');
    const completedTasks = allTasks.filter(t => t.status === 'done');
    const completedThisWeek = completedTasks.filter(t => new Date(t.updatedAt) >= startOfWeek);

    const todayStr = now.toISOString().split('T')[0];
    const dueToday = activeTasks.filter(t => {
      const d = t.endDate || t.dueDate;
      return d && new Date(d).toISOString().split('T')[0] === todayStr;
    });

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const overdue = activeTasks.filter(t => {
      const d = t.endDate || t.dueDate;
      return d && new Date(d) < startOfToday;
    });

    // Chart Data: Completion per day
    const chartData = last7Days.map(dateStr => {
      const count = completedTasks.filter(t => new Date(t.updatedAt).toISOString().split('T')[0] === dateStr).length;
      const parts = dateStr.split('-');
      return { date: `${parts[2]}/${parts[1]}`, fullDate: dateStr, count };
    });

    return {
      summary: {
        activeTasks: activeTasks.length,
        dueToday: dueToday.length,
        completedThisWeek: completedThisWeek.length,
        overdue: overdue.length,
        totalProjects: userProjects.length
      },
      chartData,
      recentActivity: activityLogs,
      upcomingDeadlines: activeTasks
        .filter(t => t.endDate || t.dueDate)
        .sort((a, b) => new Date(a.endDate || a.dueDate).getTime() - new Date(b.endDate || b.dueDate).getTime())
        .slice(0, 5)
        .map(t => ({
          _id: t._id,
          title: t.title,
          type: t.type,
          dueDate: t.endDate || t.dueDate,
          priority: t.priority
        }))
    };
  }
}

module.exports = UserDashboardService;
