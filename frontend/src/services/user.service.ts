import api from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/user';

export const userService = {
  getAdminUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  setUserActiveStatus: async (id: string, isActive: boolean): Promise<ApiResponse<User>> => {
    const response = await api.patch(`/admin/users/${id}/active`, { isActive });
    return response.data;
  },

  searchUsers: async (keyword: string): Promise<ApiResponse<{ users: User[] }>> => {
    const response = await api.get('/users/search', {
      params: { q: keyword },
    });
    return response.data;
  },
};
