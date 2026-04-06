import { Photo, PhotoCarousel } from '@/src/components/PhotoCarousel';
import { Button } from '@/src/components/ui';
import { getStatusConfig } from '@/src/constants/status';
import { useReportsStore } from '@/src/store/reportsStore';
import { useRubricsStore } from '@/src/store/rubricsStore';
import { Report } from '@/src/types';
import { router } from 'expo-router';
import { MapPin, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

export function ReportDetail({
    report: initialReport,
    onClose,
    isDarkMode,
}: {
    report: Report;
    onClose: () => void;
    isDarkMode: boolean;
}) {
    const [report, setReport] = useState<Report>(initialReport);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const getById = useReportsStore((s) => s.getById);

    // Fetch full report details (with description, photos) when opened
    useEffect(() => {
        let cancelled = false;
        if (!initialReport.description && initialReport.id) {
            setIsLoadingDetails(true);
            getById(initialReport.id)
                .then((full) => {
                    if (!cancelled) setReport(full);
                })
                .catch(() => { })
                .finally(() => {
                    if (!cancelled) setIsLoadingDetails(false);
                });
        }
        return () => { cancelled = true; };
    }, [initialReport.id]);

    const status = getStatusConfig(report.status);

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

    const cat = useRubricsStore((s) => s.getRubric)(report.rubric_name);

    return (
        <View>

            <View className="flex-row justify-between items-start">
                <View className={`${status.bg} px-2.5 py-1 rounded-full`}>
                    <Text className={`text-[10px] font-bold ${status.text} uppercase`}>
                        {status.label}
                    </Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                    <X size={24} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-between items-start mt-3">
                <Text className="text-2xl font-bold flex-1 text-gray-900 dark:text-white mr-4">
                    {report.title}
                </Text>

                {/* Рубрика */}
                {!!report.rubric_name && (
                    <View className="flex-row items-center gap-1.5 mt-1 shrink-0">
                        <View
                            className="w-8 h-8 rounded-md items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-700"
                        >
                            {cat?.photoUrl ? (
                                <Image
                                    source={{ uri: cat.photoUrl }}
                                    style={{ width: 20, height: 20 }}
                                    resizeMode="contain"
                                />
                            ) : (
                                <Text style={{ fontSize: 14 }}>❗</Text>
                            )}
                        </View>
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {report.rubric_name}
                        </Text>
                    </View>
                )}
            </View>

            <View className="flex-row items-center flex-wrap gap-x-2 gap-y-2 mt-3 mb-4">
                {/* Автор и Дата */}
                <View className="flex-row items-center gap-2">
                    <View className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-full items-center justify-center">
                        <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                            {report.author_username?.charAt(0) ?? '?'}
                        </Text>
                    </View>
                    <Text className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {report.author_username}
                    </Text>
                </View>

                <Text className="text-gray-400 dark:text-gray-500 text-sm">•</Text>

                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                    {report.created_at ? new Date(report.created_at).toLocaleDateString('ru-RU') : ''}
                </Text>
            </View>

            <View className="flex-row items-center gap-1 mb-2">
                <MapPin size={14} color="#9CA3AF" />
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {report.address || 'Адрес не указан'}
                </Text>
            </View>

            {/* Описание */}
            {!!report.description && (
                <View className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl mb-4 border border-gray-100 dark:border-gray-700">
                    <Text className="text-gray-700 dark:text-gray-300 leading-6">
                        {report.description}
                    </Text>
                </View>
            )}

            {/* Карусель фотографий */}
            {(() => {
                const carouselPhotos: Photo[] = [];
                const photoUrls = new Set<string>();

                // Сначала добавляем photos, так как они основные
                if (report.photos && report.photos.length > 0) {
                    report.photos.forEach((p, idx) => {
                        if (p.photo_url && !photoUrls.has(p.photo_url)) {
                            carouselPhotos.push({ id: p.id || idx, photo_url: p.photo_url, caption: p.caption });
                            photoUrls.add(p.photo_url);
                        }
                    });
                }

                // Добавляем preview_photo только если его нет в списке
                if (report.preview_photo && !photoUrls.has(report.preview_photo)) {
                    carouselPhotos.unshift({ id: 'preview', photo_url: report.preview_photo, caption: null });
                }

                return carouselPhotos.length > 0 ? (
                    <PhotoCarousel photos={carouselPhotos} isDarkMode={isDarkMode} />
                ) : null;
            })()}

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
