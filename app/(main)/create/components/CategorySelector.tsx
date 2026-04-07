import { useRubricsStore } from '@/src/store/rubricsStore';
import { useThemeStore } from '@/src/store/themeStore';
import { ChevronRight } from 'lucide-react-native';
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
    <View className="py-3">
      {rubrics.length === 0 ? (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color={isDarkMode ? '#60A5FA' : '#2563EB'} />
        </View>
      ) : (
        <View className="relative">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={{ paddingHorizontal: 12 }}
            snapToInterval={92}
            decelerationRate="fast"
          >
            {rubrics.map((rub) => (
              <TouchableOpacity
                key={rub.name}
                onPress={() => onSelectCategory(rub.name)}
                className={`items-center p-3 rounded-xl border mr-3 min-w-[80px] ${
                  selectedCategory === rub.name
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                }`}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center mb-2 overflow-hidden bg-white dark:bg-gray-700 shadow-sm">
                  {rub.photoUrl ? (
                    <Image source={{ uri: rub.photoUrl }} style={{ width: 24, height: 24 }} resizeMode="contain" />
                  ) : (
                    <Text className="text-lg">📋</Text>
                  )}
                </View>
                <Text
                  className={`text-xs font-medium text-center ${
                    selectedCategory === rub.name ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-100'
                  }`}
                  numberOfLines={2}
                  style={{ maxWidth: 70 }}
                >
                  {rub.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Индикатор что можно листать */}
          {rubrics.length > 3 && (
            <View className="absolute right-0 top-0 bottom-0 justify-center px-1">
              <View className="w-6 h-6 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-sm items-center justify-center">
                <ChevronRight size={14} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
