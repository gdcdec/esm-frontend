import { SelectedPhoto } from '@/src/components/InlineGallery';
import { useThemeStore } from '@/src/store/themeStore';
import { ReportPhoto } from '@/src/types';
import { Camera, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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
    <View>
      {(photos.length > 0 || existingPhotos.length > 0) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ paddingVertical: 4 }}
        >
          {existingPhotos.map((photo, i) => (
            <View
              key={`existing-${photo.id}`}
              className="relative mr-3"
              style={{ width: 100, height: 100 }}
            >
              <Image
                source={{ uri: photo.photo_url }}
                className="w-full h-full rounded-xl"
                style={{ opacity: 0.85 }}
                resizeMode="cover"
              />
              <View className="absolute top-0 left-0 right-0 bottom-0 rounded-xl border border-gray-200 dark:border-gray-600" />
              <TouchableOpacity
                onPress={() => onRemovePhoto(i, true)}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full items-center justify-center"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3,
                  elevation: 4,
                }}
              >
                <Trash2 size={14} color="#fff" />
              </TouchableOpacity>
              <View className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/50 rounded-full">
                <Text className="text-[10px] text-white font-medium">Сервер</Text>
              </View>
            </View>
          ))}
          {photos.map((photo, i) => (
            <View key={photo.uri} className="relative mr-3" style={{ width: 100, height: 100 }}>
              <Image source={{ uri: photo.uri }} className="w-full h-full rounded-xl" resizeMode="cover" />
              <View className="absolute top-0 left-0 right-0 bottom-0 rounded-xl border border-gray-200 dark:border-gray-600" />
              <TouchableOpacity
                onPress={() => onRemovePhoto(i, false)}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full items-center justify-center"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3,
                  elevation: 4,
                }}
              >
                <Trash2 size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {totalPhotos < maxPhotos && Platform.OS !== 'web' && (
        <TouchableOpacity
          onPress={onAddPhoto}
          className="flex-row items-center justify-center gap-2 py-3.5 px-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-600"
        >
          <Camera size={18} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">Добавить фото</Text>
          <Text className="text-xs text-gray-400 dark:text-gray-500">({totalPhotos}/{maxPhotos})</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
