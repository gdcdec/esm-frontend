import { rubricsService } from '@/src/services/rubrics';
import { Rubric } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const RUBRIC_PALETTE = [
    '#EF4444',
    '#10B981',
    '#F97316',
    '#8B5CF6',
    '#EC4899',
    '#a86b42',
    '#b8fff7',
    '#3B82F6',
    '#191a3fff',
    '#005a69ff',
    '#A855F7',
    '#F43F5E',
];

function getRubricColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return RUBRIC_PALETTE[Math.abs(hash) % RUBRIC_PALETTE.length];
}

interface RubricsState {
    rubrics: Rubric[];
    isLoaded: boolean;
    fetchRubrics: () => Promise<void>;
    getRubric: (name: string | null | undefined) => Rubric | undefined;
}

export const useRubricsStore = create<RubricsState>()(
    persist(
        (set, get) => ({
            rubrics: [],
            isLoaded: false,

            fetchRubrics: async () => {
                try {
                    const data = await rubricsService.getAll();
                    const mapped: Rubric[] = data.map((r) => ({
                        name: r.name,
                        color: getRubricColor(r.name),
                        photoUrl: r.photo || r.photo_url || undefined,
                    }));
                    if (mapped.length > 0) {
                        set({ rubrics: mapped, isLoaded: true });
                    }
                } catch {
                    set({ isLoaded: true });
                }
            },

            getRubric: (name) => {
                if (!name) return undefined;
                return get().rubrics.find((c) => c.name === name);
            },
        }),
        {
            name: 'rubrics-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                rubrics: state.rubrics,
                isLoaded: state.isLoaded,
            }),
        }
    )
);
