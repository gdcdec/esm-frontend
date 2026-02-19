import { Report } from '@/src/types';
import api from './api';

interface CreateReportPayload {
    title: string;
    description: string;
    address: string;
    category: string;
    latitude: number;
    longitude: number;
    image?: string;
}

export const reportsService = {
    getAll: async (): Promise<Report[]> => {
        const { data } = await api.get<Report[]>('/reports/');
        return data;
    },

    getById: async (id: number): Promise<Report> => {
        const { data } = await api.get<Report>(`/reports/${id}/`);
        return data;
    },

    create: async (payload: CreateReportPayload): Promise<Report> => {
        const { data } = await api.post<Report>('/reports/', payload);
        return data;
    },

    like: async (id: number): Promise<void> => {
        await api.post(`/reports/${id}/like/`);
    },

    getMyReports: async (): Promise<Report[]> => {
        const { data } = await api.get<Report[]>('/reports/my/');
        return data;
    },
};
