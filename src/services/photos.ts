import { ReportPhoto } from '@/src/types';
import api from './api';

export const photosService = {
    upload: async (
        postId: number,
        photos: { uri: string; name: string; type: string }[]
    ): Promise<ReportPhoto[]> => {
        const formData = new FormData();
        formData.append('post_id', String(postId));

        photos.forEach((photo) => {
            formData.append('photos', {
                uri: photo.uri,
                name: photo.name || 'photo.jpg',
                type: photo.type || 'image/jpeg',
            } as any);
        });

        const { data } = await api.post<ReportPhoto[]>(
            '/posts/photos/upload/',
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
            }
        );
        return data;
    },

    delete: async (photoId: number): Promise<void> => {
        await api.delete(`/posts/photos/${photoId}/`);
    },
};
