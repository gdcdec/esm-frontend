import { ReportPhoto } from '@/src/types';
import { Platform } from 'react-native';
import api from './api';

export const photosService = {
    upload: async (
        postId: number,
        photos: { uri: string; name: string; type: string }[]
    ): Promise<ReportPhoto[]> => {
        const formData = new FormData();
        formData.append('post_id', String(postId));

        for (const photo of photos) {
            if (Platform.OS === 'web') {
                const response = await fetch(photo.uri);
                const blob = await response.blob();
                const file = new File(
                    [blob],
                    photo.name || 'photo.jpg',
                    { type: photo.type || 'image/jpeg' }
                );
                formData.append('photos', file);
            } else {
                formData.append('photos', {
                    uri: photo.uri,
                    name: photo.name || 'photo.jpg',
                    type: photo.type || 'image/jpeg',
                } as any);
            }
        }

        const { data } = await api.post<ReportPhoto[]>(
            '/posts/photos/upload/',
            formData,
            {
                headers: { 'Content-Type': undefined },
            }
        );
        return data;
    },

    delete: async (photoId: number): Promise<void> => {
        await api.delete(`/posts/photos/${photoId}/`);
    },
};
