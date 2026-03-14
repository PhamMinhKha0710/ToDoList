// import axios from 'axios'

// const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

// const axiosInstance = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true, // gửi kèm cookie (refreshToken)
//   headers: { 'Content-Type': 'application/json' },
// })

// // ─── Request interceptor: gắn Access Token ────────────────────────────────────
// axiosInstance.interceptors.request.use(async (config) => {
//   // Lấy accesstoken trực tiếp từ Zustand store
//   const { useAuthStore } = await import('@/stores/auth.store')
//   const accessToken = useAuthStore.getState().accessToken

//   if (accessToken) {
//     config.headers['Authorization'] = `Bearer ${accessToken}`
//   }

//   return config
// })

// // ─── Response interceptor: auto refresh khi 401 ───────────────────────────────
// let isRefreshing = false
// let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

// const processQueue = (error: unknown, token: string | null) => {
//   failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
//   failedQueue = []
// }

// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject })
//         }).then((token) => {
//           originalRequest.headers['Authorization'] = `Bearer ${token}`
//           return axiosInstance(originalRequest)
//         })
//       }

//       originalRequest._retry = true
//       isRefreshing = true

//       try {
//         const { data } = await axios.post(
//           `${BASE_URL}/auth/refresh-token`,
//           {},
//           { withCredentials: true }
//         )
//         const newToken: string = data.data.accessToken

//         // Cập nhật accessToken vào store
//         const { useAuthStore } = await import('@/stores/auth.store')
//         useAuthStore.getState().setAccessToken(newToken)

//         processQueue(null, newToken)
//         originalRequest.headers['Authorization'] = `Bearer ${newToken}`
//         return axiosInstance(originalRequest)
//       } catch (refreshError) {
//         processQueue(refreshError, null)
//         const { useAuthStore } = await import('@/stores/auth.store')
//         useAuthStore.getState().logout()
//         window.location.href = '/login'
//         return Promise.reject(refreshError)
//       } finally {
//         isRefreshing = false
//       }
//     }

//     return Promise.reject(error)
//   }
// )

// export default axiosInstance

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

    return Promise.reject(error);
  },
);

export default api;
