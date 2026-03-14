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
  deleteTask: (columnId: string, taskId: string) => void;
  setMembers: (members: ProjectMember[]) => void;
}