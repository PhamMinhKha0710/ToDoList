import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/user";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isSocketInitialized: boolean;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  setSocketInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isSocketInitialized: false,

      login: (user, accessToken) => {
        set({ user, accessToken });
      },

      logout: () => {
        set({ user: null, accessToken: null, isSocketInitialized: false });
      },

      setAccessToken: (token) => set({ accessToken: token }),

      setUser: (user) => set({ user }),

      setSocketInitialized: (val) => set({ isSocketInitialized: val }),
    }),
    {
      name: "auth-store",
      // Chỉ persist user, KHÔNG persist accessToken hoặc isSocketInitialized
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
