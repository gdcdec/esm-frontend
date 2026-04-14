import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ThemeState {
    isDarkMode: boolean;
    visibilityArea: boolean;
    city: string;
    setDarkMode: (enabled: boolean) => void;
    setVisibilityArea: (enabled: boolean) => void;
    setCity: (city: string) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            isDarkMode: false,
            visibilityArea: false,
            city: 'Самара',
            setDarkMode: (enabled) => set({ isDarkMode: enabled }),
            setVisibilityArea: (enabled) => set({ visibilityArea: enabled }),
            setCity: (city) => set({ city }),
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
