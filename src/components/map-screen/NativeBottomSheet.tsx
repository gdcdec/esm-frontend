import { AppMapView } from '@/src/components/MapView';
import { InlineFilters } from '@/src/components/map/InlineFilters';
import { ReportDetail } from '@/src/components/map/ReportDetail';
import { ReportCard } from '@/src/components/ReportCard';
import { Button } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import { AddressSearchResult, Report } from '@/src/types';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { Clock, Locate, MapPin, Minus, Plus, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Keyboard,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CityAlert } from './CityAlert';
import { ReturnType } from './useSheetState';

interface NativeBottomSheetProps {
  state: ReturnType;
}

export function NativeBottomSheet({ state }: NativeBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const searchInputRef = useRef<TextInput>(null);
  const previousSheetIndex = useRef<number | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(() => [Math.max(insets.bottom, 16) + 70, '45%', '90%'], [insets.bottom]);

  const handleMapPress = useCallback(
    (coordinate: { latitude: number; longitude: number }) => {
      state.handleMapPress(coordinate);
      bottomSheetRef.current?.snapToIndex(0);
    },
    [state.handleMapPress]
  );

  const handleMarkerPress = useCallback(
    (clusterReports: Report[]) => {
      if (sheetIndex === 0) {
        previousSheetIndex.current = 0;
        bottomSheetRef.current?.snapToIndex(1);
      } else if (!state.singleReport && !state.activeReports) {
        previousSheetIndex.current = null;
      }
      state.handleMarkerPress(clusterReports);
    },
    [state.handleMarkerPress, sheetIndex, state.singleReport, state.activeReports]
  );

  const handleCloseDetail = useCallback(() => {
    state.handleCloseDetail();
    if (previousSheetIndex.current === 0) {
      bottomSheetRef.current?.snapToIndex(0);
    }
    previousSheetIndex.current = null;
  }, [state.handleCloseDetail]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const onBackPress = () => {
      if (searchFocused) {
        searchInputRef.current?.blur();
        Keyboard.dismiss();
        setSearchFocused(false);
        return true;
      }
      if (state.searchQuery) {
        state.setSearchQuery('');
        return true;
      }
      if (state.selectedCoord) {
        state.setSelectedCoord(null);
        state.setActiveReports(null);
        return true;
      }
      if (state.singleReport || (state.activeReports && state.activeReports.length > 1)) {
        handleCloseDetail();
        return true;
      }
      if (sheetIndex > 0) {
        bottomSheetRef.current?.snapToIndex(0);
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [state.searchQuery, state.selectedCoord, state.singleReport, state.activeReports, sheetIndex, handleCloseDetail, searchFocused]);

  const handleSelectSuggestion = useCallback((item: AddressSearchResult) => {
    state.handleSelectSuggestion(item);
    setSearchFocused(false);
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  }, [state]);

  return (
    <View className="flex-1 dark:bg-gray-900 bg-white">
      <View className="flex-1">
        <AppMapView
          ref={state.mapRef}
          reports={state.reports}
          selectedCoordinate={state.selectedCoord}
          onMapPress={handleMapPress}
          onMarkerPress={handleMarkerPress}
        />

        <SafeAreaView edges={['top']} className="absolute top-0 left-4">
          <TouchableOpacity
            onPress={() => router.push('/(main)/profile')}
            className={`w-12 h-12 rounded-full shadow-lg items-center justify-center border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
          >
            <Text className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {user?.username?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>

        <View className="absolute right-4 gap-3" style={{ top: '35%', elevation: 0 }}>
          <TouchableOpacity
            onPress={() => state.mapRef.current?.zoomIn()}
            className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full items-center justify-center border border-gray-100 dark:border-gray-700"
            style={{ elevation: 0 }}
            activeOpacity={0.7}
          >
            <Plus size={24} color={isDarkMode ? '#F3F4F6' : '#374151'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => state.mapRef.current?.zoomOut()}
            className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full items-center justify-center border border-gray-100 dark:border-gray-700"
            style={{ elevation: 0 }}
            activeOpacity={0.7}
          >
            <Minus size={24} color={isDarkMode ? '#F3F4F6' : '#374151'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={state.handleLocate}
            className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full items-center justify-center border border-gray-100 dark:border-gray-700 mt-4"
            style={{ elevation: 0 }}
            activeOpacity={0.7}
          >
            <Locate size={24} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
          </TouchableOpacity>
        </View>

        {!state.selectedCoord && !state.activeReports && (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(main)/create',
                params: {
                  ...(state.userAddress ? { address: state.userAddress } : {}),
                  ...(state.userLocation ? { lat: String(state.userLocation.latitude), lon: String(state.userLocation.longitude) } : {}),
                },
              })
            }
            className="absolute right-4 w-14 h-14 bg-blue-600 rounded-full items-center justify-center"
            style={{ elevation: 0, bottom: Math.max(insets.bottom, 16) + 90 }}
          >
            <Plus size={32} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {state.selectedCoord && (
        <View className="absolute bottom-0 w-full px-4 pt-4" style={{ zIndex: 30, paddingBottom: Math.max(insets.bottom, 16) + 16 }}>
          <View className={`p-5 rounded-3xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <View className="flex-row justify-between items-start mb-2">
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Новая метка</Text>
                {state.selectedAddress && (
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} numberOfLines={2}>
                    {state.selectedAddress}
                  </Text>
                )}
                <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} style={{ fontSize: 11, marginTop: 4 }}>
                  {state.selectedCoord.latitude.toFixed(6)},{' '}
                  {state.selectedCoord.longitude.toFixed(6)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => state.setSelectedCoord(null)}
                className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                <X size={20} color={isDarkMode ? '#D1D5DB' : '#374151'} />
              </TouchableOpacity>
            </View>
            <Button
              title="Сообщить о проблеме"
              onPress={() =>
                router.push({
                  pathname: '/(main)/create',
                  params: {
                    ...(state.selectedAddress ? { address: state.selectedAddress } : {}),
                    lat: String(state.selectedCoord?.latitude ?? 0),
                    lon: String(state.selectedCoord?.longitude ?? 0),
                  },
                })
              }
            />
          </View>
        </View>
      )}

      {!state.selectedCoord && (
        <BottomSheet
          ref={bottomSheetRef}
          index={Math.max(sheetIndex, 0)}
          onChange={(idx) => {
            if (idx < 0) return;
            setSheetIndex(idx);
            if (idx < 2 && searchFocused) {
              searchInputRef.current?.blur();
              Keyboard.dismiss();
              setSearchFocused(false);
            }
          }}
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          enablePanDownToClose={false}
          enableOverDrag={false}
          backgroundStyle={{
            backgroundColor: isDarkMode ? '#1F2937' : 'white',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 16,
          }}
          handleIndicatorStyle={{
            backgroundColor: isDarkMode ? '#4B5563' : '#D1D5DB',
            width: 48,
            height: 5,
            borderRadius: 3,
          }}
        >
          {state.singleReport ? (
            <BottomSheetScrollView contentContainerStyle={{ padding: 20, paddingBottom: Math.max(insets.bottom, 16) + 20 }}>
              <ReportDetail report={state.singleReport} onClose={handleCloseDetail} isDarkMode={isDarkMode} />
            </BottomSheetScrollView>
          ) : state.activeReports && state.activeReports.length > 0 ? (
            <View className="flex-1 px-5">
              <View className="flex-row justify-between items-center mb-4 py-2 border-b border-gray-50 dark:border-gray-800">
                <View>
                  <Text className="font-bold text-lg text-gray-900 dark:text-gray-100">Жалобы по адресу</Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {state.activeReports[0].address || 'Адрес не определен'}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleCloseDetail}>
                  <X size={24} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
                </TouchableOpacity>
              </View>
              <Button
                title="Добавить жалобу здесь"
                onPress={() =>
                  router.push({
                    pathname: '/(main)/create',
                    params: {
                      address: state.activeReports?.[0]?.address || '',
                      lat: String(state.activeReports?.[0]?.latitude),
                      lon: String(state.activeReports?.[0]?.longitude),
                    },
                  })
                }
                className="mb-4"
              />
              <FlatList
                data={state.activeReports}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <ReportCard
                    report={item}
                    onPress={() => {
                      state.setActiveReports([item]);
                      state.mapRef.current?.goToLocation(item.latitude, item.longitude);
                    }}
                  />
                )}
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDarkMode ? 'white' : 'default'}
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 20 }}
              />
            </View>
          ) : (
            <BottomSheetScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 40 }}>
              <View className="px-5 pb-4">
                <View className="flex-row items-center gap-2">
                  <View className="relative flex-1">
                    <View className="absolute left-3 top-3 z-10">
                      <Search size={20} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
                    </View>
                    <TextInput
                      ref={searchInputRef}
                      placeholder="Поиск по адресу..."
                      placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                      className="w-full bg-gray-100 dark:bg-gray-700 pl-10 pr-4 py-3 rounded-2xl text-gray-900 dark:text-gray-100 border border-transparent dark:border-gray-600"
                      value={state.searchQuery}
                      onChangeText={(text) => {
                        state.setSearchQuery(text);
                        state.fetchSuggestions(text);
                      }}
                      onFocus={() => {
                        setSearchFocused(true);
                        bottomSheetRef.current?.snapToIndex(2);
                      }}
                      onBlur={() => setSearchFocused(false)}
                    />
                  </View>
                </View>
              </View>

              <View className="px-5">
                {state.searchQuery.length >= 3 && (state.isSearching || state.suggestions.length > 0) ? (
                  <View className="mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                    {state.isSearching ? (
                      <Text className="text-center py-4 text-gray-500">Поиск...</Text>
                    ) : (
                      state.suggestions.map((item, idx) => {
                        const shortAddress = item.street
                          ? `${item.street}${item.house ? ', ' + item.house : ''}${item.city ? ', ' + item.city : ''}`
                          : item.display_name;
                        return (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => handleSelectSuggestion(item)}
                            className={`flex-row items-center px-4 py-3 ${idx < state.suggestions.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
                          >
                            <MapPin size={16} color={isDarkMode ? '#9CA3AF' : '#6B7280'} style={{ marginRight: 12 }} />
                            <Text className="flex-1 text-gray-900 dark:text-gray-100" numberOfLines={2}>
                              {shortAddress}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                ) : !state.searchQuery && state.searchHistory.length > 0 ? (
                  <View className="mb-6">
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="font-bold text-gray-900 dark:text-gray-100 text-sm">История поиска</Text>
                      <TouchableOpacity onPress={() => state.setSearchHistory([])}>
                        <Text className="text-xs text-gray-400 dark:text-gray-500">Очистить</Text>
                      </TouchableOpacity>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                      {state.searchHistory.map((item, idx) => (
                        <TouchableOpacity
                          key={idx}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg flex-row items-center gap-1.5"
                          onPress={() => state.setSearchQuery(item)}
                        >
                          <Clock size={12} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
                          <Text className="text-sm text-gray-700 dark:text-gray-300">{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : null}

                <InlineFilters state={state} isDarkMode={isDarkMode} />

                {state.filteredReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onPress={() => {
                      state.setActiveReports([report]);
                      state.mapRef.current?.goToLocation(report.latitude, report.longitude);
                      if (sheetIndex === 0) {
                        bottomSheetRef.current?.snapToIndex(1);
                      }
                    }}
                  />
                ))}

                {state.filteredReports.length === 0 && (
                  <View className="py-10 items-center">
                    <Text className="text-gray-400">Ничего не найдено</Text>
                  </View>
                )}
              </View>
            </BottomSheetScrollView>
          )}
        </BottomSheet>
      )}

      {state.showCityAlert && <CityAlert message={state.alertMessage} onClose={() => state.setShowCityAlert(false)} />}
    </View>
  );
}
