import { useEffect } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';
import { useKanbanStore } from '@/stores/kanban.store';
import { useNotificationStore } from '@/stores/notification.store';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Task } from '@/types/task';
import type { Column } from '@/types/column';
import type { Comment } from '@/types/comment';

// ─── Task event payloads ──────────────────────────────────────────────────────
interface TaskDeletedPayload {
  taskId: string;
  columnId: string;
}

interface TaskMovedPayload {
  taskId: string;
  sourceColumnId: string;
  destinationColumnId: string;
  sourceTaskIds: string[];
  destinationTaskIds: string[];
}

// ─── Comment event payloads ───────────────────────────────────────────────────
interface CommentDeletedPayload {
  commentId: string;
  taskId: string;
}

// ─── Column event payloads ────────────────────────────────────────────────────
interface ColumnDeletedPayload {
  columnId: string;
}

/**
 * Hook để tham gia vào room của một task cụ thể và lắng nghe các sự kiện liên quan (Comment).
 * Cập nhật trực tiếp vào cache của React Query.
 * 
 * @param taskId - ID của task đang mở
 */
export const useTaskSocket = (taskId: string | undefined) => {
  const queryClient = useQueryClient();
  const { accessToken: token, isSocketInitialized } = useAuthStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !taskId || !token || !isSocketInitialized) return;

    console.log(`[useTaskSocket] Joining room for task: ${taskId}`);
    socket.emit('join:task', taskId);

    // ─── Comment Events ──────────────────────────────────────────────────────
    const onCommentCreated = (newComment: Comment) => {
      console.log('[useTaskSocket] Real-time comment created:', newComment);
      queryClient.setQueryData(['comments', taskId], (old: Comment[] | undefined) => {
        if (!old) return [newComment];
        // Đề phòng trường hợp nhận được event cho chính comment mình vừa tạo (đã có trong cache)
        if (old.some(c => c._id === newComment._id)) {
          console.log('[useTaskSocket] Comment already exists in cache, skipping sync');
          return old;
        }
        return [...old, newComment];
      });
    };

    const onCommentUpdated = (updatedComment: Comment) => {
      console.log('[useTaskSocket] Real-time comment updated:', updatedComment);
      queryClient.setQueryData(['comments', taskId], (old: Comment[] | undefined) => {
        if (!old) return [];
        return old.map(c => c._id === updatedComment._id ? updatedComment : c);
      });
    };

    const onCommentDeleted = ({ commentId }: CommentDeletedPayload) => {
      console.log('[useTaskSocket] Real-time comment deleted:', commentId);
      queryClient.setQueryData(['comments', taskId], (old: Comment[] | undefined) => {
        if (!old) return [];
        return old.filter(c => c._id !== commentId);
      });
    };

    socket.on('comment:created', onCommentCreated);
    socket.on('comment:updated', onCommentUpdated);
    socket.on('comment:deleted', onCommentDeleted);

    return () => {
      console.log(`[useTaskSocket] Leaving room for task: ${taskId}`);
      socket.emit('leave:task', taskId);
      socket.off('comment:created', onCommentCreated);
      socket.off('comment:updated', onCommentUpdated);
      socket.off('comment:deleted', onCommentDeleted);
    };
  }, [taskId, token, isSocketInitialized, queryClient]);
};

/**
 * Hook để join/leave project room và lắng nghe tất cả realtime events
 * của một project cụ thể. Cập nhật Zustand store trực tiếp.
 *
 * @param projectId - ID của project hiện tại đang xem
 * @param options - Các callback tùy chọn (hiện tại comment đã dùng useTaskSocket nên có thể deprecate dần)
 */
