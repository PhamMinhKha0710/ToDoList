import { create } from 'zustand';
import type { Kanban } from '@/types/kanban';

export const useKanbanStore = create<Kanban>()((set, get) => ({
  activeProject: null,
  isActivityOpen: false,
  isReplayOpen: false,
  columns: [],
  tasks: {},
  members: [],

  setActiveProject: (project) => set({ activeProject: project }),
  setIsActivityOpen: (isOpen) => set({ isActivityOpen: isOpen }),
  setIsReplayOpen: (isOpen) => set({ isReplayOpen: isOpen }),
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
    // 1. Tìm task hiện tại và column cũ của nó trong toàn bộ state
    let oldColumnId = "";
    let existingTask: any = null;

    for (const [colId, columnTasks] of Object.entries(state.tasks)) {
      const found = columnTasks.find((t: any) => t._id === taskId);
      if (found) {
        existingTask = found;
        oldColumnId = colId;
        break;
      }
    }

    if (!existingTask) return state;

    const updatedTask = { ...existingTask, ...data };
    const newColumnId = (data as { columnId?: string }).columnId || columnId;

    // 2. Nếu task bị chuyển sang column khác
    if (newColumnId !== oldColumnId) {
      return {
        tasks: {
          ...state.tasks,
          [oldColumnId]: (state.tasks[oldColumnId] || []).filter(t => t._id !== taskId),
          [newColumnId]: [...(state.tasks[newColumnId] || []), updatedTask],
        }
      };
    }

    // 3. Cập nhật tại chỗ trong cùng column
    return {
      tasks: {
        ...state.tasks,
        [oldColumnId]: (state.tasks[oldColumnId] || []).map(t =>
          t._id === taskId ? updatedTask : t
        )
      }
    };
  }),

  moveTask: (fromColumnId, toColumnId, taskId, toIndex?) => set((state) => {
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
  
  // NEW: Socket real-time handlers
  handleTaskMoved: (moveData: {
    taskId: string;
    sourceColumnId: string;
    destinationColumnId: string;
    sourceTaskIds: string[];
    destinationTaskIds: string[];
  }) => {
    const state = get();
    const { taskId, sourceColumnId, destinationColumnId, sourceTaskIds, destinationTaskIds } = moveData;
    
    // Tìm task object thực tế (có thể đang ở bất kỳ column nào trong state cục bộ)
    let movedTask: any = null;
    Object.values(state.tasks).some((columnTasks) => {
      movedTask = columnTasks.find((t: any) => t._id === taskId);
      return !!movedTask;
    });

    if (!movedTask) {
      console.warn(`[Socket] Task ${taskId} context not found in local state, cannot sync order.`);
      return;
    }

    // Cập nhật columnId mới cho task
    const updatedTask = { ...movedTask, columnId: destinationColumnId };

    // 1. Tạo bản đồ tasks tạm thời từ tất cả các task hiện có để map theo ID mới
    const allTasksMap = new Map<string, any>();
    Object.values(state.tasks).flat().forEach((t: any) => allTasksMap.set(t._id, t));
    // Đảm bảo task đang di chuyển có data mới nhất
    allTasksMap.set(taskId, updatedTask);

    // 2. Xây dựng lại danh sách cho source column
    const newSourceTasks = sourceTaskIds
      .map(id => allTasksMap.get(id))
      .filter(Boolean);

    // 3. Xây dựng lại danh sách cho destination column
    const newDestTasks = destinationTaskIds
      .map(id => allTasksMap.get(id))
      .filter(Boolean);

    set((state) => ({
      tasks: {
        ...state.tasks,
        [sourceColumnId]: newSourceTasks,
        [destinationColumnId]: newDestTasks,
      }
    }));
  },

  handleColumnsReordered: (columns: any[]) => set({ columns }),
}));
