import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api";

export const twoFactorService = {
  generate: async (): Promise<ApiResponse<{ secret: string; qrCodeUrl: string }>> => {
    const response = await api.post("/2fa/generate");
    return response.data;
  },

  verifySetup: async (
    data: { secret: string; code: string }
  ): Promise<ApiResponse<{ backupCodes: string[] }>> => {
    const response = await api.post("/2fa/verify-setup", data);
    return response.data;
  },
};
