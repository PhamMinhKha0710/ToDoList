import api from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type { Project } from '@/types/project';

export const projectService = {
  getProjects: async (): Promise<ApiResponse<{ projects: Project[] }>> => {
    const response = await api.get('/projects');
    return response.data;
  },

  createProject: async (data: { name: string; description?: string }): Promise<ApiResponse<{ project: Project }>> => {
    const response = await api.post('/projects', data);
    return response.data;
  },
};
