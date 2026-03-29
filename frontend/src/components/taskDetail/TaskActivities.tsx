
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, Activity as ActivityIcon } from 'lucide-react';
import { activityService } from '@/services/activity.service';

interface TaskActivitiesProps {
  taskId: string;
}

export const TaskActivities = ({ taskId }: TaskActivitiesProps) => {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', taskId],
    queryFn: () => activityService.getTaskActivities(taskId),
    enabled: !!taskId,
  });

  const getActionText = (action: string) => {
    switch (action) {
      case 'TASK_CREATED': return 'đã tạo tác vụ';
      case 'TASK_UPDATED': return 'đã sửa tác vụ';
      case 'TASK_MOVED': return 'đã di chuyển tác vụ';
      case 'TASK_DELETED': return 'đã xóa tác vụ';
      default: return 'đã cập nhật';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải lịch sử...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2">
          <ActivityIcon className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-[13px] font-medium text-slate-500">Chưa có hoạt động nào được ghi nhận.</p>
      </div>
    );
  }

  return (
    <div className="relative before:absolute before:inset-y-2 before:left-[19px] before:w-[2px] before:bg-slate-100 pl-2 space-y-6">
      {activities.map((activity) => (
        <div key={activity._id} className="relative flex items-start gap-4">
          <div className="absolute left-[13px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-400 z-10" />
          <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shrink-0 ml-8 relative z-10 flex items-center justify-center">
            {activity.userId?.avatarUrl ? (
              <img src={activity.userId.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                {activity.userId?.displayName?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 bg-white border border-slate-100 shadow-sm p-3 rounded-xl">
            <p className="text-[13px] text-slate-700">
              <span className="font-bold">{activity.userId?.displayName || activity.userId?.email || 'Người dùng'}</span>{' '}
              {getActionText(activity.action)}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1 flex items-center gap-1.5">
              <ActivityIcon className="w-3 h-3" />
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: vi })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
