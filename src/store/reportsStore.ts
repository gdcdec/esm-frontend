import { photosService } from '@/src/services/photos';
import { reportsService } from '@/src/services/reports';
import { Report } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ReportsFilters {
    rubrics?: string[];
    city?: string;
    state?: string;
    address?: string;
    author_id?: number;
    date_start?: string;
    date_end?: string;
    status?: string;
    ordering?: string;
}

export interface DraftReport {
    localId: string;
    title: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    rubric: string | null;
    /** Base64 or file URI strings for photos */
    photoUris: string[];
    createdAt: number;
}

interface ReportsState {
    /** Cached feed reports (map / feed) */
    feedReports: Report[];
    /** Cached user's own reports (profile) */
    myReports: Report[];
    /** Offline drafts waiting to be synced */
    drafts: DraftReport[];
    /** Loading flags */
    isFeedLoading: boolean;
    isMyLoading: boolean;
    /** Timestamp of last successful fetch */
    feedUpdatedAt: number | null;
    myUpdatedAt: number | null;

    /** Fetch feed reports (with optional filters), cache result */
    fetchFeed: (filters?: ReportsFilters) => Promise<Report[]>;
    /** Fetch current user's reports, cache result */
    fetchMine: () => Promise<Report[]>;
    /** Get a single report by ID (from cache or API) */
    getById: (id: number) => Promise<Report>;
    /** Clear all cached reports */
    clearCache: () => void;

    /** Save a draft locally */
    saveDraft: (draft: Omit<DraftReport, 'localId' | 'createdAt'>) => void;
    /** Remove a draft by localId */
    removeDraft: (localId: string) => void;
    /** Try to send all pending drafts to server */
    syncDrafts: () => Promise<void>;
}

export const useReportsStore = create<ReportsState>()(
    persist(
        (set, get) => ({
            feedReports: [],
            myReports: [],
            drafts: [],
            isFeedLoading: false,
            isMyLoading: false,
            feedUpdatedAt: null,
            myUpdatedAt: null,

            fetchFeed: async (filters) => {
                set({ isFeedLoading: true });
                try {
                    const data = await reportsService.getAll(filters);
                    // Backend doesn't return 'status' in list - fetch details for each report
                    const reportsWithStatus = await Promise.all(
                        data.map(async (report) => {
                            try {
                                const details = await reportsService.getById(report.id);
                                return { ...report, status: details.status } as any;
                            } catch {
                                return { ...report, status: 'check' } as any;
                            }
                        })
                    );
                    set({
                        feedReports: reportsWithStatus as Report[],
                        isFeedLoading: false,
                        feedUpdatedAt: Date.now(),
                    });
                    return reportsWithStatus as Report[];
                } catch {
                    set({ isFeedLoading: false });
                    return get().feedReports;
                }
            },

            fetchMine: async () => {
                set({ isMyLoading: true });
                try {
                    const data = await reportsService.getMine();
                    // Backend doesn't return 'status' in list - fetch details for each report
                    const reportsWithStatus = await Promise.all(
                        data.map(async (report) => {
                            try {
                                const details = await reportsService.getById(report.id);
                                return { ...report, status: details.status } as any;
                            } catch {
                                return { ...report, status: 'check' } as any;
                            }
                        })
                    );
                    set({
                        myReports: reportsWithStatus as Report[],
                        isMyLoading: false,
                        myUpdatedAt: Date.now(),
                    });
                    return reportsWithStatus as Report[];
                } catch {
                    set({ isMyLoading: false });
                    return get().myReports;
                }
            },

            getById: async (id) => {
                const cached = [...get().feedReports, ...get().myReports].find(
                    (r) => r.id === id
                );
                try {
                    const fresh = await reportsService.getById(id);
                    return fresh;
                } catch {
                    if (cached) return cached;
                    throw new Error('Report not found and offline');
                }
            },

            clearCache: () => {
                set({
                    feedReports: [],
                    myReports: [],
                    feedUpdatedAt: null,
                    myUpdatedAt: null,
                });
            },

            saveDraft: (draft) => {
                const newDraft: DraftReport = {
                    ...draft,
                    localId: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                    createdAt: Date.now(),
                };
                set((state) => ({ drafts: [...state.drafts, newDraft] }));
            },

            removeDraft: (localId) => {
                set((state) => ({
                    drafts: state.drafts.filter((d) => d.localId !== localId),
                }));
            },

            syncDrafts: async () => {
                const { drafts, removeDraft } = get();
                if (drafts.length === 0) return;

                for (const draft of drafts) {
                    try {
                        const report = await reportsService.create({
                            title: draft.title,
                            description: draft.description,
                            address: draft.address,
                            latitude: draft.latitude,
                            longitude: draft.longitude,
                            rubric: draft.rubric ?? undefined,
                        });

                        // Upload photos if any
                        if (draft.photoUris.length > 0) {
                            try {
                                const photoFiles = draft.photoUris.map((uri, i) => ({
                                    uri,
                                    name: `draft_photo_${i}.jpg`,
                                    type: 'image/jpeg',
                                }));
                                await photosService.upload(report.id, photoFiles);
                            } catch {
                                // Photos failed but report was created — still remove draft
                            }
                        }

                        removeDraft(draft.localId);
                    } catch {
                        // Still offline or server error — keep draft for next sync
                        break;
                    }
                }
            },
        }),
        {
            name: 'reports-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                feedReports: state.feedReports,
                myReports: state.myReports,
                drafts: state.drafts,
                feedUpdatedAt: state.feedUpdatedAt,
                myUpdatedAt: state.myUpdatedAt,
            }),
        }
    )
);
