import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // gửi kèm cookie (refreshToken)
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor: gắn Access Token ────────────────────────────────────
axiosInstance.interceptors.request.use((config) => {
  // accessToken được lưu trong Zustand (in-memory), lấy trực tiếp
  const raw = localStorage.getItem('auth-store')
  if (raw) {
    try {
      const { state } = JSON.parse(raw)
      if (state?.accessToken) {
        config.headers['Authorization'] = `Bearer ${state.accessToken}`
      }
    } catch {
      /* ignore */
    }
  }
  return config
})

// ─── Response interceptor: auto refresh khi 401 ───────────────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`
          return axiosInstance(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        )
        const newToken: string = data.data.accessToken

        // Cập nhật accessToken vào store
        const { useAuthStore } = await import('@/stores/auth.store')
        useAuthStore.getState().setAccessToken(newToken)

        processQueue(null, newToken)
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        const { useAuthStore } = await import('@/stores/auth.store')
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
