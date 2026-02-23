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
    X
} from 'lucide-react-native';
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
import { SafeAreaView } from 'react-native-safe-area-context';

const isWeb = Platform.OS === 'web';

function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(() =>
        isWeb ? window.innerWidth <= breakpoint : true
    );
    useEffect(() => {
        if (!isWeb) return;
        const handler = () => setIsMobile(window.innerWidth <= breakpoint);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, [breakpoint]);
    return isMobile;
}

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
// WEB LAYOUT
// ═══════════════════════════════════════════════════════════════
type PanelMode = 'collapsed' | 'dropdown' | 'open';

function WebMapScreen() {
    const state = useMapState();
    const [panelMode, setPanelMode] = useState<PanelMode>('open');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const PANEL_WIDTH = 420;
    const isOpen = panelMode === 'open';

    const handleSearchChange = (value: string) => {
        state.setSearchQuery(value);
    };

    const handleSearchSubmit = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && state.searchQuery.trim()) {
            setPanelMode('open');
        }
    };

    const handleSearchFocus = () => {
        if (panelMode === 'collapsed') setPanelMode('dropdown');
    };

    const handleMapPress = (coord: { latitude: number; longitude: number }) => {
        state.handleMapPress(coord);
        if (panelMode === 'dropdown') setPanelMode('collapsed');
    };

    // Inline search bar
    const searchBar = (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                position: 'relative' as const,
                background: isOpen ? '#F3F4F6' : 'white',
                borderRadius: 14,
                padding: '0 12px',
                height: 48,
            }}
        >
            <Search size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
            <input
                ref={searchInputRef}
                type="text"
                placeholder="Поиск по адресу..."
                value={state.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchSubmit}
                onFocus={handleSearchFocus}
                style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 16,
                    fontWeight: 500,
                    color: '#111827',
                    padding: '0 10px',
                    height: '100%',
                    minWidth: 0,
                }}
            />
        </div>
    );

    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative' as const, overflow: 'hidden' }}>
            {/* Full-screen map */}
            <div style={{ position: 'absolute' as const, inset: 0, zIndex: 0 }}>
                <AppMapView
                    ref={state.mapRef}
                    reports={state.reports}
                    selectedCoordinate={state.selectedCoord}
                    onMapPress={handleMapPress}
                    onMarkerPress={state.handleMarkerPress}
                />
            </div>

            <div
                style={{
                    position: 'absolute' as const,
                    top: 16,
                    left: 16,
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                }}
            >
                {/* Search bar card */}
                <div
                    style={{
                        width: PANEL_WIDTH - 32,
                        background: 'white',
                        borderRadius: isOpen ? '16px 16px 0 0' : 16,
                        boxShadow: isOpen ? 'none' : '0 2px 12px rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ padding: 0 }}>
                        {searchBar}
                    </div>

                    {/* Dropdown: history list */}
                    {panelMode === 'dropdown' && (
                        <div
                            style={{
                                padding: '0 16px 16px',
                                maxHeight: 400,
                                overflowY: 'auto' as const,
                            }}
                        >
                            {state.searchHistory.length > 0 ? (
                                <>
                                    <View className="flex-row justify-between items-center mb-3">
                                        <Text style={{ fontWeight: '700', fontSize: 16, color: '#111827' }}>
                                            История
                                        </Text>
                                        <TouchableOpacity onPress={() => state.setSearchHistory([])}>
                                            <Text className="text-xs text-gray-400">Очистить</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {state.searchHistory.map((item, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            onPress={() => {
                                                state.setSearchQuery(item);
                                                setPanelMode('open');
                                            }}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 12,
                                                paddingVertical: 10,
                                                borderBottomWidth: idx < state.searchHistory.length - 1 ? 1 : 0,
                                                borderBottomColor: '#F3F4F6',
                                            }}
                                        >
                                            <View style={{
                                                width: 36, height: 36, borderRadius: 18,
                                                backgroundColor: '#F3F4F6',
                                                alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Search size={16} color="#9CA3AF" />
                                            </View>
                                            <Text style={{ fontSize: 14, color: '#374151', flex: 1 }}>{item}</Text>
                                            <Clock size={14} color="#D1D5DB" />
                                        </TouchableOpacity>
                                    ))}
                                </>
                            ) : (
                                <Text style={{ color: '#9CA3AF', textAlign: 'center', padding: 16 }}>
                                    История поиска пуста
                                </Text>
                            )}
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setPanelMode(isOpen ? 'collapsed' : 'open')}
                    style={{
                        position: 'absolute' as const,
                        left: PANEL_WIDTH - 16 + 8,
                        top: 4,
                        width: 40, height: 40,
                        borderRadius: 10,
                        border: 'none',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                        flexShrink: 0,
                    }}
                >
                    {isOpen ? (
                        <ChevronLeft size={20} color="#374151" />
                    ) : (
                        <ChevronRight size={20} color="#374151" />
                    )}
                </button>
            </div>

            {/* ═══ OPEN: full sidebar content ═══ */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute' as const,
                        top: 0,
                        left: 0,
                        width: PANEL_WIDTH,
                        height: '100%',
                        backgroundColor: 'white',
                        borderRight: '1px solid #E5E7EB',
                        display: 'flex',
                        flexDirection: 'column' as const,
                        zIndex: 20,
                        boxShadow: '4px 0 16px rgba(0,0,0,0.08)',
                        paddingTop: 84,
                    }}
                >
                    {/* Sidebar content */}
                    <div style={{ flex: 1, overflowY: 'auto' as const, padding: '0 16px 16px' }}>
                        {state.singleReport ? (
                            <ReportDetail report={state.singleReport} onClose={state.handleCloseDetail} />
                        ) : state.activeReports && state.activeReports.length > 1 ? (
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
                            <View>
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
            )}

            {/* Profile button — top right */}
            <button
                onClick={() => router.push('/(main)/profile')}
                style={{
                    position: 'absolute' as const,
                    top: 16,
                    right: 16,
                    zIndex: 1000,
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: '1px solid #E5E7EB',
                    background: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                }}
            >🧑‍💼</button>

            {/* Zoom controls */}
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
    );
}

