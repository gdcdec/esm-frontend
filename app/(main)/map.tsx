import { ReportFilters } from '@/src/components/FiltersModal';
import { AppMapView } from '@/src/components/MapView';
import { ReportCard } from '@/src/components/ReportCard';
import { Button } from '@/src/components/ui';
import { addressService } from '@/src/services/address';
import { reportsService } from '@/src/services/reports';
import { rubricsService } from '@/src/services/rubrics';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import { AddressSearchResult, MapViewRef, Report, ReportStatus } from '@/src/types';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import {
    ChevronDown,
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
    Alert,
    BackHandler,
    FlatList,
    Keyboard,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CityBoundaryData, fetchCityBoundary, isPointInPolygon } from '../../src/utils/fetchCityBoundary';

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
    const { visibilityArea, city } = useThemeStore();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoadingReports, setIsLoadingReports] = useState(true);
    const [selectedCoord, setSelectedCoord] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [activeReports, setActiveReports] = useState<Report[] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [userAddress, setUserAddress] = useState<string | null>(null);
    const [filters, setFilters] = useState<ReportFilters>({});
    const [rubrics, setRubrics] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [cityBoundary, setCityBoundary] = useState<CityBoundaryData | null>(null);
    const [showCityAlert, setShowCityAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const [suggestions, setSuggestions] = useState<AddressSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const mapRef = useRef<MapViewRef>(null);

    // Fetch suggestions
    const fetchSuggestions = useCallback((query: string) => {
        if (query.trim().length < 3) {
            setSuggestions([]);
            return;
        }
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await addressService.search(query);
                setSuggestions(results);
            } catch {
                // ignore
            } finally {
                setIsSearching(false);
            }
        }, 500);
    }, []);

    // Fetch real posts from API
    const fetchReports = useCallback(async (currentFilters?: ReportFilters) => {
        setIsLoadingReports(true);
        try {
            // Add city filter if visibility area is enabled
            let finalFilters = currentFilters || filters;
            if (visibilityArea && city) {
                finalFilters = { ...finalFilters, city };
            }
            const data = await reportsService.getAll(finalFilters);
            setReports(data);
        } catch {
            // ignore
        } finally {
            setIsLoadingReports(false);
        }
    }, [filters, visibilityArea, city]);

    // Load dynamic rubrics and initial posts
    useEffect(() => {
        let isMounted = true;
        
        const loadInitialData = async () => {
            try {
                // Fetch rubrics dynamically from backend
                const rubricsData = await rubricsService.getAll();
                if (isMounted) {
                    setRubrics(rubricsData.map(r => r.name));
                }
            } catch {
                // Fallback to defaults if backend fails
                if (isMounted) {
                    setRubrics(['Дороги', 'ЖКХ', 'Мусор', 'Парки', 'Свет']);
                }
            }
            
            // Fetch city boundary if visibility area is enabled
            if (visibilityArea && city) {
                try {
                    const boundaryData = await fetchCityBoundary(city);
                    if (isMounted) {
                        setCityBoundary(boundaryData);
                    }
                } catch {
                    // ignore
                }
            }
            
            if (isMounted) {
                fetchReports();
            }
        };
        
        loadInitialData();
        
        return () => {
            isMounted = false;
        };
    }, [visibilityArea, city]);

    // Re-fetch reports when filters or visibility settings change
    useEffect(() => {
        fetchReports(filters);
    }, [filters, visibilityArea, city]);

    const singleReport = activeReports?.length === 1 ? activeReports[0] : null;

    const filteredReports = useMemo(
        () =>
            reports.filter(
                (r) =>
                    r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.address?.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [reports, searchQuery]
    );

    const handleMapPress = useCallback(
        async (coordinate: { latitude: number; longitude: number }) => {
            setActiveReports(null);
            
            // Check if point is outside city boundary when visibility area is enabled
            if (visibilityArea && cityBoundary && cityBoundary.coords.length > 0) {
                const isInsideCity = isPointInPolygon(coordinate, cityBoundary.coords);
                if (!isInsideCity) {
                    const message = `Вы выбираете точку за пределами города ${city}. Выбор точки ограничен территорией города.`;
                    
                    if (Platform.OS === 'web') {
                        setAlertMessage(message);
                        setShowCityAlert(true);
                    } else {
                        Alert.alert('Внимание', message);
                    }
                    return;
                }
            }
            
            setSelectedCoord(coordinate);
            setSelectedAddress(null);
            try {
                const res = await addressService.reverse(coordinate.latitude, coordinate.longitude);
                const formatted = res.street
                    ? `${res.street}${res.house ? ', ' + res.house : ''}${res.city ? ', ' + res.city : ''}`
                    : res.address;
                setSelectedAddress(formatted);
            } catch {
                setSelectedAddress(null);
            }
        },
        [visibilityArea, cityBoundary, city]
    );

    const handleMarkerPress = useCallback((clusterReports: Report[]) => {
        setSelectedCoord(null);
        setSelectedAddress(null);
        setActiveReports(clusterReports);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setActiveReports(null);
        setSelectedCoord(null);
        setSelectedAddress(null);
    }, []);

    const handleLocate = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Геолокация', 'Нет доступа к геолокации. Включите в настройках.');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setUserLocation(coord);
            mapRef.current?.goToLocation(coord.latitude, coord.longitude);
            try {
                const res = await addressService.reverse(coord.latitude, coord.longitude);
                const formatted = res.street
                    ? `${res.street}${res.house ? ', ' + res.house : ''}${res.city ? ', ' + res.city : ''}`
                    : res.address;
                setUserAddress(formatted);
            } catch {
                setUserAddress(null);
            }
        } catch {
            Alert.alert('Ошибка', 'Не удалось определить местоположение');
        }
    }, []);

    return {
        reports, selectedCoord, setSelectedCoord,
        selectedAddress, setSelectedAddress,
        activeReports, setActiveReports,
        searchQuery, setSearchQuery,
        searchHistory, setSearchHistory,
        mapRef, singleReport, filteredReports,
        userLocation, userAddress,
        isLoadingReports, fetchReports,
        handleMapPress, handleMarkerPress, handleCloseDetail, handleLocate,
        filters, setFilters, rubrics,
        suggestions, setSuggestions, isSearching, fetchSuggestions,
        showFilters, setShowFilters,
        cityBoundary, showCityAlert, alertMessage, setShowCityAlert,
    };
}

