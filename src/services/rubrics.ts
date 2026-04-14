import api from './api';

export interface ApiRubric {
    name: string;
    counter: number;
    photo: string | null;
    photo_url: string | null;
}

export const rubricsService = {
    getAll: async (): Promise<ApiRubric[]> => {
        const { data } = await api.get<ApiRubric[]>('/rubrics/');
        return data;
    },
};
