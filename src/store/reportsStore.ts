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
    status: 'draft';
    photoUris: string[];
    createdAt: number;
    serverId?: number;
}

interface ReportsState {
    feedReports: Report[];
    myReports: Report[];
    drafts: DraftReport[];
    isFeedLoading: boolean;
    isMyLoading: boolean;
    feedUpdatedAt: number | null;
    myUpdatedAt: number | null;

    fetchFeed: (filters?: ReportsFilters) => Promise<Report[]>;
    fetchMine: () => Promise<Report[]>;
    getById: (id: number) => Promise<Report>;
    clearCache: () => void;

    saveDraft: (draft: Omit<DraftReport, 'localId' | 'createdAt' | 'status'>) => void;
    removeDraft: (localId: string) => void;
    getDraft: (localId: string) => DraftReport | undefined;
    updateDraft: (localId: string, draft: Partial<Omit<DraftReport, 'localId' | 'createdAt' | 'status'>>) => void;
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
    // Отделяем фильтр рубрик для клиентской фильтрации
                    const { rubrics, ...apiFilters } = filters || {};

                    const data = await reportsService.getAll(apiFilters);

    // Клиентская фильтрация: в ленте только опубликованные и архивные
                    let filteredReports = data;

                    if (rubrics && rubrics.length > 0) {
                        filteredReports = data.filter(report =>
                            report.rubric_name && rubrics.includes(report.rubric_name)
                        );
                    }

    // Клиентская сортировка по дате создания
                    const sortedReports = filteredReports.sort((a, b) => {
                        const dateA = new Date(a.created_at || 0).getTime();
                        const dateB = new Date(b.created_at || 0).getTime();
            // Фото загружаются первыми как основные (-created_at)
                        const ordering = filters?.ordering || '-created_at';
                        if (ordering === 'created_at') {
                            return dateA - dateB; // Сначала старые
                        }
                        return dateB - dateA; // Сначала новые
                    });

                    set({
                        feedReports: sortedReports,
                        isFeedLoading: false,
                        feedUpdatedAt: Date.now(),
                    });
                    return sortedReports;
                } catch {
                    set({ isFeedLoading: false });
                    return get().feedReports;
                }
            },

            fetchMine: async () => {
                set({ isMyLoading: true });
                try {
                    const data = await reportsService.getMine();
                    set({
                        myReports: data,
                        isMyLoading: false,
                        myUpdatedAt: Date.now(),
                    });
                    return data;
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
                    status: 'draft',
                    localId: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                    createdAt: Date.now(),
                };
                set((state) => ({ drafts: [...state.drafts, newDraft] }));
            },

            removeDraft: async (localId) => {
                const draft = get().drafts.find((d) => d.localId === localId);
                // Удаление черновика с сервера, если он был синхронизирован
                if (draft?.serverId) {
                    try {
                        await reportsService.delete(draft.serverId);
                    } catch (err) {
                        console.warn('Failed to delete draft from server:', err);
                    }
                }
                set((state) => ({
                    drafts: state.drafts.filter((d) => d.localId !== localId),
                }));
            },

            getDraft: (localId) => {
                return get().drafts.find((d) => d.localId === localId);
            },

            updateDraft: (localId, draft) => {
                set((state) => ({
                    drafts: state.drafts.map((d) =>
                        d.localId === localId ? { ...d, ...draft } : d
                    ),
                }));
            },

            syncDrafts: async () => {
                const { drafts } = get();
                if (drafts.length === 0) return;

                for (const draft of drafts) {
                    try {
                        const safeTitle = draft.title && draft.title.length >= 5
                            ? draft.title
                            : (draft.title || 'Без названия').padEnd(5, ' ');

                        const safeDescription = draft.description && draft.description.trim().length >= 10
                            ? draft.description
                            : (draft.description || 'Нет описания').padEnd(10, '.');

                        const report = await reportsService.create({
                            title: safeTitle,
                            description: safeDescription,
                            address: draft.address,
                            latitude: draft.latitude,
                            longitude: draft.longitude,
                            rubric: draft.rubric || undefined,
                        });

                        // Если создано успешно и нужен статус черновика, обновляем
                        if (report.id && draft.status === 'draft') {
                            try {
                                await reportsService.update(report.id, { status: 'draft' });
                            } catch (statusErr) {
                                console.warn('Failed to set draft status:', statusErr);
                            }
                        }

                        // Загрузка фото, если есть
                        if (draft.photoUris.length > 0) {
                            try {
                                const photoFiles = draft.photoUris.map((uri, i) => ({
                                    uri,
                                    name: `draft_photo_${i}.jpg`,
                                    type: 'image/jpeg',
                                }));
                                await photosService.upload(report.id, photoFiles);
                            } catch {
                                // Фото не загрузились, но отчет создан — удаляем черновик
                            }
                        }

                        // Удаление черновика после успешной синхронизации
                        get().removeDraft(draft.localId);


                    } catch (err: any) {
                        console.error('Failed to sync draft:', err?.response?.data || err);
                        // Нет связи или ошибка сервера — сохраняем черновик для следующей синхронизации
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
