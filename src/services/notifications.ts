import { Notification, NotificationsResponse } from '@/src/types';
import api from './api';

export const notificationsService = {
    /**
     * Get all notifications for the current user.
     * GET /api/notifications/
     * Optional filters: ?is_read=false  ?notification_type=info  ?limit=50
     */
    getAll: async (filters?: {
        is_read?: boolean;
        notification_type?: string;
        limit?: number;
    }): Promise<NotificationsResponse> => {
        const params: Record<string, any> = {};
        if (filters) {
            if (filters.is_read !== undefined) {
                params.is_read = filters.is_read ? 'true' : 'false';
            }
            if (filters.notification_type) {
                params.notification_type = filters.notification_type;
            }
            if (filters.limit !== undefined) {
                params.limit = filters.limit;
            }
        }
        const { data } = await api.get<NotificationsResponse>('/notifications/', { params });
        return data;
    },

    /**
     * Get a single notification by ID.
     * GET /api/notifications/<id>/
     */
    getById: async (id: number): Promise<Notification> => {
        const { data } = await api.get<Notification>(`/notifications/${id}/`);
        return data;
    },

    /**
     * Mark a single notification as read.
     * PATCH /api/notifications/<id>/
     */
    markAsRead: async (id: number): Promise<Notification> => {
        const { data } = await api.patch<Notification>(`/notifications/${id}/`, {
            is_read: true,
        });
        return data;
    },

    /**
     * Mark all notifications as read.
     * POST /api/notifications/mark-read/
     */
    markAllAsRead: async (): Promise<{ message: string; marked_count: number }> => {
        const { data } = await api.post('/notifications/mark-read/', {
            mark_all: true,
        });
        return data;
    },

    /**
     * Mark specific notifications as read by IDs.
     * POST /api/notifications/mark-read/
     */
    markMultipleAsRead: async (ids: number[]): Promise<{ message: string; marked_count: number }> => {
        const { data } = await api.post('/notifications/mark-read/', {
            notification_ids: ids,
        });
        return data;
    },

    /**
     * Get unread notifications count.
     * GET /api/notifications/unread-count/
     */
    getUnreadCount: async (): Promise<number> => {
        const { data } = await api.get<{ unread_count: number }>('/notifications/unread-count/');
        return data.unread_count;
    },
};
