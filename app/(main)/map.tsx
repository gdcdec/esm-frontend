import { AppMapView, MapViewRef } from '@/src/components/MapView';
import { ReportCard } from '@/src/components/ReportCard';
import { Button } from '@/src/components/ui';
import { MOCK_REPORTS } from '@/src/constants/mock-data';
import { Report } from '@/src/types';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Locate,
    MapPin,
    Minus,
    Plus,
    Search,
    X,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    FlatList,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const isWeb = Platform.OS === 'web';

// ─── Shared state hook ────────────────────────────────────────
function useMapState() {
    const [reports] = useState<Report[]>(MOCK_REPORTS);
    const [selectedCoord, setSelectedCoord] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [activeReports, setActiveReports] = useState<Report[] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchHistory, setSearchHistory] = useState([
        'ул. Пушкина, 10',
        'Парк Горького',
        'Центральный рынок',
    ]);

    const mapRef = useRef<MapViewRef>(null);
    const singleReport = activeReports?.length === 1 ? activeReports[0] : null;

    const filteredReports = useMemo(
        () =>
            reports.filter(
                (r) =>
                    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (r.address &&
                        r.address.toLowerCase().includes(searchQuery.toLowerCase()))
            ),
        [reports, searchQuery]
    );

    const handleMapPress = useCallback(
        (coordinate: { latitude: number; longitude: number }) => {
            setActiveReports(null);
            setSelectedCoord(coordinate);
        },
        []
    );

    const handleMarkerPress = useCallback((clusterReports: Report[]) => {
        setSelectedCoord(null);
        setActiveReports(clusterReports);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setActiveReports(null);
        setSelectedCoord(null);
    }, []);

    return {
        reports, selectedCoord, setSelectedCoord,
        activeReports, setActiveReports,
        searchQuery, setSearchQuery,
        searchHistory, setSearchHistory,
        mapRef, singleReport, filteredReports,
        handleMapPress, handleMarkerPress, handleCloseDetail,
    };
}

