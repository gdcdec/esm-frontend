import { CreateReportPayload, Report } from '@/src/types';
import api from './api';

export const reportsService = {
    /**
     * Получение всех опубликованных постов.
     * GET /api/posts/
     * Фильтры: ?address=... ?rubric=...
     */
    getAll: async (filters?: {
        rubrics?: string[];
        city?: string;
        state?: string;
        address?: string;
        author_id?: number;
        date_start?: string;
        date_end?: string;
        status?: string;
        ordering?: string;
    }): Promise<Report[]> => {
        // Очистка параметров: удаляем undefined/null, обрабатываем рубрики
        const cleanParams: Record<string, any> = {};

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (key === 'rubrics' && Array.isArray(value) && value.length > 0) {
                        cleanParams.rubric = value.join(',');
                    } else if (key !== 'rubrics') {
                        cleanParams[key] = value;
                    }
                }
            });
        }

        const { data } = await api.get<Report[]>('/posts/', {
            params: cleanParams,
        });
        return data;
    },

    /**
     * Получение поста по ID.
     */
    getById: async (id: number): Promise<Report> => {
        const response = await api.get(`/posts/${id}/`);
        return response.data;
    },

    /**
     * Экспорт документа жалобы в текстовом формате.
     */
    export: async (id: number): Promise<{ letter: string; message: string }> => {
        const response = await api.get(`/posts/${id}/?doc=1`);
        return response.data;
    },

    /**
     * Создание нового поста.
     * POST /api/posts/
     */
    create: async (payload: CreateReportPayload): Promise<Report> => {
        const { data } = await api.post<Report>('/posts/', payload);
        return data;
    },

    /**
     * Обновление существующего поста.
     * PUT /api/posts/<id>/
     */
    update: async (
        id: number,
        payload: Partial<CreateReportPayload>
    ): Promise<Report> => {
        const { data } = await api.patch<Report>(`/posts/${id}/`, payload);
        return data;
    },

    /** 
     * like: async (id: number): Promise<void> => {
        await api.post(`/reports/${id}/like/`); 
    */

    /**
     * Удаление поста.
     * DELETE /api/posts/<id>/
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/posts/${id}/`);
    },

    /**
     * Получение постов конкретного пользователя.
     * GET /api/users/<user_id>/posts/
     */
    getByUser: async (userId: number, filters?: {
        rubric?: string;
        address?: string;
        status?: string;
    }): Promise<Report[]> => {
        const { data } = await api.get<Report[]>(
            `/users/${userId}/posts/`,
            { params: filters }
        );
        return data;
    },

    /**
     * Получение своих постов (включая черновики).
     * GET /api/posts/?self=1
     */
    getMine: async (): Promise<Report[]> => {
        const { data } = await api.get<Report[]>('/posts/', {
            params: { self: '1' },
        });
        return data;
    },
};
