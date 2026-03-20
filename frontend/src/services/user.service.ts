import api from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/user';

export const userService = {
  searchUsers: async (keyword: string): Promise<ApiResponse<{ users: User[] }>> => {
    const response = await api.get('/users/search', {
      params: { q: keyword },
    });
    return response.data;
  },

  updateProfile: async (data: { fullName?: string; displayName?: string; avatarUrl?: string }): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string; confirmPassword?: string }): Promise<ApiResponse<undefined>> => {
    const response = await api.put('/users/change-password', data);
    return response.data;
  },
};
