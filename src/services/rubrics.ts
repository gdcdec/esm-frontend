import api from './api';

export interface Rubric {
    name: string;
    counter: number;
    photo: string | null;
    photo_url: string | null;
}

export const rubricsService = {
    getAll: async (): Promise<Rubric[]> => {
        const { data } = await api.get<Rubric[]>('/rubrics/');
        return data;
    },
};
