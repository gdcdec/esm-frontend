import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ThemeState {
    isDarkMode: boolean;
    fogOfWar: boolean;
    city: string;
    setDarkMode: (enabled: boolean) => void;
    setFogOfWar: (enabled: boolean) => void;
    setCity: (city: string) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            isDarkMode: false,
            fogOfWar: false,
            city: 'Самара',
            setDarkMode: (enabled) => set({ isDarkMode: enabled }),
            setFogOfWar: (enabled) => set({ fogOfWar: enabled }),
            setCity: (city) => set({ city }),
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
