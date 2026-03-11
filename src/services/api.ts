import { useAuthStore } from '@/src/store/authStore';
import axios from 'axios';

// Base URL
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://109.120.135.24:8000/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const url = error.config?.url || '';
            if (!url.includes('/auth/')) {
                useAuthStore.getState().logout();
            }
        }
        return Promise.reject(error);
    }
);

export default api;
