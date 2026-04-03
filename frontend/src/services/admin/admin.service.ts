import api from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
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

  getDashboardTasks: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/admin/dashboard/tasks');
    return response.data;
  },
};
