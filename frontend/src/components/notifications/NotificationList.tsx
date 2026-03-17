import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { 
  MessageSquare, 
  UserPlus, 
  ClipboardList, 
  AlertCircle 
} from "lucide-react";
import type { Notification, NotificationType } from "@/types/notification";
import { notificationService } from "@/services/notification.service";
import { useNotificationStore } from "@/stores/notification.store";
import { cn } from "@/lib/utils";

interface NotificationListProps {
  notifications: Notification[];
  onClose: () => void;
}

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'new_comment': return <MessageSquare className="w-4 h-4 text-emerald-500" />;
    case 'project_invite': return <UserPlus className="w-4 h-4 text-indigo-500" />;
    case 'task_assigned': return <ClipboardList className="w-4 h-4 text-amber-500" />;
    case 'task_update': return <ClipboardList className="w-4 h-4 text-blue-500" />;
    default: return <AlertCircle className="w-4 h-4 text-slate-500" />;
  }
};

export const NotificationList = ({ notifications, onClose }: NotificationListProps) => {
  const navigate = useNavigate();
  const { setUnreadCount, unreadCount } = useNotificationStore();

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-[14px] font-medium text-slate-500">Không có thông báo nào</p>
      </div>
    );
  }

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      await notificationService.markAsRead(notif._id);
      setUnreadCount(Math.max(0, unreadCount - 1));
    }

    onClose();

    // Điều hướng dựa trên metadata
    if (notif.type === 'project_invite' && notif.metadata?.projectId) {
      navigate(`/projects/${notif.metadata.projectId}/invitation`);
    } else if (notif.metadata?.projectId) {
      navigate(`/projects/${notif.metadata.projectId}`);
      // Nếu có taskId, có thể cân nhắc mở modal task (cần state management hoặc URL params)
    }
  };

  return (
    <div className="flex flex-col">
      {notifications.map((notif) => (
        <button
          key={notif._id}
          onClick={() => handleNotificationClick(notif)}
          className={cn(
            "flex items-start gap-4 p-4 text-left border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50",
            !notif.read && "bg-indigo-50/30 hover:bg-indigo-50/50"
          )}
        >
          <div className="mt-1 shrink-0 w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center">
            {getIcon(notif.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[14px] font-bold text-slate-900 truncate">
                {notif.title}
              </span>
              <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
              </span>
            </div>
            <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed">
              {notif.message}
            </p>
            {!notif.read && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Mới</span>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};
