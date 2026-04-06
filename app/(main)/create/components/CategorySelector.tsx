import { useRubricsStore } from '@/src/store/rubricsStore';
import { useThemeStore } from '@/src/store/themeStore';
import React from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface CategorySelectorProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
}

export function CategorySelector({ selectedCategory, onSelectCategory }: CategorySelectorProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const rubrics = useRubricsStore((s) => s.rubrics);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5 mb-6">
      {rubrics.length === 0 ? (
        <View className="py-4 px-8">
          <ActivityIndicator size="small" color={isDarkMode ? '#60A5FA' : '#2563EB'} />
        </View>
      ) : (
        rubrics.map((rub) => (
          <TouchableOpacity
            key={rub.name}
            onPress={() => onSelectCategory(rub.name)}
            className={`w-20 items-center p-3 rounded-xl border mr-3 ${
              selectedCategory === rub.name
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                : 'bg-gray-50 dark:bg-gray-800 border-transparent'
            }`}
          >
            <View className="w-10 h-10 rounded-full items-center justify-center mb-2 overflow-hidden bg-gray-200 dark:bg-gray-700">
              {rub.photoUrl ? (
                <Image source={{ uri: rub.photoUrl }} style={{ width: 28, height: 28 }} resizeMode="contain" />
              ) : (
                <Text className="text-xl">📋</Text>
              )}
            </View>
            <Text
              className={`text-xs font-medium text-center ${
                selectedCategory === rub.name ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-300'
              }`}
              numberOfLines={1}
            >
              {rub.name}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}
