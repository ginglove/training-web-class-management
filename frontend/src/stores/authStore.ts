import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'APPROVER' | 'REVIEWER' | 'CREATOR';
  department: string | null;
  phone?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, refreshToken?: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (user, token, refreshToken) => set({ user, token, refreshToken: refreshToken || null, isAuthenticated: true }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      updateUser: (newUser) => set((state) => ({ 
        user: state.user ? { ...state.user, ...newUser } : null 
      })),
      logout: () => set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
    }
  )
);
