import api from './api';

interface LoginResponse {
    access: string;
    refresh: string;
    user: {
        id: number;
        name: string;
        email: string;
        level: number;
        xp: number;
        next_level_xp: number;
    };
}

interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}

export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const { data } = await api.post<LoginResponse>('/auth/login/', { email, password });
        return data;
    },

    register: async (payload: RegisterPayload): Promise<LoginResponse> => {
        const { data } = await api.post<LoginResponse>('/auth/register/', payload);
        return data;
    },

    refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
        const { data } = await api.post<{ access: string }>('/auth/token/refresh/', {
            refresh: refreshToken,
        });
        return data;
    },
};
