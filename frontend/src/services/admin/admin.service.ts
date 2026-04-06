import api from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type { Project } from '@/types/project';
import type { User } from '@/types/user';

export const adminService = {
  getAdminUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  setUserActiveStatus: async (id: string, isActive: boolean): Promise<ApiResponse<User>> => {
    const response = await api.patch(`/admin/users/${id}/active`, { isActive });
    return response.data;
  },

  getDashboardTasks: async (): Promise<ApiResponse<{ tasks: any[]; users: any[] }>> => {
    const response = await api.get('/admin/dashboard/tasks');
    return response.data;
  },

  getAdminProjects: async (): Promise<ApiResponse<Project[]>> => {
    const response = await api.get('/admin/projects');
    return response.data;
  },

  createAdminProject: async (data: any): Promise<ApiResponse<Project>> => {
    const response = await api.post('/admin/projects', data);
    return response.data;
  },

  updateAdminProject: async (id: string, data: any): Promise<ApiResponse<Project>> => {
    const response = await api.put(`/admin/projects/${id}`, data);
    return response.data;
  },

  deleteAdminProject: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/admin/projects/${id}`);
    return response.data;
  },
};
