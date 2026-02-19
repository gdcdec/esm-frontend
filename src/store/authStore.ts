import { User } from '@/src/types';
import { create } from 'zustand';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    setUser: (user: User) => void;
    setToken: (token: string) => void;
    login: (user: User, token: string) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,

    setUser: (user) => set({ user }),
    setToken: (token) => set({ token }),

    login: (user, token) =>
        set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
        }),

    logout: () =>
        set({
            user: null,
            token: null,
            isAuthenticated: false,
        }),

    setLoading: (isLoading) => set({ isLoading }),
}));
