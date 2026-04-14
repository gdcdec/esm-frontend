import { User } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    _hasHydrated: boolean;

    setUser: (user: User) => void;
    setToken: (token: string) => void;
    login: (user: User, token: string) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
    setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,
            _hasHydrated: false,

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
            setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
                state?.setLoading(false);
            },
        }
    )
);
