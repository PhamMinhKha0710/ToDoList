import { create } from 'zustand';
import type { Column } from '@/types/column';
// import type { Task } from '@/types/task'; // DTO Task sẽ được định nghĩa sau

// Interface cho State của Store
interface KanbanState {
  columns: Column[];
  // tasks: Record<string, Task[]>; // Key là columnId, Value là mảng các task của column đó
  tasks: Record<string, any[]>; // Tạm thời dùng any[] cho task cho đến khi có type Task
  
  // Actions
  setColumns: (columns: Column[]) => void;
  addColumn: (column: Column) => void;
  updateColumn: (columnId: string, data: Partial<Column>) => void;
  deleteColumn: (columnId: string) => void;
  
  setTasks: (columnId: string, tasks: any[]) => void;
  // TODO: Thêm các action cho drag & drop sau
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
    // Xóa column khỏi danh sách cột
    const newColumns = state.columns.filter((col) => col._id !== columnId);
    
    // Đồng thời xóa các task thuộc về column đó (tiết kiệm bộ nhớ)
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
}));
