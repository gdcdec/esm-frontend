import { GallerySheet } from '@/src/components/InlineGallery';
import { Button, Input } from '@/src/components/ui';
import { useThemeStore } from '@/src/store/themeStore';
import { router, useLocalSearchParams } from 'expo-router';
import { ImagePlus, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddressInput } from './components/AddressInput';
import { CategorySelector } from './components/CategorySelector';
import { PhotoUploader } from './components/PhotoUploader';
import { useReportForm } from './hooks/useReportForm';

export default function CreateReportScreen() {
  const params = useLocalSearchParams<{ editId?: string; draftId?: string }>();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const insets = useSafeAreaInsets();
  const [galleryOpen, setGalleryOpen] = useState(false);

  const [formState, formActions] = useReportForm();

  const isEditMode = !!params.editId;
  const isDraftMode = !!params.draftId;

  const getTitleText = () => {
    if (isEditMode) return 'Редактирование';
    if (isDraftMode) return 'Редактирование черновика';
    return 'Новая заявка';
  };

  const getSubmitButtonText = () => {
    if (formState.isSubmitting) {
      if (isEditMode) return 'Сохранение...';
      return 'Отправка...';
    }
    if (isEditMode) return 'Сохранить изменения';
    if (isDraftMode) return 'Отправить черновик';
    return 'Отправить';
  };

  const handleWebPhotoPick = () => {
    // Web photo picking is handled differently
    formActions.pickFromGallery();
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <SafeAreaView edges={['top']} className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity 
            onPress={() => {
              const shouldStay = formActions.handleClose();
              if (!shouldStay) {
                router.back();
              }
            }} 
            className="p-2 -ml-2 rounded-full"
          >
            <X size={24} color={isDarkMode ? '#F3F4F6' : '#111827'} />
          </TouchableOpacity>
          <Text className="font-bold text-lg dark:text-gray-100">{getTitleText()}</Text>
          <View className="w-8" />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView className="flex-1 p-5" keyboardShouldPersistTaps="handled">
          {formState.isFetchingInitial && (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          )}

          {!formState.isFetchingInitial && (
            <>
              <Text className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">1. Что случилось?</Text>
              <CategorySelector
                selectedCategory={formState.category}
                onSelectCategory={formActions.setCategory}
              />

              <Text className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">2. Детали</Text>
              <Input placeholder="Краткое название" value={formState.title} onChangeText={formActions.setTitle} />

              <AddressInput
                address={formState.address}
                onChangeAddress={(text) => {
                  formActions.setAddress(text);
                }}
                suggestions={formState.suggestions}
                isSearching={formState.isSearching}
                onSelectSuggestion={formActions.handleSelectAddress}
              />

              <Input
                placeholder="Подробное описание..."
                multiline
                value={formState.description}
                onChangeText={formActions.setDescription}
              />

              <Text className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
                3. Фотографии{' '}
                {formState.photos.length > 0 && (
                  <Text className="text-gray-400 dark:text-gray-500 font-normal">
                    ({formState.photos.length}/5)
                  </Text>
                )}
              </Text>

              <PhotoUploader
                photos={formState.photos}
                existingPhotos={formState.existingPhotos}
                maxPhotos={5}
                onRemovePhoto={formActions.removePhoto}
                onAddPhoto={Platform.OS === 'web' ? handleWebPhotoPick : () => setGalleryOpen(true)}
              />

              {formState.photos.length < 5 && Platform.OS === 'web' && (
                <TouchableOpacity
                  onPress={handleWebPhotoPick}
                  className="w-full h-28 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 items-center justify-center"
                >
                  <ImagePlus size={28} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
                  <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2">Выбрать файл</Text>
                  <Text className="text-xs text-gray-300 dark:text-gray-600 mt-1">JPG, PNG, WebP · до 10 МБ</Text>
                </TouchableOpacity>
              )}

              {formState.formError && (
                <View className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <Text className="text-red-600 dark:text-red-400 text-sm">{formState.formError}</Text>
                </View>
              )}

              <View className="h-20" />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <SafeAreaView edges={['bottom']} className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-3">
        <Button
          title={getSubmitButtonText()}
          onPress={formActions.handleSubmit}
          disabled={formState.isSubmitting || formState.isFetchingInitial}
        />
      </SafeAreaView>

      {Platform.OS !== 'web' && galleryOpen && (
        <GallerySheet
          visible={galleryOpen}
          selected={formState.photos}
          maxPhotos={5}
          onSelectionChange={(photos) => {
            formActions.setPhotos(photos);
          }}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </View>
  );
}
