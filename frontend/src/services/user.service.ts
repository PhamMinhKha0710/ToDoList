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

  updateProfile: async (data: { email?: string; fullName?: string; displayName?: string; avatarUrl?: string; otp?: string }): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string; confirmPassword?: string; otp?: string }): Promise<ApiResponse<undefined>> => {
    const response = await api.put('/users/change-password', data);
    return response.data;
  },

  requestOtp: async (data: { email: string; action: 'CHANGE_PASSWORD' | 'UPDATE_EMAIL' }): Promise<ApiResponse<undefined>> => {
    const response = await api.post('/auth/request-otp', data);
    return response.data;
  },

  verifyOtp: async (data: { email: string; otp: string; action: 'CHANGE_PASSWORD' | 'UPDATE_EMAIL' }): Promise<ApiResponse<undefined>> => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },
};
