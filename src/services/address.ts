import { AddressReverseResponse, AddressSearchResult } from '@/src/types';
import api from './api';

export const addressService = {
    reverse: async (
        lat: number,
        lon: number
    ): Promise<AddressReverseResponse> => {
        const { data } = await api.post<AddressReverseResponse>(
            '/address/reverse/',
            { lat, lon }
        );
        return data;
    },

    search: async (
        query: string,
        limit: number = 5
    ): Promise<AddressSearchResult[]> => {
        const { data } = await api.get<AddressSearchResult[]>(
            '/address/search/',
            { params: { q: query, limit } }
        );
        return data;
    },
};
