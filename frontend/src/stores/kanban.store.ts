import { create } from 'zustand';

import type { Kanban } from '@/types/kanban';



export const useKanbanStore = create<Kanban>()((set) => ({
  columns: [],
  tasks: {},
  members: [],

  setColumns: (columns) => set({ columns }),
  setMembers: (members) => set({ members }),

  addColumn: (column) => set((state) => ({
    columns: state.columns.some((c) => c._id === column._id)
      ? state.columns
      : [...state.columns, column],
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

  addTask: (columnId, task) => set((state) => {
    const currentTasks = state.tasks[columnId] || [];
    if (currentTasks.some((t) => t._id === task._id)) return state;
    return {
      tasks: {
        ...state.tasks,
        [columnId]: [...currentTasks, task]
      }
    };
  }),

  deleteTask: (columnId, taskId) => set((state) => ({
    tasks: {
      ...state.tasks,
      [columnId]: (state.tasks[columnId] || []).filter(t => t._id !== taskId)
    }
  })),
  
  updateTask: (columnId, taskId, data) => set((state) => {
    // Nếu data chứa columnId mới → task bị chuyển column
    const newColumnId = (data as { columnId?: string }).columnId;
    if (newColumnId && newColumnId !== columnId) {
      // Di chuyển task sang column mới
      const task = (state.tasks[columnId] || []).find(t => t._id === taskId);
      if (!task) return state;
      const updatedTask = { ...task, ...data };
      return {
        tasks: {
          ...state.tasks,
          [columnId]: state.tasks[columnId].filter(t => t._id !== taskId),
          [newColumnId]: [...(state.tasks[newColumnId] || []), updatedTask],
        }
      };
    }
    // Cập nhật tại chỗ trong cùng column
    return {
      tasks: {
        ...state.tasks,
        [columnId]: (state.tasks[columnId] || []).map(t =>
          t._id === taskId ? { ...t, ...data } : t
        )
      }
    };
  }),

  moveTask: (fromColumnId, toColumnId, taskId, toIndex) => set((state) => {
    const task = (state.tasks[fromColumnId] || []).find(t => t._id === taskId);
    if (!task) return state;
    const updatedTask = { ...task, columnId: toColumnId };
    const targetList = (state.tasks[toColumnId] || []).filter(t => t._id !== taskId);
    if (toIndex !== undefined) {
      targetList.splice(toIndex, 0, updatedTask);
    } else {
      targetList.push(updatedTask);
    }
    return {
      tasks: {
        ...state.tasks,
        [fromColumnId]: state.tasks[fromColumnId].filter(t => t._id !== taskId),
        [toColumnId]: targetList,
      }
    };
  }),

  reorderColumns: (newColumns) => set({ columns: newColumns }),
}));
