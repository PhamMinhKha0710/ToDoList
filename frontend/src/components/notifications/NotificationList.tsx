import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { 
  MessageSquare, 
  UserPlus, 
  ClipboardList, 
  AlertCircle,
  UserCheck,
  UserX
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
    case 'task_assigned': return <UserCheck className="w-4 h-4 text-emerald-600" />;
    case 'task_update': return <ClipboardList className="w-4 h-4 text-blue-500" />;
    case 'member_joined': return <UserCheck className="w-4 h-4 text-green-600" />;
    case 'member_declined': return <UserX className="w-4 h-4 text-red-500" />;
    default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  }
};

export const NotificationList = ({ notifications, onClose }: NotificationListProps) => {
  const navigate = useNavigate();
  const { setUnreadCount, unreadCount } = useNotificationStore();

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <p className="text-[14px] font-medium text-muted-foreground">Không có thông báo nào</p>
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
      navigate(`/projects/${notif.metadata.projectId}/invite`);
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
            "flex items-start gap-4 p-4 text-left border-b border-border transition-colors last:border-0 hover:bg-accent/50",
            !notif.read && "bg-primary/5 hover:bg-primary/10"
          )}
        >
          <div className="mt-1 shrink-0 w-8 h-8 rounded-full bg-background shadow-sm border border-border flex items-center justify-center">
            {getIcon(notif.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[14px] font-bold text-foreground truncate">
                {notif.title}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground/90 line-clamp-2 leading-relaxed">
              {notif.message}
            </p>
            {!notif.read && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Mới</span>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};
