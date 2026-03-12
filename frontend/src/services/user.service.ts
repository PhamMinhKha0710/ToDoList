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
};
