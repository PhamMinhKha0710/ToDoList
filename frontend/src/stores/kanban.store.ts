import { create } from 'zustand';

import type { Kanban } from '@/types/kanban';



export const useKanbanStore = create<Kanban>()((set) => ({
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
