import { CreateReportPayload, Report } from '@/src/types';
import api from './api';

export const reportsService = {
    /**
     * Get all published posts.
     * GET /api/posts/
     * Optional filters: ?address=...  ?rubric=...
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
        // Clean up parameters: remove undefined/null, handle rubrics
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
     * Get a single post by ID.
     */
    // Fetch report details by ID
    getById: async (id: number): Promise<Report> => {
        const response = await api.get(`/posts/${id}/`);
        return response.data;
    },

    // Export report document text
    export: async (id: number): Promise<{ letter: string; message: string }> => {
        const response = await api.get(`/posts/${id}/?doc=1`);
        return response.data;
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
        const { data } = await api.patch<Report>(`/posts/${id}/`, payload);
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
