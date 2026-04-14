import { ReportFilters } from '@/src/components/FiltersModal';
import { addressService } from '@/src/services/address';
import { useReportsStore } from '@/src/store/reportsStore';
import { useRubricsStore } from '@/src/store/rubricsStore';
import { useThemeStore } from '@/src/store/themeStore';
import { AddressSearchResult, MapViewRef, Report } from '@/src/types';
import { CityBoundaryData, fetchCityBoundary, isPointInPolygon } from '@/src/utils/fetchCityBoundary';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

export function useMapState() {
    const visibilityArea = useThemeStore((s) => s.visibilityArea);
    const city = useThemeStore((s) => s.city);
    const feedReports = useReportsStore((s) => s.feedReports);
    const myReports = useReportsStore((s) => s.myReports);
    const isFeedLoading = useReportsStore((s) => s.isFeedLoading);
    const isMyLoading = useReportsStore((s) => s.isMyLoading);
    const fetchFeed = useReportsStore((s) => s.fetchFeed);
    const fetchMine = useReportsStore((s) => s.fetchMine);
    const [showMine, setShowMine] = useState(false);
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

    // Очистка таймаута при размонтировании
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const mapRef = useRef<MapViewRef>(null);

    // Получение подсказок адресов
    const fetchSuggestions = useCallback((query: string) => {
        if (query.trim().length < 3) {
            setSuggestions([]);
            return;
        }
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                // При включенной области видимости ограничиваем поиск городом
                const cityFilter = visibilityArea && city ? city : undefined;
                const results = await addressService.search(query, 5, cityFilter);
                setSuggestions(results);
            } catch {
                // игнорируем
            } finally {
                setIsSearching(false);
            }
        }, 500);
    }, [visibilityArea, city]);

    // Получение отчетов через API (с кэшированием)
    const fetchReports = useCallback(async (currentFilters?: ReportFilters) => {
        let finalFilters = currentFilters || filters;
        if (visibilityArea && city) {
            finalFilters = { ...finalFilters, city };
        }
        await fetchFeed(finalFilters);
    }, [filters, visibilityArea, city, fetchFeed]);

    // Получение названий рубрик из хранилища
    const rubricNames = useRubricsStore((s) => s.rubrics).map((r) => r.name);

    // Загрузка начальных данных
    useEffect(() => {
        let isMounted = true;

        const loadInitialData = async () => {
            await useRubricsStore.getState().fetchRubrics();
            if (isMounted) {
                setRubrics(rubricNames);
            }

            // Загрузка границ города при включенной области видимости
            if (visibilityArea && city) {
                try {
                    const boundaryData = await fetchCityBoundary(city);
                    if (isMounted) {
                        setCityBoundary(boundaryData);
                    }
                } catch {
                    // игнорируем
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

    useEffect(() => {
        fetchReports(filters);
    }, [filters]);

    useEffect(() => {
        if (showMine) {
            fetchMine();
        }
    }, [showMine, fetchMine]);

    const displayReports = useMemo(() => showMine ? myReports : feedReports, [showMine, myReports, feedReports]);

    const singleReport = activeReports?.length === 1 ? activeReports[0] : null;

    const filteredReports = useMemo(() => {
        let result = displayReports;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (r) =>
                    r.title?.toLowerCase().includes(q) ||
                    r.address?.toLowerCase().includes(q)
            );
        }

        if (filters.rubrics && filters.rubrics.length > 0) {
            result = result.filter(
                (r) => r.rubric_name && filters.rubrics!.includes(r.rubric_name)
            );
        }

        const ordering = filters.ordering || '-created_at';
        result = [...result].sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return ordering === 'created_at' ? dateA - dateB : dateB - dateA;
        });

        return result;
    }, [displayReports, searchQuery, filters.rubrics, filters.ordering]);

    const handleMapPress = useCallback(
        async (coordinate: { latitude: number; longitude: number }) => {
            setActiveReports(null);

            // Проверка точки за пределами города при включенной области видимости
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
            
            // Перемещаем камеру к выбранной точке
            mapRef.current?.goToLocation(coordinate.latitude, coordinate.longitude);

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
        
        // Перемещаем камеру к метке
        if (clusterReports.length > 0) {
            const first = clusterReports[0];
            mapRef.current?.goToLocation(first.latitude, first.longitude);
        }
    }, []);

    const handleCloseDetail = useCallback(() => {
        setActiveReports(null);
        setSelectedCoord(null);
        setSelectedAddress(null);
    }, []);

    const handleLocate = useCallback(async () => {
        try {
            const hasServices = await Location.hasServicesEnabledAsync();
            if (!hasServices) {
                Alert.alert('Службы выключены', 'Пожалуйста, включите GPS (геолокацию) на устройстве.');
                return;
            }

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Геолокация', 'Нет доступа к геолокации. Разрешите доступ в настройках устройства.');
                return;
            }
            
            let loc = null;
            try {
                loc = await Location.getLastKnownPositionAsync();
            } catch (e) {}
            
            if (!loc) {
                loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            }

            if (!loc) {
                Alert.alert('Ошибка', 'Устройство не отдало координаты');
                return;
            }

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
        } catch (e: any) {
            Alert.alert('Ошибка', 'Не удалось определить местоположение. ' + (e.message || ''));
        }
    }, []);

    const handleSelectSuggestion = useCallback((item: AddressSearchResult) => {
        const shortAddress = item.street
            ? `${item.street}${item.house ? ', ' + item.house : ''}${item.city ? ', ' + item.city : ''}`
            : item.display_name;

        setSearchQuery(shortAddress);
        if (!searchHistory.includes(shortAddress)) {
            setSearchHistory([shortAddress, ...searchHistory]);
        }
        setSuggestions([]);

        const coord = { latitude: item.latitude, longitude: item.longitude };
        setSelectedCoord(coord);
        setSelectedAddress(shortAddress);
        setActiveReports(null);

        mapRef.current?.goToLocation(coord.latitude, coord.longitude);

        return shortAddress;
    }, [searchHistory]);

    return {
        reports: displayReports, selectedCoord, setSelectedCoord,
        selectedAddress, setSelectedAddress,
        activeReports, setActiveReports,
        searchQuery, setSearchQuery,
        searchHistory, setSearchHistory,
        mapRef, singleReport, filteredReports,
        userLocation, userAddress,
        isLoadingReports: isFeedLoading || isMyLoading, fetchReports,
        handleMapPress, handleMarkerPress, handleCloseDetail, handleLocate,
        handleSelectSuggestion,
        filters, setFilters, rubrics,
        suggestions, setSuggestions, isSearching, fetchSuggestions,
        showFilters, setShowFilters,
        showMine, setShowMine,
        cityBoundary, showCityAlert, alertMessage, setShowCityAlert,
    };
}

