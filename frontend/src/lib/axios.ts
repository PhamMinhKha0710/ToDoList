import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // gửi cookie refreshToken
});

// ───────── REQUEST INTERCEPTOR ─────────
api.interceptors.request.use(async (config) => {
  const { useAuthStore } = await import("@/stores/auth.store");
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// ───────── RESPONSE INTERCEPTOR (AUTO REFRESH TOKEN) ─────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true },
        );

        const newToken: string = data.data.accessToken;

        const { useAuthStore } = await import("@/stores/auth.store");
        useAuthStore.getState().setAccessToken(newToken);

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        const { useAuthStore } = await import("@/stores/auth.store");
        useAuthStore.getState().logout();

        window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Hiển thị thông báo lỗi từ backend nếu có (trừ lỗi 401 do đã có logic refresh token xử lý riêng)
    if (error.response?.status !== 401) {
      const { toast } = await import("sonner");
      const errorMessage =
        error.response?.data?.message ||
        "Đã có lỗi xảy ra. Vui lòng thử lại sau.";
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  },
);

export default api;