export const useProjectSocket = (
  projectId: string | undefined,
  options?: {
    onCommentCreated?: (comment: Comment) => void;
    onCommentUpdated?: (comment: Comment) => void;
    onCommentDeleted?: (payload: CommentDeletedPayload) => void;
  }
) => {
  const {
    addTask,
    addColumn,
    updateTask,
    deleteTask,
    setColumns,
    updateColumn,
    deleteColumn,
  } = useKanbanStore();
  const { accessToken: token, isSocketInitialized } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    console.log('[useProjectSocket] Effect running. Project:', projectId, '| Token exists:', !!token, '| Socket exists:', !!socket, '| Socket initialized:', isSocketInitialized);
    
    if (!socket || !projectId || !token || !isSocketInitialized) return;

    const joinRoom = () => {
      console.log('[useProjectSocket] Emitting join:project for:', projectId);
      socket.emit('join:project', projectId);
    };

    // ─── Join project room ngay lập tức hoặc khi connect ──────────────────────
    if (socket.connected) {
      joinRoom();
    } else {
      console.log('[useProjectSocket] Socket not connected, waiting for connect event');
    }
    
    socket.on('connect', joinRoom);

    // ─── Project Events ──────────────────────────────────────────────────────
    const onTaskCreated = (task: Task) => {
      console.log('[Socket] Task created:', task);
      addTask(task.columnId, task);
      queryClient.invalidateQueries({ queryKey: ["tasks", task.columnId] });
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project-stats", projectId] });
    };

    const onTaskUpdated = (task: Task) => {
      console.log('[Socket] Task updated:', task);
      updateTask(task.columnId, task._id, task);
      queryClient.invalidateQueries({ queryKey: ["project-stats", projectId] });
    };

    const onTaskDeleted = ({ taskId, columnId }: TaskDeletedPayload) => {
      deleteTask(columnId, taskId);
      queryClient.invalidateQueries({ queryKey: ["project-stats", projectId] });
    };

    const onTaskMoved = (data: TaskMovedPayload) => {
      console.log('[Socket] Task moved event received:', data);
      // Sử dụng handleTaskMoved để sync full order của cả 2 column
      const state = useKanbanStore.getState();
      state.handleTaskMoved(data);
      queryClient.invalidateQueries({ queryKey: ["project-stats", projectId] });
    };

    // ─── Column events ────────────────────────────────────────────────────────
    const onColumnCreated = (column: Column) => {
      console.log('[Socket] Column created:', column);
       addColumn(column);
    };

    const onColumnUpdated = (column: Column) => {
      updateColumn(column._id, column);
    };

    const onColumnDeleted = ({ columnId }: ColumnDeletedPayload) => {
      deleteColumn(columnId);
    };

    const onColumnsReordered = (columns: Parameters<typeof setColumns>[0]) => {
      setColumns(columns);
    };

    const onActivityCreated = (activity: any) => {
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      if (activity.entityId) {
        queryClient.invalidateQueries({ queryKey: ['activities', activity.entityId] });
      }
    };

    // ─── Comment events ───────────────────────────────────────────────────────
    const onCommentCreated = (comment: Comment) => {
      options?.onCommentCreated?.(comment);
    };

    const onCommentUpdated = (comment: Comment) => {
      options?.onCommentUpdated?.(comment);
    };

    const onCommentDeleted = (payload: CommentDeletedPayload) => {
      options?.onCommentDeleted?.(payload);
    };

    socket.on('comment:created', onCommentCreated);
    socket.on('comment:updated', onCommentUpdated);
    socket.on('comment:deleted', onCommentDeleted);

    socket.on('task:created', onTaskCreated);
    socket.on('task:updated', onTaskUpdated);
    socket.on('task:deleted', onTaskDeleted);
    socket.on('task:moved', onTaskMoved);

    const onProjectMemberUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-stats", projectId] });
    };

    socket.on('column:created', onColumnCreated);
    socket.on('column:updated', onColumnUpdated);
    socket.on('column:deleted', onColumnDeleted);
    socket.on('column:reordered', onColumnsReordered);

    socket.on('activity:created', onActivityCreated);
    socket.on('project:member_updated', onProjectMemberUpdated);

    // ─── Project Deactivation/Deletion ──────────────────────────────────────────
    const onProjectDeactivated = () => {
      toast.error('Dự án này đã bị vô hiệu hóa bởi Admin', {
        duration: 5000,
      });
      window.location.href = '/projects';
    };

    const onProjectDeleted = () => {
      toast.error('Dự án này đã bị xóa bởi Admin', {
        duration: 5000,
      });
      window.location.href = '/projects';
    };

    socket.on('project:deactivated', onProjectDeactivated);
    socket.on('project:deleted', onProjectDeleted);

    // ─── Cleanup ─────────────────────────────────────────────────────────────
    return () => {
      console.log(`[useProjectSocket] Leaving room for project: ${projectId}`);
      socket.emit('leave:project', projectId);
      socket.off('connect', joinRoom);

      socket.off('task:created', onTaskCreated);
      socket.off('task:updated', onTaskUpdated);
      socket.off('task:deleted', onTaskDeleted);
      socket.off('task:moved', onTaskMoved);

      socket.off('column:created', onColumnCreated);
      socket.off('column:updated', onColumnUpdated);
      socket.off('column:deleted', onColumnDeleted);
      socket.off('column:reordered', onColumnsReordered);
      socket.off('activity:created', onActivityCreated);
      socket.off('project:member_updated', onProjectMemberUpdated);

      socket.off('comment:created', onCommentCreated);
      socket.off('comment:updated', onCommentUpdated);
      socket.off('comment:deleted', onCommentDeleted);

      socket.off('project:deactivated', onProjectDeactivated);
      socket.off('project:deleted', onProjectDeleted);
    };
  }, [projectId, token, isSocketInitialized]);
};

