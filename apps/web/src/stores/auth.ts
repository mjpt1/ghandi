'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAccessToken } from '@/lib/api';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  setAuth: (t: { accessToken: string; refreshToken: string; role: UserRole }) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      role: null,
      setAuth: ({ accessToken, refreshToken, role }) => {
        setAccessToken(accessToken);
        set({ accessToken, refreshToken, role });
      },
      logout: () => {
        setAccessToken(null);
        set({ accessToken: null, refreshToken: null, role: null });
      },
    }),
    {
      name: 'glucia-auth',
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setAccessToken(state.accessToken);
      },
    },
  ),
);

/** مسیر پیش‌فرض هر نقش بعد از ورود */
export const homeOf = (role: UserRole): string =>
  role === 'DOCTOR' ? '/doctor' : role === 'ADMIN' ? '/admin' : '/dashboard';
