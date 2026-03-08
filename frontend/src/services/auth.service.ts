import axiosInstance from '@/lib/axios'
import type { RegisterInput } from '@/schemas/auth.schema'
import type { ApiResponse } from '@/types/api'
import type { User } from '@/stores/auth.store'

export const authService = {
  register: async (data: RegisterInput): Promise<ApiResponse<{ user: User }>> => {
    // Không gửi confirmPassword lên server
    const payload = {
      displayName: data.displayName,
      email: data.email,
      password: data.password,
    }
    const response = await axiosInstance.post('/auth/register', payload)
    return response.data
  },
}
