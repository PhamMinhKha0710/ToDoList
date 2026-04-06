import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotificationStore } from "@/stores/notification.store";
import { NotificationList } from "./NotificationList";
import { notificationService } from "@/services/notification.service";

export const NotificationBell = () => {
  const { unreadCount, fetchUnreadCount, notifications, setNotifications, setUnreadCount } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);


  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setIsLoading(true);
      try {
        const data = await notificationService.getNotifications();
        setNotifications(data);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-accent rounded-full w-10 h-10 transition-colors focus-visible:ring-0"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 hover:bg-red-600 border-2 border-background text-[10px] font-bold"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0 mr-4 mt-2 shadow-xl border-border rounded-2xl overflow-hidden bg-card" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <h3 className="font-bold text-foreground">Thông báo</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary hover:text-primary/80 font-bold h-auto p-0"
              onClick={async (e) => {
                e.stopPropagation();
                await notificationService.markAllAsRead();
                setUnreadCount(0);
                // Refresh list
                const data = await notificationService.getNotifications();
                setNotifications(data);
              }}
            >
              Đánh dấu đã đọc
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Đang tải...
            </div>
          ) : (
            <NotificationList notifications={notifications} onClose={() => setIsOpen(false)} />
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