// ═══════════════════════════════════════════════════════════════
// MOBILE WEB LAYOUT
// ═══════════════════════════════════════════════════════════════
function MobileWebMapScreen() {
    const state = useMapState();
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Bottom sheet snap points
    const SNAP_PEEK = 80;
    const SNAP_HALF = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.45) : 400;
    const SNAP_FULL = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.9) : 700;
    const snapPoints = useMemo(() => [SNAP_PEEK, SNAP_HALF, SNAP_FULL], []);

    const [sheetHeight, setSheetHeight] = useState(SNAP_PEEK);
    const [isDragging, setIsDragging] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const dragStartY = useRef(0);
    const dragStartHeight = useRef(0);
    const previousSheetHeight = useRef<number | null>(null);

    // Snap to nearest point
    const snapTo = useCallback((h: number) => {
        let closest = snapPoints[0];
        let minDist = Math.abs(h - closest);
        for (const sp of snapPoints) {
            const dist = Math.abs(h - sp);
            if (dist < minDist) { closest = sp; minDist = dist; }
        }
        setSheetHeight(closest);
    }, [snapPoints]);

    // Touch drag
    const onTouchStart = useCallback((e: React.TouchEvent) => {
        setIsDragging(true);
        dragStartY.current = e.touches[0].clientY;
        dragStartHeight.current = sheetHeight;
        if (searchFocused) setSearchFocused(false);
    }, [sheetHeight, searchFocused]);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging) return;
        const dy = dragStartY.current - e.touches[0].clientY;
        const newH = Math.max(SNAP_PEEK, Math.min(SNAP_FULL, dragStartHeight.current + dy));
        setSheetHeight(newH);
    }, [isDragging]);

    const onTouchEnd = useCallback(() => {
        setIsDragging(false);
        snapTo(sheetHeight);
    }, [sheetHeight, snapTo]);

    // Mouse drag (for desktop testing of mobile layout)
    const onMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartY.current = e.clientY;
        dragStartHeight.current = sheetHeight;
        e.preventDefault();
        if (searchFocused) setSearchFocused(false);
    }, [sheetHeight, searchFocused]);

    useEffect(() => {
        if (!isDragging) return;
        const onMove = (e: MouseEvent) => {
            const dy = dragStartY.current - e.clientY;
            const newH = Math.max(SNAP_PEEK, Math.min(SNAP_FULL, dragStartHeight.current + dy));
            setSheetHeight(newH);
        };
        const onUp = () => {
            setIsDragging(false);
            snapTo(sheetHeight);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [isDragging, sheetHeight, snapTo]);

    // Back handler
    const closeNextOverlay = useCallback(() => {
        if (searchFocused) {
            setSearchFocused(false);
            return true;
        }
        if (state.selectedCoord) {
            state.setSelectedCoord(null);
            state.setActiveReports(null);
            return true;
        }
        if (state.singleReport) {
            executeCloseDetail();
            return true;
        }
        if (state.activeReports) {
            executeCloseDetail();
            return true;
        }
        if (sheetHeight > SNAP_PEEK) {
            setSheetHeight(SNAP_PEEK);
            return true;
        }
        return false;
    }, [searchFocused, state.selectedCoord, state.singleReport, state.activeReports, sheetHeight]);

    // Native Back Button
    useEffect(() => {
        if (Platform.OS === 'web') return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', closeNextOverlay);
        return () => subscription.remove();
    }, [closeNextOverlay]);

    // Web Mobile Browser Back Button
    const isProgrammaticBack = useRef(false);

    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const hasOverlay = searchFocused || !!state.selectedCoord || !!state.singleReport || !!state.activeReports || sheetHeight > SNAP_PEEK;

        if (hasOverlay) {
            if (window.location.hash !== '#overlay') {
                window.history.pushState(null, '', window.location.pathname + window.location.search + '#overlay');
            }
        } else {
            if (window.location.hash === '#overlay') {
                isProgrammaticBack.current = true;
                window.history.back();
            }
        }
    }, [searchFocused, state.selectedCoord, state.singleReport, state.activeReports, sheetHeight]);

    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const handlePopState = (e: PopStateEvent) => {
            if (isProgrammaticBack.current) {
                isProgrammaticBack.current = false;
                return;
            }
            const closedSomething = closeNextOverlay();
            if (closedSomething) {
                window.history.pushState(null, '', window.location.pathname + window.location.search + '#overlay');
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [closeNextOverlay]);

    // Search handlers
    const handleSearchChange = useCallback((text: string) => {
        state.setSearchQuery(text);
    }, []);

    const handleSearchSubmit = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && state.searchQuery.trim()) {
            if (!state.searchHistory.includes(state.searchQuery.trim())) {
                state.setSearchHistory([state.searchQuery.trim(), ...state.searchHistory]);
            }
            setSearchFocused(false);
            searchInputRef.current?.blur();
            setSheetHeight(SNAP_FULL);
        }
    }, [state.searchQuery, state.searchHistory, SNAP_FULL]);

    const executeCloseDetail = useCallback(() => {
        state.handleCloseDetail();
        if (previousSheetHeight.current === SNAP_PEEK) {
            setSheetHeight(SNAP_PEEK);
        }
        previousSheetHeight.current = null;
    }, [state.handleCloseDetail, SNAP_PEEK]);

    const handleMarkerPress = useCallback((clusterReports: Report[]) => {
        if (sheetHeight <= SNAP_PEEK) {
            previousSheetHeight.current = SNAP_PEEK;
            setSheetHeight(SNAP_HALF);
        } else if (!state.singleReport && !state.activeReports) {
            previousSheetHeight.current = null;
        }
        state.handleMarkerPress(clusterReports);
    }, [state.handleMarkerPress, sheetHeight, SNAP_PEEK, SNAP_HALF]);

    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative' as const, overflow: 'hidden' }}>
            {/* Map */}
            <div style={{ position: 'absolute' as const, inset: 0, zIndex: 0 }}>
                <AppMapView
                    ref={state.mapRef}
                    reports={state.reports}
                    onMapPress={(coord) => {
                        state.handleMapPress(coord);
                        setSheetHeight(SNAP_PEEK);
                        setSearchFocused(false);
                    }}
                    onMarkerPress={handleMarkerPress}
                    selectedCoordinate={state.selectedCoord}
                />
            </div>

            {/* Floating search bar */}
            <div
                style={{
                    position: 'absolute' as const,
                    top: 12, left: 12, right: 12,
                    zIndex: 50,
                }}
            >
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    {/* Search Bar Input */}
                    <div
                        style={{
                            flex: 1,
                            background: 'white',
                            borderRadius: 14,
                            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 12px',
                            height: 48,
                        }}
                        onClick={() => {
                            searchInputRef.current?.focus();
                            setSearchFocused(true);
                            setSheetHeight(SNAP_PEEK);
                            state.setSelectedCoord(null);
                            state.setActiveReports(null);
                        }}
                    >
                        <Search size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Поиск по адресу..."
                            value={state.searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onKeyDown={handleSearchSubmit}
                            onFocus={() => setSearchFocused(true)}
                            style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontSize: 14,
                                color: '#111827',
                                padding: '0 10px',
                                height: '100%',
                                minWidth: 0,
                            }}
                        />
                        {state.searchQuery && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    state.setSearchQuery('');
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                            >
                                <X size={16} color="#9CA3AF" />
                            </button>
                        )}
                    </div>

                    {/* Profile button */}
                    <button
                        onClick={() => router.push('/(main)/profile')}
                        style={{
                            width: 48, height: 48, borderRadius: 24,
                            border: 'none', background: 'white',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                            cursor: 'pointer', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22,
                        }}
                    >
                        🧑‍💼
                    </button>
                </div>

                {/* Search history dropdown */}
                {searchFocused && !state.searchQuery && state.searchHistory.length > 0 && sheetHeight <= SNAP_PEEK && (
                    <div
                        style={{
                            marginTop: 4,
                            background: 'white',
                            borderRadius: 14,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                            padding: 12,
                            maxHeight: 300,
                            overflowY: 'auto' as const,
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>История</span>
                            <button
                                onClick={() => state.setSearchHistory([])}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9CA3AF' }}
                            >
                                Очистить
                            </button>
                        </div>
                        {state.searchHistory.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    state.setSearchQuery(item);
                                    setSearchFocused(false);
                                    setSheetHeight(SNAP_HALF);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    width: '100%',
                                    padding: '10px 0',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: idx < state.searchHistory.length - 1 ? '1px solid #F3F4F6' : 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left' as const,
                                }}
                            >
                                <Clock size={14} color="#D1D5DB" />
                                <span style={{ fontSize: 14, color: '#374151' }}>{item}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>


            {/* Zoom controls */}
            <div
                style={{
                    position: 'absolute' as const,
                    right: 12, top: '30%',
                    zIndex: 50,
                    display: 'flex', flexDirection: 'column' as const, gap: 8,
                }}
            >
                {[
                    { icon: <Plus size={22} color="#374151" />, action: () => state.mapRef.current?.zoomIn() },
                    { icon: <Minus size={22} color="#374151" />, action: () => state.mapRef.current?.zoomOut() },
                ].map((btn, i) => (
                    <button
                        key={i}
                        onClick={btn.action}
                        style={{
                            width: 44, height: 44, borderRadius: 22,
                            border: 'none', background: 'white', cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0,
                        }}
                    >
                        {btn.icon}
                    </button>
                ))}
                <button
                    style={{
                        width: 44, height: 44, borderRadius: 22,
                        border: 'none', background: 'white', cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginTop: 8,
                    }}
                >
                    <Locate size={22} color="#2563EB" />
                </button>
            </div>

            {/* FAB — create report */}
            {!state.selectedCoord && !state.activeReports && sheetHeight <= SNAP_PEEK + 20 && (
                <button
                    onClick={() => router.push('/(main)/create')}
                    style={{
                        position: 'absolute' as const,
                        bottom: SNAP_PEEK + 16, right: 16,
                        zIndex: 50,
                        width: 56, height: 56, borderRadius: 28,
                        border: 'none', background: '#2563EB', cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <Plus size={28} color="#FFFFFF" />
                </button>
            )}

            {/* Selected point card */}
            {state.selectedCoord && (
                <div
                    style={{
                        position: 'absolute' as const,
                        bottom: 24,
                        left: 12, right: 12,
                        zIndex: 50,
                        background: 'white',
                        borderRadius: 20,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        padding: 20,
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>Новая метка</div>
                            <div style={{ color: '#111827', fontWeight: 500 }}>
                                {state.selectedCoord.latitude.toFixed(4)},{' '}
                                {state.selectedCoord.longitude.toFixed(4)}
                            </div>
                        </div>
                        <button
                            onClick={() => state.setSelectedCoord(null)}
                            style={{
                                background: '#F3F4F6', border: 'none', borderRadius: 20,
                                width: 36, height: 36, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <X size={18} color="#374151" />
                        </button>
                    </div>
                    <Button
                        title="Сообщить о проблеме"
                        onPress={() => router.push('/(main)/create')}
                    />
                </div>
            )}

            {/* ═══ CSS Bottom Sheet ═══ */}
            <div
                style={{
                    position: 'absolute' as const,
                    bottom: 0, left: 0, right: 0,
                    height: sheetHeight,
                    zIndex: 40,
                    background: 'white',
                    borderRadius: '20px 20px 0 0',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
                    transition: isDragging ? 'none' : 'height 0.3s ease-out',
                    display: state.selectedCoord ? 'none' : 'flex',
                    flexDirection: 'column' as const,
                    overflow: 'hidden',
                }}
            >
                {/* Drag handle */}
                <div
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    onMouseDown={onMouseDown}
                    style={{
                        padding: '12px 0 8px',
                        cursor: 'grab',
                        display: 'flex', justifyContent: 'center',
                        flexShrink: 0,
                        userSelect: 'none' as const,
                    }}
                >
                    <div style={{
                        width: 36, height: 4, borderRadius: 2,
                        backgroundColor: '#D1D5DB',
                    }} />
                </div>

                {/* Sheet content */}
                <div style={{ flex: 1, overflowY: sheetHeight > SNAP_PEEK ? 'auto' : 'hidden', padding: '0 16px 16px' }}>
                    {state.singleReport ? (
                        <ReportDetail report={state.singleReport} onClose={() => {
                            executeCloseDetail();
                        }} />
                    ) : state.activeReports && state.activeReports.length > 1 ? (
                        <View>
                            <View className="flex-row justify-between items-center mb-4 py-2 border-b border-gray-50">
                                <View>
                                    <Text className="font-bold text-lg">Жалобы по адресу</Text>
                                    <Text className="text-xs text-gray-500">
                                        {state.activeReports[0].address || 'Адрес не определен'}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => {
                                    executeCloseDetail();
                                }}>
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
                                    onPress={() => {
                                        state.setActiveReports([item]);
                                    }}
                                />
                            ))}
                        </View>
                    ) : (
                        <View>
                            <Text className="font-bold text-gray-900 mb-3 text-base">
                                {state.searchQuery ? 'Результаты поиска' : 'Лента происшествий'}
                            </Text>

                            {state.filteredReports.map((report) => (
                                <ReportCard
                                    key={report.id}
                                    report={report}
                                    onPress={() => {
                                        state.setActiveReports([report]);
                                    }}
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
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// NATIVE LAYOUT
// ═══════════════════════════════════════════════════════════════
function NativeMapScreen() {
    const state = useMapState();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const searchInputRef = useRef<TextInput>(null);
    const previousSheetIndex = useRef<number | null>(null);
    const [sheetIndex, setSheetIndex] = useState(0);
    const [searchFocused, setSearchFocused] = useState(false);

    // Bottom sheet snap points: collapsed, half, 90%
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
                    index={sheetIndex}
                    onChange={(idx) => {
                        setSheetIndex(idx);
                        if (idx < 2 && searchFocused) {
                            searchInputRef.current?.blur();
                            Keyboard.dismiss();
                            setSearchFocused(false);
                        }
                    }}
                    snapPoints={snapPoints}
                    enablePanDownToClose={false}
                    enableOverDrag={false}
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
                                        ref={searchInputRef}
                                        placeholder="Поиск по адресу..."
                                        placeholderTextColor="#9CA3AF"
                                        className="w-full bg-gray-100 pl-10 pr-4 py-3 rounded-2xl text-gray-900"
                                        value={state.searchQuery}
                                        onChangeText={state.setSearchQuery}
                                        onFocus={() => {
                                            setSearchFocused(true);
                                            bottomSheetRef.current?.snapToIndex(2);
                                        }}
                                        onBlur={() => setSearchFocused(false)}
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
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════
// EXPORTED SCREEN — picks layout by platform
// ═══════════════════════════════════════════════════════════════
export default function MapScreen() {
    const isMobile = useIsMobile();
    if (!isWeb) return <NativeMapScreen />;
    return isMobile ? <MobileWebMapScreen /> : <WebMapScreen />;
}
