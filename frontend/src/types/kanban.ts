import type { Column } from "./column";
import type { Task } from "./task";
import type { ProjectMember } from "./project";

// Interface cho State của Store
export interface Kanban {
  columns: Column[];
  tasks: Record<string, Task[]>; // Key là columnId, Value là mảng các task của column đó
  members: ProjectMember[];
  
  // Actions
  setColumns: (columns: Column[]) => void;
  addColumn: (column: Column) => void;
  updateColumn: (columnId: string, data: Partial<Column>) => void;
  deleteColumn: (columnId: string) => void;
  
  setTasks: (columnId: string, tasks: Task[]) => void;
  addTask: (columnId: string, task: Task) => void;
  /**
   * Cập nhật task trong store.
   * @param columnId - columnId hiện tại của task (nơi task đang nằm trong store)
   * @param taskId - id của task
   * @param data - các trường cần cập nhật (Partial<Task>)
   * Nếu data có chứa columnId mới, dùng moveTask thay thế.
   */
  updateTask: (columnId: string, taskId: string, data: Partial<Task>) => void;
  /**
   * Di chuyển task từ column này sang column khác (dùng cho drag-drop).
   * @param fromColumnId - column nguồn
   * @param toColumnId - column đích
   * @param taskId - id của task cần di chuyển
   * @param toIndex - vị trí muốn chèn vào ở column đích (optional)
   */
  moveTask: (fromColumnId: string, toColumnId: string, taskId: string, toIndex?: number) => void;
  deleteTask: (columnId: string, taskId: string) => void;
  setMembers: (members: ProjectMember[]) => void;
}