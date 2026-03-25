import { AddressReverseResponse, AddressSearchResult } from '@/src/types';
import api from './api';

export const addressService = {
    reverse: async (
        lat: number,
        lon: number
    ): Promise<AddressReverseResponse> => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ru`, {
                headers: {
                    'User-Agent': 'MoyDonosApp/1.0 (Contact: support@moydonos.ru)'
                }
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`HTTP error! status: ${res.status}. ${text.substring(0, 50)}`);
            }
            const data = await res.json();

            return {
                in_working_area: true, // Always true or map bounding handles it
                address: data.display_name || 'Неизвестный адрес',
                latitude: lat,
                longitude: lon,
                city: data.address?.city || data.address?.town || data.address?.village || '',
                street: data.address?.road || '',
                house: data.address?.house_number || ''
            };
        } catch (error) {
            console.warn('Nominatim reverse error:', error);
            // Fallback to old proxy if nominatim fails to avoid breaking
            const { data } = await api.post<AddressReverseResponse>(
                '/address/reverse/',
                { lat, lon }
            );
            return data;
        }
    },

    search: async (
        query: string,
        limit: number = 5
    ): Promise<AddressSearchResult[]> => {
        try {
            const { data } = await api.get<AddressSearchResult[]>(
                '/address/search/',
                { params: { q: query, limit } }
            );
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.warn('Address search error:', error);
            return [];
        }
    },
};
