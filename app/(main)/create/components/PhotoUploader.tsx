import { useThemeStore } from '@/src/store/themeStore';
import { SelectedPhoto } from '@/src/components/InlineGallery';
import { ReportPhoto } from '@/src/types';
import { Trash2 } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View, Platform } from 'react-native';

interface PhotoUploaderProps {
  photos: SelectedPhoto[];
  existingPhotos: ReportPhoto[];
  maxPhotos: number;
  onRemovePhoto: (index: number, isExisting: boolean) => void;
  onAddPhoto: () => void;
}

export function PhotoUploader({ photos, existingPhotos, maxPhotos, onRemovePhoto, onAddPhoto }: PhotoUploaderProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const totalPhotos = photos.length + existingPhotos.length;

  return (
    <>
      {(photos.length > 0 || existingPhotos.length > 0) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
          style={{ overflow: 'visible' }}
          contentContainerStyle={{ paddingTop: 8, paddingRight: 8 }}
        >
          {existingPhotos.map((photo, i) => (
            <View
              key={`existing-${photo.id}`}
              className="relative mr-3"
              style={{ width: 100, height: 100, overflow: 'visible' }}
            >
              <Image
                source={{ uri: photo.photo_url }}
                className="w-full h-full rounded-xl opacity-80"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => onRemovePhoto(i, true)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 3,
                }}
              >
                <Trash2 size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {photos.map((photo, i) => (
            <View key={photo.uri} className="relative mr-3" style={{ width: 100, height: 100, overflow: 'visible' }}>
              <Image source={{ uri: photo.uri }} className="w-full h-full rounded-xl" resizeMode="cover" />
              <TouchableOpacity
                onPress={() => onRemovePhoto(i, false)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 3,
                }}
              >
                <Trash2 size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {totalPhotos < maxPhotos && Platform.OS !== 'web' && (
        <TouchableOpacity
          onPress={onAddPhoto}
          className="flex-row items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
        >
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-300">Добавить фото</Text>
        </TouchableOpacity>
      )}
    </>
  );
}
