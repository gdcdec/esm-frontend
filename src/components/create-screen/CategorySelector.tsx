import { useRubricsStore } from '@/src/store/rubricsStore';
import { useThemeStore } from '@/src/store/themeStore';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const ITEM_WIDTH = 92;
const SCROLL_AMOUNT = ITEM_WIDTH * 2;

interface CategorySelectorProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
}

export function CategorySelector({ selectedCategory, onSelectCategory }: CategorySelectorProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const rubrics = useRubricsStore((s) => s.rubrics);
  const scrollRef = useRef<ScrollView>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollX = useRef(0);
  const contentWidth = useRef(0);
  const containerWidth = useRef(0);

  const updateArrows = useCallback(() => {
    setCanScrollLeft(scrollX.current > 4);
    setCanScrollRight(scrollX.current < contentWidth.current - containerWidth.current - 4);
  }, []);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.current = e.nativeEvent.contentOffset.x;
    containerWidth.current = e.nativeEvent.layoutMeasurement.width;
    contentWidth.current = e.nativeEvent.contentSize.width;
    updateArrows();
  }, [updateArrows]);

  const scrollLeft = useCallback(() => {
    const newX = Math.max(0, scrollX.current - SCROLL_AMOUNT);
    scrollRef.current?.scrollTo({ x: newX, animated: true });
  }, []);

  const scrollRight = useCallback(() => {
    const maxX = contentWidth.current - containerWidth.current;
    const newX = Math.min(maxX, scrollX.current + SCROLL_AMOUNT);
    scrollRef.current?.scrollTo({ x: newX, animated: true });
  }, []);

  const isWeb = Platform.OS === 'web';

  return (
    <View className="py-3">
      {rubrics.length === 0 ? (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color={isDarkMode ? '#60A5FA' : '#2563EB'} />
        </View>
      ) : (
        <View className="relative">
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12 }}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={(w) => { contentWidth.current = w; updateArrows(); }}
            onLayout={(e) => { containerWidth.current = e.nativeEvent.layout.width; updateArrows(); }}
            {...(isWeb ? { style: { scrollbarWidth: 'none', msOverflowStyle: 'none' } as any } : {})}
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

          {/* Left arrow */}
          {canScrollLeft && (
            <TouchableOpacity
              onPress={scrollLeft}
              className="absolute left-1 top-0 bottom-0 justify-center"
              style={{ zIndex: 10 }}
            >
              <View
                className="w-7 h-7 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(31,41,55,0.92)' : 'rgba(255,255,255,0.92)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: 3,
                }}
              >
                <ChevronLeft size={16} color={isDarkMode ? '#D1D5DB' : '#374151'} />
              </View>
            </TouchableOpacity>
          )}

          {/* Right arrow */}
          {canScrollRight && (
            <TouchableOpacity
              onPress={scrollRight}
              className="absolute right-1 top-0 bottom-0 justify-center"
              style={{ zIndex: 10 }}
            >
              <View
                className="w-7 h-7 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(31,41,55,0.92)' : 'rgba(255,255,255,0.92)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: 3,
                }}
              >
                <ChevronRight size={16} color={isDarkMode ? '#D1D5DB' : '#374151'} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