// ─── Report detail view (shared) ──────────────────────────────
function ReportDetail({
    report,
    onClose,
}: {
    report: Report;
    onClose: () => void;
}) {
    return (
        <View>
            <View className="flex-row justify-between items-start">
                <View className="bg-green-100 px-2.5 py-1 rounded-full">
                    <Text className="text-[10px] font-bold text-green-700 uppercase">
                        {report.status === 'solved'
                            ? 'Решено'
                            : report.status === 'progress'
                                ? 'В работе'
                                : 'На рассмотрении'}
                    </Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                    <X size={24} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            <Text className="text-2xl font-bold mt-3 text-gray-900">
                {report.title}
            </Text>

            <View className="flex-row items-center gap-2 mt-3 mb-4">
                <View className="w-6 h-6 bg-blue-100 rounded-full items-center justify-center">
                    <Text className="text-blue-600 font-bold text-xs">
                        {report.author.charAt(0)}
                    </Text>
                </View>
                <Text className="font-medium text-gray-900 text-sm">
                    {report.author}
                </Text>
                <Text className="text-gray-400 text-sm">•</Text>
                <Text className="text-gray-500 text-sm">{report.date}</Text>
            </View>

            <View className="flex-row items-center gap-1 mb-2">
                <MapPin size={14} color="#9CA3AF" />
                <Text className="text-sm text-gray-500">
                    {report.address || 'Адрес не указан'}
                </Text>
            </View>

            <View className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
                <Text className="text-gray-700 leading-6">
                    {report.desc || report.title}
                </Text>
            </View>

            <View className="flex-row gap-3 mb-6">
                <TouchableOpacity className="flex-1 py-3 bg-blue-50 rounded-xl flex-row items-center justify-center gap-2">
                    <Text className="text-blue-600 font-medium">
                        👍 Поддержать ({report.likes})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 py-3 bg-gray-100 rounded-xl flex-row items-center justify-center gap-2">
                    <Text className="text-gray-700 font-medium">
                        💬 Обсудить ({report.comments})
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════
// WEB LAYOUT — side panel like Yandex Maps
// ═══════════════════════════════════════════════════════════════
function WebMapScreen() {
    const state = useMapState();
    const [panelOpen, setPanelOpen] = useState(true);

    const PANEL_WIDTH = 380;

    return (
        <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
            {/* Side Panel */}
            <div
                style={{
                    width: panelOpen ? PANEL_WIDTH : 0,
                    minWidth: panelOpen ? PANEL_WIDTH : 0,
                    height: '100%',
                    backgroundColor: 'white',
                    borderRight: '1px solid #E5E7EB',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'width 0.3s ease, min-width 0.3s ease',
                    position: 'relative' as const,
                    zIndex: 20,
                    boxShadow: panelOpen ? '4px 0 16px rgba(0,0,0,0.06)' : 'none',
                }}
            >
                {/* Panel header with search */}
                <div style={{ padding: 16, borderBottom: '1px solid #F3F4F6' }}>
                    {/* Logo + profile */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 24 }}>🏙️</span>
                            <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Мой Донос*</span>
                        </div>
                        <button
                            onClick={() => router.push('/(main)/profile')}
                            style={{
                                width: 36, height: 36,
                                borderRadius: '50%',
                                border: '1px solid #E5E7EB',
                                background: 'white',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 18,
                            }}
                        >🧑‍💼</button>
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 12, top: 10, zIndex: 1 }}>
                            <Search size={18} color="#9CA3AF" />
                        </div>
                        <input
                            type="text"
                            placeholder="Поиск по адресу..."
                            value={state.searchQuery}
                            onChange={(e) => state.setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 16px 10px 38px',
                                borderRadius: 14,
                                border: 'none',
                                backgroundColor: '#F3F4F6',
                                fontSize: 14,
                                outline: 'none',
                                color: '#111827',
                            }}
                        />
                    </div>
                </div>

                {/* Panel content */}
                <div style={{ flex: 1, overflowY: 'auto' as const, padding: 16 }}>
                    {/* Report detail */}
                    {state.singleReport ? (
                        <ReportDetail report={state.singleReport} onClose={state.handleCloseDetail} />

                    ) : state.activeReports && state.activeReports.length > 1 ? (
                        /* Cluster list */
                        <View>
                            <View className="flex-row justify-between items-center mb-4 py-2 border-b border-gray-50">
                                <View>
                                    <Text className="font-bold text-lg">Жалобы по адресу</Text>
                                    <Text className="text-xs text-gray-500">
                                        {state.activeReports[0].address || 'Адрес не определен'}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={state.handleCloseDetail}>
                                    <X size={24} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                            <Button
                                title="Добавить жалобу здесь"
                                onPress={() => router.push('/(main)/create')}
                                className="mb-4"
                            />
                            {state.activeReports.map((item) => (
                                <ReportCard
                                    key={item.id}
                                    report={item}
                                    onPress={() => state.setActiveReports([item])}
                                />
                            ))}
                        </View>

                    ) : (
                        /* Feed */
                        <View>
                            {/* Search history */}
                            {!state.searchQuery && state.searchHistory.length > 0 && (
                                <View className="mb-6">
                                    <View className="flex-row justify-between items-center mb-3">
                                        <Text className="font-bold text-gray-900 text-sm">
                                            История поиска
                                        </Text>
                                        <TouchableOpacity onPress={() => state.setSearchHistory([])}>
                                            <Text className="text-xs text-gray-400">Очистить</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View className="flex-row flex-wrap gap-2">
                                        {state.searchHistory.map((item, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                className="px-3 py-1.5 bg-gray-100 rounded-lg flex-row items-center gap-1.5"
                                                onPress={() => state.setSearchQuery(item)}
                                            >
                                                <Clock size={12} color="#9CA3AF" />
                                                <Text className="text-sm text-gray-700">{item}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            <Text className="font-bold text-gray-900 mb-3 text-lg">
                                {state.searchQuery ? 'Результаты поиска' : 'Лента происшествий'}
                            </Text>

                            {state.filteredReports.map((report) => (
                                <ReportCard
                                    key={report.id}
                                    report={report}
                                    onPress={() => state.setActiveReports([report])}
                                />
                            ))}

                            {state.filteredReports.length === 0 && (
                                <View className="py-10 items-center">
                                    <Text className="text-gray-400">Ничего не найдено</Text>
                                </View>
                            )}
                        </View>
                    )}
                </div>

                {/* New report button */}
                <div style={{ padding: 16, borderTop: '1px solid #F3F4F6' }}>
                    <Button
                        title="+ Сообщить о проблеме"
                        onPress={() => router.push('/(main)/create')}
                    />
                </div>
            </div>

            {/* Collapse / Expand toggle button */}
            <button
                onClick={() => setPanelOpen(!panelOpen)}
                style={{
                    position: 'absolute' as const,
                    left: panelOpen ? PANEL_WIDTH - 1 : 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 25,
                    width: 24,
                    height: 56,
                    borderRadius: '0 8px 8px 0',
                    border: '1px solid #E5E7EB',
                    borderLeft: 'none',
                    background: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
                    transition: 'left 0.3s ease',
                }}
            >
                {panelOpen ? (
                    <ChevronLeft size={16} color="#6B7280" />
                ) : (
                    <ChevronRight size={16} color="#6B7280" />
                )}
            </button>

            {/* Map area */}
            <div style={{ flex: 1, position: 'relative' as const, height: '100%' }}>
                <AppMapView
                    ref={state.mapRef}
                    reports={state.reports}
                    selectedCoordinate={state.selectedCoord}
                    onMapPress={state.handleMapPress}
                    onMarkerPress={state.handleMarkerPress}
                />

                {/* Zoom controls — above the map with high z-index */}
                <div
                    style={{
                        position: 'absolute' as const,
                        right: 16,
                        top: '35%',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column' as const,
                        gap: 8,
                    }}
                >
                    <button
                        onClick={() => state.mapRef.current?.zoomIn()}
                        style={{
                            width: 44, height: 44,
                            borderRadius: '50%',
                            border: '1px solid #E5E7EB',
                            background: 'white',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        }}
                    >
                        <Plus size={22} color="#374151" />
                    </button>
                    <button
                        onClick={() => state.mapRef.current?.zoomOut()}
                        style={{
                            width: 44, height: 44,
                            borderRadius: '50%',
                            border: '1px solid #E5E7EB',
                            background: 'white',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        }}
                    >
                        <Minus size={22} color="#374151" />
                    </button>
                    <button
                        style={{
                            width: 44, height: 44,
                            borderRadius: '50%',
                            border: '1px solid #E5E7EB',
                            background: 'white',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                            marginTop: 8,
                        }}
                    >
                        <Locate size={22} color="#2563EB" />
                    </button>
                </div>

                {/* Selected point card */}
                {state.selectedCoord && (
                    <div
                        style={{
                            position: 'absolute' as const,
                            bottom: 24,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 1000,
                            width: 340,
                        }}
                    >
                        <View className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100">
                            <View className="flex-row justify-between items-start mb-2">
                                <View>
                                    <Text className="font-bold text-lg">Новая метка</Text>
                                    <Text className="text-gray-900 font-medium">
                                        {state.selectedCoord.latitude.toFixed(4)},{' '}
                                        {state.selectedCoord.longitude.toFixed(4)}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => state.setSelectedCoord(null)}
                                    className="p-2 bg-gray-100 rounded-full"
                                >
                                    <X size={20} color="#374151" />
                                </TouchableOpacity>
                            </View>
                            <Button
                                title="Сообщить о проблеме"
                                onPress={() => router.push('/(main)/create')}
                            />
                        </View>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// NATIVE LAYOUT — bottom sheet
// ═══════════════════════════════════════════════════════════════
function NativeMapScreen() {
    const state = useMapState();
    const bottomSheetRef = useRef<BottomSheet>(null);

    // Bottom sheet snap points: collapsed, half, 90% max
    const snapPoints = useMemo(() => ['10%', '45%', '90%'], []);

    const handleMapPress = useCallback(
        (coordinate: { latitude: number; longitude: number }) => {
            state.handleMapPress(coordinate);
            bottomSheetRef.current?.snapToIndex(0);
        },
        [state.handleMapPress]
    );

    const handleMarkerPress = useCallback(
        (clusterReports: Report[]) => {
            state.handleMarkerPress(clusterReports);
            bottomSheetRef.current?.snapToIndex(1);
        },
        [state.handleMarkerPress]
    );

    const handleCloseDetail = useCallback(() => {
        state.handleCloseDetail();
        bottomSheetRef.current?.snapToIndex(0);
    }, [state.handleCloseDetail]);

    return (
        <View className="flex-1 bg-white">
            {/* Map */}
            <View className="flex-1">
                <AppMapView
                    ref={state.mapRef}
                    reports={state.reports}
                    selectedCoordinate={state.selectedCoord}
                    onMapPress={handleMapPress}
                    onMarkerPress={handleMarkerPress}
                />

                {/* Profile button */}
                <SafeAreaView
                    edges={['top']}
                    className="absolute top-0 left-4"
                    style={{ zIndex: 10 }}
                >
                    <TouchableOpacity
                        onPress={() => router.push('/(main)/profile')}
                        className="w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center border border-gray-100"
                    >
                        <Text className="text-2xl">🧑‍💼</Text>
                    </TouchableOpacity>
                </SafeAreaView>

                {/* Zoom controls */}
                <View
                    className="absolute right-4 gap-3"
                    style={{ top: '35%', zIndex: 10 }}
                >
                    <TouchableOpacity
                        onPress={() => state.mapRef.current?.zoomIn()}
                        className="w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center border border-gray-100"
                    >
                        <Plus size={24} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => state.mapRef.current?.zoomOut()}
                        className="w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center border border-gray-100"
                    >
                        <Minus size={24} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity className="w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center border border-gray-100 mt-4">
                        <Locate size={24} color="#2563EB" />
                    </TouchableOpacity>
                </View>

                {/* FAB */}
                {!state.selectedCoord && !state.activeReports && (
                    <TouchableOpacity
                        onPress={() => router.push('/(main)/create')}
                        className="absolute bottom-28 right-4 w-14 h-14 bg-blue-600 rounded-full shadow-xl items-center justify-center"
                        style={{ zIndex: 10 }}
                    >
                        <Plus size={32} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Selected point card */}
            {state.selectedCoord && (
                <View className="absolute bottom-0 w-full p-4" style={{ zIndex: 30 }}>
                    <View className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100">
                        <View className="flex-row justify-between items-start mb-2">
                            <View>
                                <Text className="font-bold text-lg">Новая метка</Text>
                                <Text className="text-gray-900 font-medium">
                                    {state.selectedCoord.latitude.toFixed(4)},{' '}
                                    {state.selectedCoord.longitude.toFixed(4)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => state.setSelectedCoord(null)}
                                className="p-2 bg-gray-100 rounded-full"
                            >
                                <X size={20} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <Button
                            title="Сообщить о проблеме"
                            onPress={() => router.push('/(main)/create')}
                        />
                    </View>
                </View>
            )}

            {/* Swipable Bottom Sheet */}
            {!state.selectedCoord && (
                <BottomSheet
                    ref={bottomSheetRef}
                    index={0}
                    snapPoints={snapPoints}
                    enablePanDownToClose={false}
                    backgroundStyle={{
                        backgroundColor: 'white',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 16,
                    }}
                    handleIndicatorStyle={{
                        backgroundColor: '#D1D5DB',
                        width: 48,
                        height: 5,
                        borderRadius: 3,
                    }}
                >
                    {/* Single report detail */}
                    {state.singleReport ? (
                        <BottomSheetScrollView contentContainerStyle={{ padding: 20 }}>
                            <ReportDetail report={state.singleReport} onClose={handleCloseDetail} />
                        </BottomSheetScrollView>

                    ) : state.activeReports && state.activeReports.length > 1 ? (
                        <View className="flex-1 px-5 pb-5">
                            <View className="flex-row justify-between items-center mb-4 py-2 border-b border-gray-50">
                                <View>
                                    <Text className="font-bold text-lg">Жалобы по адресу</Text>
                                    <Text className="text-xs text-gray-500">
                                        {state.activeReports[0].address || 'Адрес не определен'}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={handleCloseDetail}>
                                    <X size={24} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                            <Button
                                title="Добавить жалобу здесь"
                                onPress={() => router.push('/(main)/create')}
                                className="mb-4"
                            />
                            <FlatList
                                data={state.activeReports}
                                keyExtractor={(item) => String(item.id)}
                                renderItem={({ item }) => (
                                    <ReportCard
                                        report={item}
                                        onPress={() => state.setActiveReports([item])}
                                    />
                                )}
                            />
                        </View>

                    ) : (
                        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                            <View className="px-5 pb-4">
                                <View className="relative">
                                    <View className="absolute left-3 top-3 z-10">
                                        <Search size={20} color="#9CA3AF" />
                                    </View>
                                    <TextInput
                                        placeholder="Поиск по адресу..."
                                        placeholderTextColor="#9CA3AF"
                                        className="w-full bg-gray-100 pl-10 pr-4 py-3 rounded-2xl text-gray-900"
                                        value={state.searchQuery}
                                        onChangeText={state.setSearchQuery}
                                        onFocus={() => bottomSheetRef.current?.snapToIndex(2)}
                                    />
                                </View>
                            </View>

                            <View className="px-5">
                                {!state.searchQuery && state.searchHistory.length > 0 && (
                                    <View className="mb-6">
                                        <View className="flex-row justify-between items-center mb-3">
                                            <Text className="font-bold text-gray-900 text-sm">
                                                История поиска
                                            </Text>
                                            <TouchableOpacity onPress={() => state.setSearchHistory([])}>
                                                <Text className="text-xs text-gray-400">Очистить</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View className="flex-row flex-wrap gap-2">
                                            {state.searchHistory.map((item, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    className="px-3 py-1.5 bg-gray-100 rounded-lg flex-row items-center gap-1.5"
                                                    onPress={() => state.setSearchQuery(item)}
                                                >
                                                    <Clock size={12} color="#9CA3AF" />
                                                    <Text className="text-sm text-gray-700">{item}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                <Text className="font-bold text-gray-900 mb-3 text-lg">
                                    {state.searchQuery ? 'Результаты поиска' : 'Лента происшествий'}
                                </Text>

                                {state.filteredReports.map((report) => (
                                    <ReportCard
                                        key={report.id}
                                        report={report}
                                        onPress={() => {
                                            state.setActiveReports([report]);
                                            bottomSheetRef.current?.snapToIndex(1);
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
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════
// EXPORTED SCREEN — picks layout by platform
// ═══════════════════════════════════════════════════════════════
export default function MapScreen() {
    return isWeb ? <WebMapScreen /> : <NativeMapScreen />;
}