// ─── Inline filters (shared) ──────────────────────────────────
function InlineFilters({
    state,
    isDarkMode
}: {
    state: ReturnType<typeof useMapState>,
    isDarkMode: boolean
}) {
    const { visibilityArea, city } = useThemeStore();
    const [openDropdown, setOpenDropdown] = useState<'rubrics' | 'ordering' | null>(null);

    const sortings = useMemo(() => [
        { label: 'Сначала новые', value: '-created_at' },
        { label: 'Сначала старые', value: 'created_at' },
    ], []);

    const currentSorting = useMemo(() => 
        sortings.find(s => s.value === (state.filters.ordering || '-created_at')) || sortings[0],
        [state.filters.ordering, sortings]
    );

    const selectedRubricsCount = useMemo(() => 
        state.filters.rubrics?.length || 0,
        [state.filters.rubrics]
    );

    const rubricsLabel = useMemo(() => 
        selectedRubricsCount === 0
            ? 'Все рубрики'
            : `Рубрики: ${selectedRubricsCount}`,
        [selectedRubricsCount]
    );

    return (
        <View className="bg-white dark:bg-[#1f2937] z-50">
            <View className="px-5 pt-4 pb-1 flex-row items-center justify-between">
                <Text className="font-bold text-gray-900 dark:text-slate-50 text-xl tracking-tight">
                    {state.searchQuery 
                        ? 'Результаты поиска' 
                        : visibilityArea && city 
                            ? `Лента: ${city}` 
                            : 'Лента происшествий'
                    }
                </Text>
                {Object.keys(state.filters).length > 0 && (
                    <TouchableOpacity
                        onPress={() => {
                            const newFilters = visibilityArea && city ? { city } : {};
                            state.setFilters(newFilters);
                        }}
                        className="bg-blue-500/10 dark:bg-blue-500/20 px-3 py-1.5 rounded-full"
                    >
                        <Text className="text-blue-500 font-semibold text-xs transition-all">Сбросить</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View className="relative">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' }}
                    className="flex-row"
                    style={Platform.OS === 'web' ? { overflowX: 'auto' } : {}}
                    nestedScrollEnabled={true}
                >
                    {/* Rubrics Dropdown Trigger */}
                    <TouchableOpacity
                        onPress={() => setOpenDropdown(openDropdown === 'rubrics' ? null : 'rubrics')}
                        className={`px-3 py-2 mr-3 rounded-xl border flex-row items-center gap-2 ${selectedRubricsCount > 0
                            ? 'bg-blue-500/10 border-blue-500/30'
                            : 'bg-gray-100/50 dark:bg-slate-800/40 border-gray-200/50 dark:border-slate-700/50'
                            }`}
                    >
                        <Text className={`text-[13px] font-medium ${selectedRubricsCount > 0 ? 'text-blue-500' : 'text-gray-500 dark:text-slate-400'}`}>
                            {rubricsLabel}
                        </Text>
                        <ChevronDown size={14} color={selectedRubricsCount > 0 ? '#3B82F6' : (isDarkMode ? '#94A3B8' : '#6B7280')} />
                    </TouchableOpacity>

                    {/* Sorting Dropdown Trigger */}
                    <TouchableOpacity
                        onPress={() => setOpenDropdown(openDropdown === 'ordering' ? null : 'ordering')}
                        className="px-3 py-2 mx-2 rounded-xl border border-gray-200/50 dark:border-slate-700/50 bg-gray-100/50 dark:bg-slate-800/40 flex-row items-center gap-2"
                    >
                        <Clock size={14} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
                        <Text className="text-[13px] font-medium text-gray-500 dark:text-slate-400">
                            {currentSorting.label}
                        </Text>
                        <ChevronDown size={14} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
                    </TouchableOpacity>
                </ScrollView>

                {/* Dropdown Menus */}
                {openDropdown === 'rubrics' && (
                    <View
                        className="absolute left-5 top-14 bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl z-[100] w-72 py-2 overflow-hidden"
                        style={{ elevation: 25 }}
                    >
                        <ScrollView style={{ maxHeight: 350 }}>
                            <TouchableOpacity
                                className={`px-5 py-3 border-b border-gray-50 dark:border-slate-800 ${!selectedRubricsCount ? 'bg-blue-500/5' : ''}`}
                                onPress={() => {
                                    state.setFilters({ ...state.filters, rubrics: undefined });
                                    setOpenDropdown(null);
                                }}
                            >
                                <Text className={`text-sm ${!selectedRubricsCount ? 'text-blue-500 font-bold' : 'text-gray-700 dark:text-slate-200'}`}>
                                    Все рубрики
                                </Text>
                            </TouchableOpacity>
                            {state.rubrics.map((rubric) => {
                                const isActive = state.filters.rubrics?.includes(rubric);
                                return (
                                    <TouchableOpacity
                                        key={rubric}
                                        className={`px-5 py-3 flex-row items-center justify-between ${isActive ? 'bg-blue-500/5' : ''}`}
                                        onPress={() => {
                                            const current = state.filters.rubrics || [];
                                            const newArr = isActive
                                                ? current.filter(r => r !== rubric)
                                                : [...current, rubric];
                                            state.setFilters({ ...state.filters, rubrics: newArr.length > 0 ? newArr : undefined });
                                        }}
                                    >
                                        <Text className={`text-sm flex-1 ${isActive ? 'text-blue-500 font-bold' : 'text-gray-700 dark:text-slate-200'}`}>
                                            {rubric}
                                        </Text>
                                        {isActive && <View className="w-2 h-2 rounded-full bg-blue-500" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {openDropdown === 'ordering' && (
                    <View
                        className="absolute right-5 top-14 bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl z-[100] w-56 py-2 overflow-hidden"
                        style={{ elevation: 25 }}
                    >
                        {sortings.map((s) => (
                            <TouchableOpacity
                                key={s.label}
                                className={`px-5 py-3 ${state.filters.ordering === s.value ? 'bg-blue-500/5' : ''}`}
                                onPress={() => {
                                    state.setFilters({ ...state.filters, ordering: s.value });
                                    setOpenDropdown(null);
                                }}
                            >
                                <Text className={`text-sm ${state.filters.ordering === s.value ? 'text-blue-500 font-bold' : 'text-gray-700 dark:text-slate-200'}`}>
                                    {s.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

// ─── Report detail view (shared) ──────────────────────────────
function ReportDetail({
    report,
    onClose,
}: {
    report: Report;
    onClose: () => void;
}) {
    const statusMap: Record<ReportStatus, { label: string, color: string, bg: string }> = {
        published: { label: 'Опубликовано', color: 'text-green-700', bg: 'bg-green-100' },
        check: { label: 'На рассмотрении', color: 'text-yellow-700', bg: 'bg-yellow-100' },
        draft: { label: 'Черновик', color: 'text-gray-600', bg: 'bg-gray-100' },
        archived: { label: 'В архиве', color: 'text-purple-700', bg: 'bg-purple-100' },
        banned: { label: 'Заблокировано', color: 'text-red-700', bg: 'bg-red-100' },
    };

    const status = statusMap[report.status] || statusMap.check;

    const handleAddReportHere = () => {
        router.push({
            pathname: '/(main)/create',
            params: {
                address: report.address || '',
                lat: String(report.latitude),
                lon: String(report.longitude),
            },
        });
    };

    return (
        <View>
                
            <View className="flex-row justify-between items-start">
                <View className={`${status.bg} px-2.5 py-1 rounded-full`}>
                    <Text className={`text-[10px] font-bold ${status.color} uppercase`}>
                        {status.label}
                    </Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                    <X size={24} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            <Text className="text-2xl font-bold mt-3 text-gray-900 dark:text-white">
                {report.title}
            </Text>

            <View className="flex-row items-center gap-2 mt-3 mb-4">
                <View className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-full items-center justify-center">
                    <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                        {report.author_username?.charAt(0) ?? '?'}
                    </Text>
                </View>
                <Text className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {report.author_username}
                </Text>
                <Text className="text-gray-400 dark:text-gray-500 text-sm">•</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">{report.created_at ? new Date(report.created_at).toLocaleDateString('ru-RU') : ''}</Text>
            </View>

            <View className="flex-row items-center gap-1 mb-2">
                <MapPin size={14} color="#9CA3AF" />
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {report.address || 'Адрес не указан'}
                </Text>
            </View>

            <View className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl mb-4 border border-gray-100 dark:border-gray-700">
                <Text className="text-gray-700 dark:text-gray-300 leading-6">
                    {report.description || report.title}
                </Text>
            </View>

            <View className="flex-row gap-3 mb-6">
                <TouchableOpacity className="flex-1 py-3 bg-blue-50 dark:bg-gray-800 rounded-xl flex-row items-center justify-center gap-2">
                    <Text className="text-blue-600 dark:text-blue-400 font-medium">
                        👍 Поддержать (0)
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl flex-row items-center justify-center gap-2 border border-gray-200 dark:border-gray-600">
                    <Text className="text-gray-700 dark:text-gray-300 font-medium">
                        💬 Обсудить (0)
                    </Text>
                </TouchableOpacity>
            </View>

            <Button
                title="Добавить жалобу здесь"
                onPress={handleAddReportHere}
                className="mt-2"
            />

        </View>
    );
}

// ═══════════════════════════════════════════════════════════════
// WEB LAYOUT
// ═══════════════════════════════════════════════════════════════
type PanelMode = 'collapsed' | 'dropdown' | 'open';

function WebMapScreen() {
    const state = useMapState();
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const user = useAuthStore((s) => s.user);
    const [panelMode, setPanelMode] = useState<PanelMode>('open');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const PANEL_WIDTH = 420;
    const isOpen = panelMode === 'open';

    const handleSearchChange = (value: string) => {
        state.setSearchQuery(value);
        state.fetchSuggestions(value);
    };

    const handleSearchSubmit = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && state.searchQuery.trim()) {
            setPanelMode('open');
            setIsSearchFocused(false);
        }
    };

    const handleSearchFocus = () => {
        setIsSearchFocused(true);
        if (panelMode === 'collapsed') setPanelMode('dropdown');
    };

    const handleSearchBlur = () => {
        setTimeout(() => setIsSearchFocused(false), 200);
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
                background: isOpen ? (isDarkMode ? '#1F2937' : '#F3F4F6') : (isDarkMode ? '#111827' : 'white'),
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
                onBlur={handleSearchBlur}
                style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 16,
                    fontWeight: 500,
                    color: isDarkMode ? '#FFFFFF' : '#111827',
                    padding: '0 10px',
                    height: '100%',
                    minWidth: 0,
                }}
            />
        </div>
    );

    return (
        <div style={{ width: '100%', height: '100dvh', position: 'relative' as const, overflow: 'hidden', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
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
                        background: isDarkMode ? '#1F2937' : 'white',
                        borderRadius: isOpen ? '16px 16px 16px 16px' : 16,
                        boxShadow: isOpen ? 'none' : (isDarkMode ? '0 2px 12px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.12)'),
                        border: isDarkMode ? '1px solid #374151' : 'none',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ padding: 0 }}>
                        {searchBar}
                    </div>

                    {/* Dropdown: history list */}
                    {((isSearchFocused || panelMode === 'dropdown') &&
                        ((state.searchQuery.length >= 3 && (state.isSearching || state.suggestions.length > 0)) || (!state.searchQuery && state.searchHistory.length > 0))) && (
                            <div
                                style={{
                                    padding: '0 16px 16px',
                                    maxHeight: 400,
                                    overflowY: 'auto' as const,
                                    scrollbarWidth: isDarkMode ? 'thin' : 'auto',
                                    scrollbarColor: isDarkMode ? '#4B5563 #1F2937' : 'auto'
                                }}
                            >
                                {state.searchQuery.length >= 3 && (state.isSearching || state.suggestions.length > 0) ? (
                                    <>
                                        {state.isSearching ? (
                                            <Text style={{ textAlign: 'center', padding: 16, color: '#9CA3AF' }}>Поиск...</Text>
                                        ) : (
                                            state.suggestions.map((item, idx) => {
                                                const shortAddress = item.street
                                                    ? `${item.street}${item.house ? ', ' + item.house : ''}${item.city ? ', ' + item.city : ''}`
                                                    : item.display_name;
                                                return (
                                                    <TouchableOpacity
                                                        key={idx}
                                                        onPress={() => {
                                                            state.setSearchQuery(shortAddress);
                                                            if (!state.searchHistory.includes(shortAddress)) {
                                                                state.setSearchHistory([shortAddress, ...state.searchHistory]);
                                                            }
                                                            state.setSuggestions([]);

                                                            const coord = { latitude: item.latitude, longitude: item.longitude };
                                                            state.setSelectedCoord(coord);
                                                            state.setSelectedAddress(shortAddress);
                                                            state.setActiveReports(null);
                                                            state.mapRef.current?.goToLocation(coord.latitude, coord.longitude);

                                                            setPanelMode('open');
                                                        }}
                                                        style={{
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 12,
                                                            paddingVertical: 10,
                                                            borderBottomWidth: idx < state.suggestions.length - 1 ? 1 : 0,
                                                            borderBottomColor: isDarkMode ? '#374151' : '#F3F4F6',
                                                        }}
                                                    >
                                                        <View style={{
                                                            width: 36, height: 36, borderRadius: 18,
                                                            backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                                                            alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <MapPin size={16} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
                                                        </View>
                                                        <Text style={{ fontSize: 14, color: isDarkMode ? '#D1D5DB' : '#374151', flex: 1 }}>{shortAddress}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })
                                        )}
                                    </>
                                ) : (
                                    state.searchHistory.length > 0 ? (
                                        <>
                                            <View className="flex-row justify-between items-center mb-3">
                                                <Text style={{ fontWeight: '700', fontSize: 16, color: isDarkMode ? '#F9FAFB' : '#111827' }}>
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
                                                        borderBottomColor: isDarkMode ? '#374151' : '#F3F4F6',
                                                    }}
                                                >
                                                    <View style={{
                                                        width: 36, height: 36, borderRadius: 18,
                                                        backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                                                        alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <Search size={16} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
                                                    </View>
                                                    <Text style={{ fontSize: 14, color: isDarkMode ? '#D1D5DB' : '#374151', flex: 1 }}>{item}</Text>
                                                    <Clock size={14} color={isDarkMode ? '#6B7280' : '#D1D5DB'} />
                                                </TouchableOpacity>
                                            ))}
                                        </>
                                    ) : (
                                        <Text style={{ color: '#9CA3AF', textAlign: 'center', padding: 16 }}>
                                            История поиска пуста
                                        </Text>
                                    )
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
                        border: isDarkMode ? '1px solid #374151' : 'none',
                        background: isDarkMode ? '#111827' : 'white',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isDarkMode ? '0 2px 12px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.12)',
                        flexShrink: 0,
                    }}
                >
                    {isOpen ? (
                        <ChevronLeft size={20} color={isDarkMode ? '#D1D5DB' : '#374151'} />
                    ) : (
                        <ChevronRight size={20} color={isDarkMode ? '#D1D5DB' : '#374151'} />
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
                        backgroundColor: isDarkMode ? '#1F2937' : 'white',
                        borderRight: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                        display: 'flex',
                        flexDirection: 'column' as const,
                        zIndex: 20,
                        boxShadow: isDarkMode ? '4px 0 16px rgba(0,0,0,0.3)' : '4px 0 16px rgba(0,0,0,0.08)',
                        paddingTop: 84,
                    }}
                >
                    {/* Sidebar content */}
                    <div style={{ flex: 1, overflowY: 'auto' as const, padding: '0 16px 16px', scrollbarWidth: isDarkMode ? 'thin' : 'auto', scrollbarColor: isDarkMode ? '#4B5563 #1F2937' : 'auto' }}>
                        {state.singleReport ? (
                            <ReportDetail report={state.singleReport} onClose={state.handleCloseDetail} />
                        ) : state.activeReports && state.activeReports.length > 0 ? (
                            <View>
                                <View className="flex-row justify-between items-center mb-4 py-2 border-b border-gray-50 dark:border-gray-800">
                                    <View>
                                        <Text className="font-bold text-lg text-gray-900 dark:text-gray-100">Жалобы по адресу</Text>
                                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                                            {state.activeReports[0].address || 'Адрес не определен'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={state.handleCloseDetail}>
                                        <X size={24} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>
                                <Button
                                    title="Добавить жалобу здесь"
                                    onPress={() => router.push({
                                        pathname: '/(main)/create',
                                        params: {
                                            address: state.activeReports?.[0]?.address || '',
                                            lat: String(state.activeReports?.[0]?.latitude),
                                            lon: String(state.activeReports?.[0]?.longitude),
                                        },
                                    })}
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
                                <InlineFilters state={state} isDarkMode={isDarkMode} />

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
                    <div style={{ padding: 16 }}>
                        <Button
                            title="+ Сообщить о проблеме"
                            onPress={() => router.push({
                                pathname: '/(main)/create',
                                params: {
                                    ...(state.userAddress ? { address: state.userAddress } : {}),
                                    ...(state.userLocation ? { lat: String(state.userLocation.latitude), lon: String(state.userLocation.longitude) } : {}),
                                },
                            })}
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
                    border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                    background: isDarkMode ? '#1F2937' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: isDarkMode ? '#FFFFFF' : '#111827',
                    boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.12)',
                }}
            >{user?.username?.charAt(0)?.toUpperCase() ?? '?'}</button>

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
                        border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                        background: isDarkMode ? '#1F2937' : 'white',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.12)',
                    }}
                >
                    <Plus size={22} color={isDarkMode ? '#D1D5DB' : '#374151'} />
                </button>
                <button
                    onClick={() => state.mapRef.current?.zoomOut()}
                    style={{
                        width: 44, height: 44,
                        borderRadius: '50%',
                        border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                        background: isDarkMode ? '#1F2937' : 'white',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.12)',
                    }}
                >
                    <Minus size={22} color={isDarkMode ? '#D1D5DB' : '#374151'} />
                </button>
                <button
                    onClick={() => state.handleLocate()}
                    style={{
                        width: 44, height: 44,
                        borderRadius: '50%',
                        border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                        background: isDarkMode ? '#1F2937' : 'white',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.12)',
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
                    <View className={`p-5 rounded-3xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                        <View className="flex-row justify-between items-start mb-2">
                            <View style={{ flex: 1, marginRight: 12 }}>
                                <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Новая метка</Text>
                                {state.selectedAddress && (
                                    <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={{ marginTop: 4 }}>
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
                            onPress={() => router.push({
                                pathname: '/(main)/create',
                                params: {
                                    ...(state.selectedAddress ? { address: state.selectedAddress } : {}),
                                    lat: String(state.selectedCoord!.latitude),
                                    lon: String(state.selectedCoord!.longitude),
                                },
                            })}
                        />
                    </View>
                </div>
            )}
            
            {/* City boundary alert for web */}
            {state.showCityAlert && (
                <div
                    style={{
                        position: 'absolute' as const,
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                    }}
                    onClick={() => state.setShowCityAlert(false)}
                >
                    <div
                        style={{
                            backgroundColor: isDarkMode ? '#1F2937' : 'white',
                            borderRadius: 16,
                            padding: 24,
                            maxWidth: 400,
                            width: '90%',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            border: isDarkMode ? '1px solid #374151' : 'none',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ 
                                fontSize: 18, 
                                fontWeight: 600, 
                                color: isDarkMode ? '#F9FAFB' : '#111827',
                                marginBottom: 8,
                            }}>
                                Внимание
                            </div>
                            <div style={{ 
                                fontSize: 14, 
                                color: isDarkMode ? '#D1D5DB' : '#374151',
                                lineHeight: 1.5,
                            }}>
                                {state.alertMessage}
                            </div>
                        </div>
                        <button
                            onClick={() => state.setShowCityAlert(false)}
                            style={{
                                backgroundColor: '#3B82F6',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                padding: '12px 24px',
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: 'pointer',
                                width: '100%',
                            }}
                        >
                            Понятно
                        </button>
                    </div>
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
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const user = useAuthStore((s) => s.user);

    // Bottom sheet snap points
    const SNAP_PEEK = 80;
    const SNAP_HALF = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.45) : 400;
    const SNAP_FULL = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.8) : 700;
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

    const handleSelectSuggestion = useCallback((item: AddressSearchResult) => {
        const shortAddress = item.street
            ? `${item.street}${item.house ? ', ' + item.house : ''}${item.city ? ', ' + item.city : ''}`
            : item.display_name;

        state.setSearchQuery(shortAddress);
        if (!state.searchHistory.includes(shortAddress)) {
            state.setSearchHistory([shortAddress, ...state.searchHistory]);
        }
        state.setSuggestions([]);

        const coord = { latitude: item.latitude, longitude: item.longitude };
        state.setSelectedCoord(coord);
        state.setSelectedAddress(shortAddress);
        state.setActiveReports(null);

        state.mapRef.current?.goToLocation(coord.latitude, coord.longitude);

        setSearchFocused(false);
        searchInputRef.current?.blur();
        setSheetHeight(SNAP_PEEK);
    }, [state, SNAP_PEEK]);

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
        <div style={{ width: '100%', height: '100dvh', position: 'relative' as const, overflow: 'hidden', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
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
                {/* Search Bar with integrated filter button */}
                <div
                    style={{
                        background: isDarkMode ? '#1F2937' : 'white',
                        borderRadius: 14,
                        boxShadow: isDarkMode ? '0 2px 12px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.12)',
                        border: isDarkMode ? '1px solid #374151' : 'none',
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
                        onChange={(e) => {
                            state.setSearchQuery(e.target.value);
                            state.fetchSuggestions(e.target.value);
                        }}
                        onKeyDown={handleSearchSubmit}
                        onFocus={() => setSearchFocused(true)}
                        style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 14,
                            color: isDarkMode ? '#FFFFFF' : '#111827',
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
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 8 }}>
                    <button
                        onClick={() => router.push('/(main)/profile')}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                            background: isDarkMode ? '#1F2937' : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            fontWeight: 'bold',
                            color: isDarkMode ? '#FFFFFF' : '#111827',
                            boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.12)',
                        }}
                    >
                        {user?.username?.charAt(0)?.toUpperCase() ?? '?'}
                    </button>
                </div>

                {/* Search history or suggestions dropdown */}
                {(searchFocused && sheetHeight <= SNAP_PEEK &&
                    ((state.searchQuery.length >= 3 && (state.isSearching || state.suggestions.length > 0)) || (!state.searchQuery && state.searchHistory.length > 0))) && (
                        <div
                            style={{
                                marginTop: 4,
                                background: isDarkMode ? '#1F2937' : 'white',
                                borderRadius: 14,
                                boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.12)',
                                border: isDarkMode ? '1px solid #374151' : 'none',
                                padding: 12,
                                maxHeight: 300,
                                overflowY: 'auto' as const,
                                scrollbarWidth: isDarkMode ? 'thin' : 'auto',
                                scrollbarColor: isDarkMode ? '#4B5563 #1F2937' : 'auto',
                            }}
                        >
                            {state.searchQuery.length >= 3 && (state.isSearching || state.suggestions.length > 0) ? (
                                <>
                                    {state.isSearching ? (
                                        <Text style={{ textAlign: 'center', padding: 12, color: '#9CA3AF' }}>Поиск...</Text>
                                    ) : (
                                        state.suggestions.map((item, idx) => {
                                            const shortAddress = item.street
                                                ? `${item.street}${item.house ? ', ' + item.house : ''}${item.city ? ', ' + item.city : ''}`
                                                : item.display_name;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSelectSuggestion(item)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                        width: '100%',
                                                        padding: '10px 0',
                                                        background: 'none',
                                                        border: 'none',
                                                        borderBottom: idx < state.suggestions.length - 1 ? '1px solid #F3F4F6' : 'none',
                                                        cursor: 'pointer',
                                                        textAlign: 'left' as const,
                                                    }}
                                                >
                                                    <div style={{
                                                        width: 36, height: 36, borderRadius: 18,
                                                        backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}>
                                                        <MapPin size={16} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
                                                    </div>
                                                    <span style={{ fontSize: 14, color: isDarkMode ? '#D1D5DB' : '#374151', flex: 1 }}>{shortAddress}</span>
                                                </button>
                                            );
                                        })
                                    )}
                                </>
                            ) : (
                                (!state.searchQuery && state.searchHistory.length > 0) ? (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <span style={{ fontWeight: 700, fontSize: 14, color: isDarkMode ? '#F9FAFB' : '#111827' }}>История</span>
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
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 18,
                                                    backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}>
                                                    <Search size={16} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
                                                </div>
                                                <span style={{ fontSize: 14, color: isDarkMode ? '#D1D5DB' : '#374151', flex: 1 }}>{item}</span>
                                                <Clock size={14} color={isDarkMode ? '#6B7280' : '#D1D5DB'} />
                                            </button>
                                        ))}
                                    </>
                                ) : null
                            )}
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
                    { Icon: Plus, action: () => state.mapRef.current?.zoomIn() },
                    { Icon: Minus, action: () => state.mapRef.current?.zoomOut() },
                ].map((btn, i) => (
                    <button
                        key={i}
                        onClick={btn.action}
                        style={{
                            width: 44, height: 44, borderRadius: 22,
                            border: isDarkMode ? '1px solid #374151' : 'none',
                            background: isDarkMode ? '#1F2937' : 'white', cursor: 'pointer',
                            boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0,
                        }}
                    >
                        <btn.Icon size={22} color={isDarkMode ? '#D1D5DB' : '#374151'} />
                    </button>
                ))}
                <button
                    onClick={() => state.handleLocate()}
                    style={{
                        width: 44, height: 44, borderRadius: 22,
                        border: isDarkMode ? '1px solid #374151' : 'none',
                        background: isDarkMode ? '#1F2937' : 'white', cursor: 'pointer',
                        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.12)',
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
                    onClick={() => router.push({
                        pathname: '/(main)/create',
                        params: {
                            ...(state.userAddress ? { address: state.userAddress } : {}),
                            ...(state.userLocation ? { lat: String(state.userLocation.latitude), lon: String(state.userLocation.longitude) } : {}),
                        },
                    } as any)}
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
                        background: isDarkMode ? '#1F2937' : 'white',
                        border: isDarkMode ? '1px solid #374151' : 'none',
                        borderRadius: 20,
                        boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.15)',
                        padding: 20,
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ flex: 1, marginRight: 12 }}>
                            <div style={{ fontWeight: 700, fontSize: 16, color: isDarkMode ? '#F9FAFB' : '#111827' }}>Новая метка</div>
                            {state.selectedAddress && (
                                <div style={{ color: isDarkMode ? '#D1D5DB' : '#374151', fontSize: 14, marginTop: 4 }}>
                                    {state.selectedAddress}
                                </div>
                            )}
                            <div style={{ color: isDarkMode ? '#9CA3AF' : '#9CA3AF', fontSize: 11, marginTop: 4 }}>
                                {state.selectedCoord?.latitude.toFixed(6)},{' '}
                                {state.selectedCoord?.longitude.toFixed(6)}
                            </div>
                        </div>

                        <button
                            onClick={() => state.setSelectedCoord(null)}
                            style={{
                                background: isDarkMode ? '#374151' : '#F3F4F6', border: 'none', borderRadius: 20,
                                width: 36, height: 36, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <X size={18} color={isDarkMode ? '#D1D5DB' : '#374151'} />
                        </button>
                    </div>
                    <Button
                        title="Сообщить о проблеме"
                        onPress={() => router.push({
                            pathname: '/(main)/create',
                            params: {
                                ...(state.selectedAddress ? { address: state.selectedAddress } : {}),
                                lat: String(state.selectedCoord!.latitude),
                                lon: String(state.selectedCoord!.longitude),
                            },
                        })}
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
                    background: isDarkMode ? '#1F2937' : 'white',
                    borderRadius: '20px 20px 0 0',
                    boxShadow: isDarkMode ? '0 -4px 20px rgba(0,0,0,0.4)' : '0 -4px 20px rgba(0,0,0,0.1)',
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
                <div style={{ flex: 1, overflowY: sheetHeight > SNAP_PEEK ? 'auto' : 'hidden', padding: '0 16px 16px', scrollbarWidth: isDarkMode ? 'thin' : 'auto', scrollbarColor: isDarkMode ? '#4B5563 #1F2937' : 'auto' }}>
                    {state.singleReport ? (
                        <ReportDetail report={state.singleReport} onClose={() => {
                            executeCloseDetail();
                        }} />
                    ) : state.activeReports && state.activeReports.length > 0 ? (
                        <View>
                            <View className="flex-row justify-between items-center mb-4 py-2 border-b border-gray-50">
                                <View>
                                        <Text className="font-bold text-lg text-gray-900 dark:text-gray-100">Жалобы по адресу</Text>
                                        <Text className="text-xs text-gray-500 dark:text-gray-400">
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
                                onPress={() => router.push({
                                    pathname: '/(main)/create',
                                    params: {
                                        address: state.activeReports?.[0]?.address || '',
                                        lat: String(state.activeReports?.[0]?.latitude),
                                        lon: String(state.activeReports?.[0]?.longitude)
                                    }
                                })}
                                className="mb-4"
                            />
                            {state.activeReports?.map((item) => (
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
                            <InlineFilters state={state} isDarkMode={isDarkMode} />

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

            {/* City boundary alert for mobile web */}
            {state.showCityAlert && (
                <div
                    style={{
                        position: 'absolute' as const,
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                    }}
                    onClick={() => state.setShowCityAlert(false)}
                >
                    <div
                        style={{
                            backgroundColor: isDarkMode ? '#1F2937' : 'white',
                            borderRadius: 16,
                            padding: 24,
                            maxWidth: 400,
                            width: '90%',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            border: isDarkMode ? '1px solid #374151' : 'none',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ 
                                fontSize: 18, 
                                fontWeight: 600, 
                                color: isDarkMode ? '#F9FAFB' : '#111827',
                                marginBottom: 8,
                            }}>
                                Внимание
                            </div>
                            <div style={{ 
                                fontSize: 14, 
                                color: isDarkMode ? '#D1D5DB' : '#374151',
                                lineHeight: 1.5,
                            }}>
                                {state.alertMessage}
                            </div>
                        </div>
                        <button
                            onClick={() => state.setShowCityAlert(false)}
                            style={{
                                backgroundColor: '#3B82F6',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                padding: '12px 24px',
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: 'pointer',
                                width: '100%',
                            }}
                        >
                            Понятно
                        </button>
                    </div>
                </div>
            )}
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
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const user = useAuthStore((s) => s.user);

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

    const handleSelectSuggestion = useCallback((item: AddressSearchResult) => {
        const shortAddress = item.street
            ? `${item.street}${item.house ? ', ' + item.house : ''}${item.city ? ', ' + item.city : ''}`
            : item.display_name;

        state.setSearchQuery(shortAddress);
        if (!state.searchHistory.includes(shortAddress)) {
            state.setSearchHistory([shortAddress, ...state.searchHistory]);
        }
        state.setSuggestions([]);

        const coord = { latitude: item.latitude, longitude: item.longitude };
        state.setSelectedCoord(coord);
        state.setSelectedAddress(shortAddress);
        state.setActiveReports(null);

        state.mapRef.current?.goToLocation(coord.latitude, coord.longitude);

        setSearchFocused(false);
        searchInputRef.current?.blur();
        Keyboard.dismiss();
    }, [state]);

    return (
        <View className="flex-1 dark:bg-gray-900 bg-white">
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
                >
                    <TouchableOpacity
                        onPress={() => router.push('/(main)/profile')}
                        className={`w-12 h-12 rounded-full shadow-lg items-center justify-center border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                    >
                        <Text className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {user?.username?.charAt(0)?.toUpperCase() ?? '?'}</Text>
                    </TouchableOpacity>
                </SafeAreaView>

                {/* Zoom controls */}
                <View
                    className="absolute right-4 gap-3"
                    style={{ top: '35%', zIndex: 10 }}
                >
                    <TouchableOpacity
                        onPress={() => state.mapRef.current?.zoomIn()}
                        className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg items-center justify-center border border-gray-100 dark:border-gray-700"
                    >
                        <Plus size={24} color={isDarkMode ? '#F3F4F6' : '#374151'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => state.mapRef.current?.zoomOut()}
                        className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg items-center justify-center border border-gray-100 dark:border-gray-700"
                    >
                        <Minus size={24} color={isDarkMode ? '#F3F4F6' : '#374151'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={state.handleLocate}
                        className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg items-center justify-center border border-gray-100 dark:border-gray-700 mt-4"
                    >
                        <Locate size={24} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
                    </TouchableOpacity>
                </View>

                {/* FAB */}
                {!state.selectedCoord && !state.activeReports && (
                    <TouchableOpacity
                        onPress={() => router.push({
                            pathname: '/(main)/create',
                            params: {
                                ...(state.userAddress ? { address: state.userAddress } : {}),
                                ...(state.userLocation ? { lat: String(state.userLocation.latitude), lon: String(state.userLocation.longitude) } : {}),
                            },
                        })}
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
                    <View className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                        <View className="flex-row justify-between items-start mb-2">
                            <View style={{ flex: 1, marginRight: 12 }}>
                                <Text className="font-bold text-lg dark:text-gray-100">{"\u041d\u043e\u0432\u0430\u044f \u043c\u0435\u0442\u043a\u0430"}</Text>
                                {state.selectedAddress && (
                                    <Text className="text-gray-700 dark:text-gray-300 text-sm mt-1" numberOfLines={2}>
                                        {state.selectedAddress}
                                    </Text>
                                )}
                                <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                                    {state.selectedCoord.latitude.toFixed(6)},{' '}
                                    {state.selectedCoord.longitude.toFixed(6)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => state.setSelectedCoord(null)}
                                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full"
                            >
                                <X size={20} color={isDarkMode ? '#D1D5DB' : '#374151'} />
                            </TouchableOpacity>
                        </View>
                        <Button
                            title="Сообщить о проблеме"
                            onPress={() => router.push({
                                pathname: '/(main)/create',
                                params: {
                                    ...(state.selectedAddress ? { address: state.selectedAddress } : {}),
                                    lat: String(state.selectedCoord!.latitude),
                                    lon: String(state.selectedCoord!.longitude),
                                },
                            })}
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
                    {/* Single report detail */}
                    {state.singleReport ? (
                        <BottomSheetScrollView contentContainerStyle={{ padding: 20 }}>
                            <ReportDetail report={state.singleReport} onClose={handleCloseDetail} />
                        </BottomSheetScrollView>

                    ) : state.activeReports && state.activeReports.length > 0 ? (
                        <View className="flex-1 px-5 pb-5">
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
                                onPress={() => router.push({
                                    pathname: '/(main)/create',
                                    params: {
                                        address: state.activeReports?.[0]?.address || '',
                                        lat: String(state.activeReports?.[0]?.latitude),
                                        lon: String(state.activeReports?.[0]?.longitude)
                                    }
                                })}
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
                                showsVerticalScrollIndicator={true}
                                indicatorStyle={isDarkMode ? 'white' : 'default'}
                            />
                        </View>

                    ) : (
                        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }}>
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
                                                        <MapPin size={16} color={isDarkMode ? '#9CA3AF' : '#6B7280'} className="mr-3" />
                                                        <Text className="flex-1 text-gray-900 dark:text-gray-100">{shortAddress}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })
                                        )}
                                    </View>
                                ) : (
                                    <>
                                        {!state.searchQuery && state.searchHistory.length > 0 && (
                                            <View className="mb-6">
                                                <View className="flex-row justify-between items-center mb-3">
                                                    <Text className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                                                        История поиска
                                                    </Text>
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
                                        )}
                                    </>
                                )}

                                <InlineFilters state={state} isDarkMode={isDarkMode} />

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

            {/* City boundary alert for native */}
            {state.showCityAlert && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: isDarkMode ? '#1F2937' : 'white',
                            borderRadius: 16,
                            padding: 24,
                            maxWidth: 400,
                            width: '90%',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 20 },
                            shadowOpacity: 0.25,
                            shadowRadius: 25,
                            elevation: 20,
                            borderWidth: isDarkMode ? 1 : 0,
                            borderColor: isDarkMode ? '#374151' : 'transparent',
                        }}
                    >
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ 
                                fontSize: 18, 
                                fontWeight: '600', 
                                color: isDarkMode ? '#F9FAFB' : '#111827',
                                marginBottom: 8,
                            }}>
                                Внимание
                            </Text>
                            <Text style={{ 
                                fontSize: 14, 
                                color: isDarkMode ? '#D1D5DB' : '#374151',
                                lineHeight: 20,
                            }}>
                                {state.alertMessage}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => state.setShowCityAlert(false)}
                            style={{
                                backgroundColor: '#3B82F6',
                                borderRadius: 8,
                                paddingVertical: 12,
                                paddingHorizontal: 24,
                                width: '100%',
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{
                                color: 'white',
                                fontSize: 14,
                                fontWeight: '500',
                            }}>
                                Понятно
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
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