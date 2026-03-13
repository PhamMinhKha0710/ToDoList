import { create } from 'zustand';
import type { Column } from '@/types/column';
import type { Task } from '@/types/task';

// Interface cho State của Store
interface KanbanState {
  columns: Column[];
  tasks: Record<string, Task[]>; // Key là columnId, Value là mảng các task của column đó
  
  // Actions
  setColumns: (columns: Column[]) => void;
  addColumn: (column: Column) => void;
  updateColumn: (columnId: string, data: Partial<Column>) => void;
  deleteColumn: (columnId: string) => void;
  
  setTasks: (columnId: string, tasks: Task[]) => void;
  addTask: (columnId: string, task: Task) => void;
}

export const useKanbanStore = create<KanbanState>()((set) => ({
  columns: [],
  tasks: {},

  setColumns: (columns) => set({ columns }),
  
  addColumn: (column) => set((state) => ({ 
    columns: [...state.columns, column] 
  })),

  updateColumn: (columnId, data) => set((state) => ({
    columns: state.columns.map((col) => 
      col._id === columnId ? { ...col, ...data } : col
    )
  })),

  deleteColumn: (columnId) => set((state) => {
    const newColumns = state.columns.filter((col) => col._id !== columnId);
    const newTasks = { ...state.tasks };
    delete newTasks[columnId];
    return { columns: newColumns, tasks: newTasks };
  }),

  setTasks: (columnId, tasks) => set((state) => ({
    tasks: {
      ...state.tasks,
      [columnId]: tasks
    }
  })),

  addTask: (columnId, task) => set((state) => ({
    tasks: {
      ...state.tasks,
      [columnId]: [...(state.tasks[columnId] || []), task]
    }
  })),
}));
