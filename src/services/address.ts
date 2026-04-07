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
                in_working_area: true,
                address: data.display_name || 'Неизвестный адрес',
                latitude: lat,
                longitude: lon,
                city: data.address?.city || data.address?.town || data.address?.village || '',
                street: data.address?.road || '',
                house: data.address?.house_number || ''
            };
        } catch (error) {
            console.warn('Nominatim reverse error:', error);
            // Запасной вариант через прокси при ошибке Nominatim
            const { data } = await api.post<AddressReverseResponse>(
                '/address/reverse/',
                { lat, lon }
            );
            return data;
        }
    },

    search: async (
        query: string,
        limit: number = 5,
        city?: string
    ): Promise<AddressSearchResult[]> => {
        try {
            const params: Record<string, string | number> = { q: query, limit };
            if (city) {
                params.city = city;
            }
            const { data } = await api.get<AddressSearchResult[]>(
                '/address/search/',
                { params }
            );
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.warn('Address search error:', error);
            return [];
        }
    },
};
