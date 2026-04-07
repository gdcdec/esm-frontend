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
    formActions.pickFromGallery();
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
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
            <X size={24} color={isDarkMode ? '#F9FAFB' : '#111827'} />
          </TouchableOpacity>
          <Text className="font-bold text-lg dark:text-gray-100">{getTitleText()}</Text>
          <View className="w-8" />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="w-full max-w-lg self-center pt-4">
            {formState.isFetchingInitial && (
              <View className="py-20 items-center">
                <ActivityIndicator size="large" color="#2563EB" />
              </View>
            )}

            {!formState.isFetchingInitial && (
              <>
                {/* Section: Category */}
                <View className="mb-1 px-6">
                  <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Категория
                  </Text>
                </View>
                <View className="bg-white dark:bg-gray-800 border-y border-gray-100 dark:border-gray-800 rounded-2xl mb-6 overflow-hidden">
                  <CategorySelector
                    selectedCategory={formState.category}
                    onSelectCategory={formActions.setCategory}
                  />
                </View>

                {/* Section: Details */}
                <View className="mb-1 px-6">
                  <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Детали заявки
                  </Text>
                </View>
                <View className="bg-white dark:bg-gray-800 px-6 py-4 border-y border-gray-100 dark:border-gray-800 rounded-2xl mb-6">
                  <Input 
                    label="Краткое название"
                    placeholder="Например: Яма на дороге"
                    value={formState.title} 
                    onChangeText={formActions.setTitle} 
                  />

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
                    label="Описание"
                    placeholder="Подробно опишите проблему..."
                    multiline
                    value={formState.description}
                    onChangeText={formActions.setDescription}
                  />
                </View>

                {/* Section: Photos */}
                <View className="mb-1 px-6">
                  <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Фотографии {formState.photos.length > 0 && (
                      <Text className="text-gray-400 dark:text-gray-500 font-normal">
                        ({formState.photos.length + formState.existingPhotos.length}/5)
                      </Text>
                    )}
                  </Text>
                </View>
                <View className="bg-white dark:bg-gray-800 px-6 py-4 border-y border-gray-100 dark:border-gray-800 rounded-2xl mb-6">
                  <PhotoUploader
                    photos={formState.photos}
                    existingPhotos={formState.existingPhotos}
                    maxPhotos={5}
                    onRemovePhoto={formActions.removePhoto}
                    onAddPhoto={Platform.OS === 'web' ? handleWebPhotoPick : () => setGalleryOpen(true)}
                  />

                  {formState.photos.length + formState.existingPhotos.length < 5 && Platform.OS === 'web' && (
                    <TouchableOpacity
                      onPress={handleWebPhotoPick}
                      className="w-full h-28 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 items-center justify-center mt-2"
                    >
                      <ImagePlus size={28} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
                      <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2">Выбрать файл</Text>
                      <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG, PNG, WebP · до 10 МБ</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {formState.formError && (
                  <View className="mx-6 mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <Text className="text-red-600 dark:text-red-400 text-sm">{formState.formError}</Text>
                  </View>
                )}

                <View className="h-8" />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SafeAreaView edges={['bottom']} className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-3">
        <View className="w-full max-w-lg self-center">
          <Button
            title={getSubmitButtonText()}
            onPress={formActions.handleSubmit}
            disabled={formState.isSubmitting || formState.isFetchingInitial}
          />
        </View>
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