/**
 * Hook dành riêng cho trang Quản lý Dự án của Admin.
 * Lắng nghe các sự kiện tạo/sửa/xóa từ các Admin khác để đồng bộ danh sách.
 * 
 * @param onRefresh - Callback để tải lại danh sách dự án (loadData)
 */
export const useAdminProjectSocket = (onRefresh: () => void) => {
  const { isSocketInitialized } = useAuthStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isSocketInitialized) return;

    console.log('[useAdminProjectSocket] Joining admin:projects room');
    socket.emit('join:admin_projects');

    const onAdminProjectListUpdated = () => {
      console.log('[useAdminProjectSocket] Admin project list updated, refreshing...');
      onRefresh();
    };

    socket.on('admin:project_list_updated', onAdminProjectListUpdated);

    return () => {
      console.log('[useAdminProjectSocket] Leaving admin:projects room');
      socket.emit('leave:admin_projects');
      socket.off('admin:project_list_updated', onAdminProjectListUpdated);
    };
  }, [isSocketInitialized, onRefresh]);
};

/**
 * Hook toàn cục để lắng nghe thông báo mới.
 * Cần được gọi ở cấp cao nhất (App.tsx) sau khi socket đã initialized.
 */
export const useNotificationSocket = () => {
  const { increment } = useNotificationStore();
  const { isSocketInitialized } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isSocketInitialized) return;

    const onNotificationNew = (notification: any) => {
      console.log('[Socket Global] New notification:', notification);
      useNotificationStore.getState().addNotification(notification);
      if (notification?.title) {
        toast.info(notification.title, { description: notification.message });
      }
    };

    socket.on('notification:new', onNotificationNew);

    const onProjectListUpdated = () => {
      console.log('[Socket Global] Project list updated');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    };

    socket.on('project:list_updated', onProjectListUpdated);

    return () => {
      socket.off('notification:new', onNotificationNew);
      socket.off('project:list_updated', onProjectListUpdated);
    };
  }, [isSocketInitialized, increment]);
};

/**
 * Hook toàn cục để quản lý kết nối socket dựa trên accessToken.
 * Giúp tự động kết nối lại khi refresh token hoặc sau khi load trang.
 */
export const useAuthSocket = () => {
  const { accessToken: token, setSocketInitialized } = useAuthStore();

  useEffect(() => {
    console.log('[useAuthSocket] Effect running. Token exists:', !!token);
    
    if (token) {
      connectSocket(token);
      setSocketInitialized(true);
      
      const socket = getSocket();
      if (socket) {
        const onUserLocked = () => {
          console.log('[Socket Global] Account locked by admin');
          useAuthStore.getState().logout();
          toast.error('Tài khoản của bạn đã bị khóa bởi Admin', {
            duration: 0, // Dừng lại cho đến khi user xóa toast hoặc refresh
          });
          window.location.href = '/login';
        };

        socket.on('user:locked', onUserLocked);

        return () => {
          socket.off('user:locked', onUserLocked);
        };
      }
    } else {
      console.log('[useAuthSocket] No token, disconnecting socket');
      disconnectSocket();
      setSocketInitialized(false);
    }
  }, [token, setSocketInitialized]);
};
