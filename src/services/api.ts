import { useAuthStore } from '@/src/store/authStore';
import axios from 'axios';
import { Platform } from 'react-native';

let BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://109.120.135.24:8000/api';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Force relative path on live deployments (Vercel) to use proxy
    if (host !== 'localhost' && !host.includes('192.168.') && !host.includes('10.')) {
        BASE_URL = '/api';
    }
}

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

// Utility to recursively fix absolute media URLs missing the port
const fixMediaUrls = (data: any): any => {
    if (typeof data === 'string') {
        if (data.startsWith('http://109.120.135.24/media/')) {
            return data.replace('http://109.120.135.24/media/', 'http://109.120.135.24:8000/media/');
        }
        return data;
    }
    if (Array.isArray(data)) {
        return data.map(item => fixMediaUrls(item));
    }
    if (data !== null && typeof data === 'object') {
        const newData: any = {};
        for (const key in data) {
            newData[key] = fixMediaUrls(data[key]);
        }
        return newData;
    }
    return data;
};

// Response interceptor: fix image URLs and handle 401
api.interceptors.response.use(
    (response) => {
        if (response.data) {
            response.data = fixMediaUrls(response.data);
        }
        return response;
    },
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
