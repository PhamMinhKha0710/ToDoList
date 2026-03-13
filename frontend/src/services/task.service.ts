import axiosInstance from '@/lib/axios';
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '@/types/task';
import type { ApiResponse } from '@/types/api';

export const taskService = {
  getTasksByColumnId: async (columnId: string): Promise<Task[]> => {
    const response = await axiosInstance.get<ApiResponse<{ tasks: Task[] }>>(`/tasks/column/${columnId}`);
    return response.data.data.tasks;
  },

  createTask: async (data: CreateTaskPayload): Promise<Task> => {
    const response = await axiosInstance.post<ApiResponse<{ task: Task }>>('/tasks', data);
    return response.data.data.task;
  },

  updateTask: async (taskId: string, data: UpdateTaskPayload): Promise<Task> => {
    const response = await axiosInstance.put<ApiResponse<{ task: Task }>>(`/tasks/${taskId}`, data);
    return response.data.data.task;
  },

  deleteTask: async (taskId: string): Promise<void> => {
    await axiosInstance.delete(`/tasks/${taskId}`);
  },

  moveTask: async (data: { 
    taskId: string; 
    sourceColumnId: string; 
    destinationColumnId: string; 
    sourceIndex: number; 
    destinationIndex: number; 
  }): Promise<void> => {
    await axiosInstance.post('/tasks/move', data);
  }
};
