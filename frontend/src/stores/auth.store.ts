import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { connectSocket, disconnectSocket } from '@/lib/socket'

export interface User {
  _id: string
  email: string
  displayName?: string
  avatarUrl?: string
  role: 'user' | 'admin'
}

interface AuthState {
  user: User | null
  accessToken: string | null
  login: (user: User, accessToken: string) => void
  logout: () => void
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      login: (user, accessToken) => {
        set({ user, accessToken })
        connectSocket(accessToken)
      },

      logout: () => {
        disconnectSocket()
        set({ user: null, accessToken: null })
      },

      setAccessToken: (token) => set({ accessToken: token }),

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-store',
      // Chỉ persist user, KHÔNG persist accessToken
      partialize: (state) => ({ user: state.user }),
    }
  )
)
