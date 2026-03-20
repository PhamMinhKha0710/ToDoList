import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/types/api";

export interface PersonalTask {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export const personalTaskService = {
  createPersonalTask: async (data: any): Promise<PersonalTask> => {
    const response = await axiosInstance.post<ApiResponse<{ task: PersonalTask }>>(
      "/personal-tasks",
      data
    );
    return response.data.data.task;
  },

  getPersonalTasks: async (): Promise<PersonalTask[]> => {
    const response = await axiosInstance.get<ApiResponse<{ tasks: PersonalTask[] }>>(
      "/personal-tasks"
    );
    return response.data.data.tasks;
  },

  updatePersonalTask: async (taskId: string, data: any): Promise<PersonalTask> => {
    const response = await axiosInstance.put<ApiResponse<{ task: PersonalTask }>>(
      `/personal-tasks/${taskId}`,
      data
    );
    return response.data.data.task;
  },

  deletePersonalTask: async (taskId: string): Promise<void> => {
    await axiosInstance.delete(`/personal-tasks/${taskId}`);
  },
};
