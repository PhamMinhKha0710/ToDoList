import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useKanbanStore } from '@/stores/kanban.store';
import { useNotificationStore } from '@/stores/notification.store';
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
 * Hook để join/leave project room và lắng nghe tất cả realtime events
 * của một project cụ thể. Cập nhật Zustand store trực tiếp.
 *
 * @param projectId - ID của project hiện tại đang xem
 * @param onCommentCreated - Callback khi có comment mới (để cập nhật trong TaskDetailModal nếu đang mở)
 * @param onCommentUpdated - Callback khi comment được chỉnh sửa
 * @param onCommentDeleted - Callback khi comment bị xóa
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
    updateTask,
    deleteTask,
    moveTask,
    setColumns,
    updateColumn,
    deleteColumn,
  } = useKanbanStore();
  const { increment } = useNotificationStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !projectId) return;

    // ─── Join project room ────────────────────────────────────────────────────
    socket.emit('join:project', projectId);

    // ─── Task events ──────────────────────────────────────────────────────────
    const onTaskCreated = (task: Task) => {
      addTask(task.columnId, task);
    };

    const onTaskUpdated = (task: Task) => {
      updateTask(task.columnId, task._id, task);
    };

    const onTaskDeleted = ({ taskId, columnId }: TaskDeletedPayload) => {
      deleteTask(columnId, taskId);
    };

    const onTaskMoved = (data: TaskMovedPayload) => {
      moveTask(data.sourceColumnId, data.destinationColumnId, data.taskId);
    };

    // ─── Column events ────────────────────────────────────────────────────────
    const onColumnCreated = (column: Column) => {
      // Thêm column mới vào danh sách nếu chưa có
      const { columns } = useKanbanStore.getState();
      if (!columns.some((c) => c._id === column._id)) {
        setColumns([...columns, column]);
      }
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

    // ─── Notification events ──────────────────────────────────────────────────
    const onNotificationNew = () => {
      increment();
    };

    // ─── Register listeners ───────────────────────────────────────────────────
    socket.on('task:created', onTaskCreated);
    socket.on('task:updated', onTaskUpdated);
    socket.on('task:deleted', onTaskDeleted);
    socket.on('task:moved', onTaskMoved);

    socket.on('column:created', onColumnCreated);
    socket.on('column:updated', onColumnUpdated);
    socket.on('column:deleted', onColumnDeleted);
    socket.on('column:reordered', onColumnsReordered);

    socket.on('comment:created', onCommentCreated);
    socket.on('comment:updated', onCommentUpdated);
    socket.on('comment:deleted', onCommentDeleted);

    socket.on('notification:new', onNotificationNew);

    // ─── Cleanup ─────────────────────────────────────────────────────────────
    return () => {
      socket.emit('leave:project', projectId);

      socket.off('task:created', onTaskCreated);
      socket.off('task:updated', onTaskUpdated);
      socket.off('task:deleted', onTaskDeleted);
      socket.off('task:moved', onTaskMoved);

      socket.off('column:created', onColumnCreated);
      socket.off('column:updated', onColumnUpdated);
      socket.off('column:deleted', onColumnDeleted);
      socket.off('column:reordered', onColumnsReordered);

      socket.off('comment:created', onCommentCreated);
      socket.off('comment:updated', onCommentUpdated);
      socket.off('comment:deleted', onCommentDeleted);

      socket.off('notification:new', onNotificationNew);
    };
  }, [projectId]);
};
