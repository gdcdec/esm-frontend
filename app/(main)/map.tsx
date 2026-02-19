import { AppMapView } from '@/src/components/MapView';
import { ReportCard } from '@/src/components/ReportCard';
import { Button } from '@/src/components/ui';
import { MOCK_REPORTS } from '@/src/constants/mock-data';
import { Report } from '@/src/types';
import { router } from 'expo-router';
import {
    Clock,
    Locate,
    MapPin,
    Minus,
    Plus,
    Search,
    X,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Dimensions,
    FlatList,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MIN = 96;
const SHEET_MAX = SCREEN_HEIGHT * 0.85;

export default function MapScreen() {
    const [reports] = useState<Report[]>(MOCK_REPORTS);
    const [selectedCoord, setSelectedCoord] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [activeReports, setActiveReports] = useState<Report[] | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchHistory, setSearchHistory] = useState([
        'ул. Пушкина, 10',
        'Парк Горького',
        'Центральный рынок',
    ]);

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
            setIsSheetOpen(false);
        },
        []
    );

    const handleMarkerPress = useCallback((clusterReports: Report[]) => {
        setSelectedCoord(null);
        setActiveReports(clusterReports);
        setIsSheetOpen(true);
    }, []);

    const handleAddReport = () => {
        router.push('/(main)/create');
    };

    return (
        <View className="flex-1 bg-white">
            {/* Map */}
            <View className="flex-1">
                <AppMapView
                    reports={reports}
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
                    style={{ top: '40%', zIndex: 10 }}
                >
                    <TouchableOpacity className="w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center border border-gray-100">
                        <Plus size={24} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity className="w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center border border-gray-100">
                        <Minus size={24} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity className="w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center border border-gray-100 mt-4">
                        <Locate size={24} color="#2563EB" />
                    </TouchableOpacity>
                </View>

                {/* FAB — Add report */}
                {!selectedCoord && !activeReports && (
                    <TouchableOpacity
                        onPress={handleAddReport}
                        className="absolute bottom-28 right-4 w-14 h-14 bg-blue-600 rounded-full shadow-xl items-center justify-center"
                        style={{ zIndex: 10 }}
                    >
                        <Plus size={32} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Selected point card */}
            {selectedCoord && (
                <View className="absolute bottom-0 w-full p-4" style={{ zIndex: 30 }}>
                    <View className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100">
                        <View className="flex-row justify-between items-start mb-2">
                            <View>
                                <Text className="font-bold text-lg">Новая метка</Text>
                                <Text className="text-gray-900 font-medium">
                                    {selectedCoord.latitude.toFixed(4)},{' '}
                                    {selectedCoord.longitude.toFixed(4)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setSelectedCoord(null)}
                                className="p-2 bg-gray-100 rounded-full"
                            >
                                <X size={20} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <Button
                            title="Сообщить о проблеме"
                            onPress={handleAddReport}
                        />
                    </View>
                </View>
            )}

            {/* Bottom Sheet */}
            {!selectedCoord && (
                <View
                    className="absolute bottom-0 w-full bg-white rounded-t-[30px] shadow-lg"
                    style={{
                        height: isSheetOpen ? SHEET_MAX : SHEET_MIN,
                        zIndex: 20,
                    }}
                >
                    {/* Pull handle */}
                    <TouchableOpacity
                        className="w-full pt-3 pb-1 items-center"
                        onPress={() => setIsSheetOpen(!isSheetOpen)}
                    >
                        <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
                    </TouchableOpacity>

                    {/* Single report detail */}
                    {singleReport ? (
                        <ScrollView className="flex-1 px-5 pb-5">
                            <View className="flex-row justify-between items-start">
                                <View className="bg-green-100 px-2.5 py-1 rounded-full">
                                    <Text className="text-[10px] font-bold text-green-700 uppercase">
                                        {singleReport.status === 'solved'
                                            ? 'Решено'
                                            : singleReport.status === 'progress'
                                                ? 'В работе'
                                                : 'На рассмотрении'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        setActiveReports(null);
                                        setIsSheetOpen(false);
                                    }}
                                >
                                    <X size={24} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            <Text className="text-2xl font-bold mt-3 text-gray-900">
                                {singleReport.title}
                            </Text>

                            <View className="flex-row items-center gap-2 mt-3 mb-4">
                                <View className="w-6 h-6 bg-blue-100 rounded-full items-center justify-center">
                                    <Text className="text-blue-600 font-bold text-xs">
                                        {singleReport.author.charAt(0)}
                                    </Text>
                                </View>
                                <Text className="font-medium text-gray-900 text-sm">
                                    {singleReport.author}
                                </Text>
                                <Text className="text-gray-400 text-sm">•</Text>
                                <Text className="text-gray-500 text-sm">{singleReport.date}</Text>
                            </View>

                            <View className="flex-row items-center gap-1 mb-2">
                                <MapPin size={14} color="#9CA3AF" />
                                <Text className="text-sm text-gray-500">
                                    {singleReport.address || 'Адрес не указан'}
                                </Text>
                            </View>

                            <View className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
                                <Text className="text-gray-700 leading-6">
                                    {singleReport.desc || singleReport.title}
                                </Text>
                            </View>

                            <View className="flex-row gap-3 mb-6">
                                <TouchableOpacity className="flex-1 py-3 bg-blue-50 rounded-xl flex-row items-center justify-center gap-2">
                                    <Text className="text-blue-600 font-medium">
                                        👍 Поддержать ({singleReport.likes})
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity className="flex-1 py-3 bg-gray-100 rounded-xl flex-row items-center justify-center gap-2">
                                    <Text className="text-gray-700 font-medium">
                                        💬 Обсудить ({singleReport.comments})
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                    ) : activeReports && activeReports.length > 1 ? (
                        /* Cluster list */
                        <View className="flex-1 px-5 pb-5">
                            <View className="flex-row justify-between items-center mb-4 py-2 border-b border-gray-50">
                                <View>
                                    <Text className="font-bold text-lg">Жалобы по адресу</Text>
                                    <Text className="text-xs text-gray-500">
                                        {activeReports[0].address || 'Адрес не определен'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        setActiveReports(null);
                                        setIsSheetOpen(false);
                                    }}
                                >
                                    <X size={24} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            <Button
                                title="Добавить жалобу здесь"
                                onPress={handleAddReport}
                                className="mb-4"
                            />

                            <FlatList
                                data={activeReports}
                                keyExtractor={(item) => String(item.id)}
                                renderItem={({ item }) => (
                                    <ReportCard
                                        report={item}
                                        onPress={() => setActiveReports([item])}
                                    />
                                )}
                            />
                        </View>

                    ) : (
                        /* Main feed + search */
                        <>
                            <View className="px-5 pb-4">
                                <View className="relative">
                                    <View className="absolute left-3 top-3 z-10">
                                        <Search size={20} color="#9CA3AF" />
                                    </View>
                                    <TextInput
                                        placeholder="Поиск по адресу..."
                                        placeholderTextColor="#9CA3AF"
                                        className="w-full bg-gray-100 pl-10 pr-4 py-3 rounded-2xl text-gray-900"
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        onFocus={() => setIsSheetOpen(true)}
                                    />
                                </View>
                            </View>

                            <ScrollView className="flex-1 px-5 pb-5">
                                {/* Search history */}
                                {!searchQuery && searchHistory.length > 0 && (
                                    <View className="mb-6">
                                        <View className="flex-row justify-between items-center mb-3">
                                            <Text className="font-bold text-gray-900 text-sm">
                                                История поиска
                                            </Text>
                                            <TouchableOpacity onPress={() => setSearchHistory([])}>
                                                <Text className="text-xs text-gray-400">Очистить</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View className="flex-row flex-wrap gap-2">
                                            {searchHistory.map((item, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    className="px-3 py-1.5 bg-gray-100 rounded-lg flex-row items-center gap-1.5"
                                                    onPress={() => setSearchQuery(item)}
                                                >
                                                    <Clock size={12} color="#9CA3AF" />
                                                    <Text className="text-sm text-gray-700">{item}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                <Text className="font-bold text-gray-900 mb-3 text-lg">
                                    {searchQuery ? 'Результаты поиска' : 'Лента происшествий'}
                                </Text>

                                {filteredReports.map((report) => (
                                    <ReportCard
                                        key={report.id}
                                        report={report}
                                        onPress={() => {
                                            setActiveReports([report]);
                                            setIsSheetOpen(true);
                                        }}
                                    />
                                ))}

                                {filteredReports.length === 0 && (
                                    <View className="py-10 items-center">
                                        <Text className="text-gray-400">Ничего не найдено</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </>
                    )}
                </View>
            )}
        </View>
    );
}
