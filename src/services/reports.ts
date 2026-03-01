import { CreateReportPayload, Report } from '@/src/types';
import api from './api';

export const reportsService = {
    /**
     * Get all published posts.
     * GET /api/posts/
     * Optional filters: ?address=...  ?rubric=...
     */
    getAll: async (filters?: {
        address?: string;
        rubric?: string;
    }): Promise<Report[]> => {
        const { data } = await api.get<Report[]>('/posts/', {
            params: filters,
        });
        return data;
    },

    /**
     * Get a single post by ID.
     * GET /api/posts/<id>/
     */
    getById: async (id: number): Promise<Report> => {
        const { data } = await api.get<Report>(`/posts/${id}/`);
        return data;
    },

    /**
     * Create a new post.
     * POST /api/posts/
     */
    create: async (payload: CreateReportPayload): Promise<Report> => {
        const { data } = await api.post<Report>('/posts/', payload);
        return data;
    },

    /**
     * Update an existing post.
     * PUT /api/posts/<id>/
     */
    update: async (
        id: number,
        payload: Partial<CreateReportPayload>
    ): Promise<Report> => {
        const { data } = await api.put<Report>(`/posts/${id}/`, payload);
        return data;
    },

    /** 
     * like: async (id: number): Promise<void> => {
        await api.post(`/reports/${id}/like/`); 
    */

    /**
     * Delete a post.
     * DELETE /api/posts/<id>/
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/posts/${id}/`);
    },

    /**
     * Get posts for a specific user.
     * GET /api/users/<user_id>/posts/
     */
    getByUser: async (userId: number): Promise<Report[]> => {
        const { data } = await api.get<Report[]>(
            `/users/${userId}/posts/`
        );
        return data;
    },

    /**
     * Get current user's own posts (including drafts).
     * GET /api/posts/?self=1
     */
    getMine: async (): Promise<Report[]> => {
        const { data } = await api.get<Report[]>('/posts/', {
            params: { self: '1' },
        });
        return data;
    },
};
