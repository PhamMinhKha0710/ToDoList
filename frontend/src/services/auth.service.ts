import api from "@/lib/axios";
import type { RegisterInput, LoginInput } from "@/schemas/auth.schema";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/user";

export const authService = {
  register: async (
    data: RegisterInput,
  ): Promise<ApiResponse<{ user: User }>> => {
    // Không gửi confirmPassword lên server
    const payload = {
      displayName: data.displayName,
      email: data.email,
      password: data.password,
    };
    const response = await api.post("/auth/register", payload);
    return response.data;
  },

  login: async (
    data: LoginInput,
  ): Promise<ApiResponse<{ accessToken: string; user: User }>> => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },
};
