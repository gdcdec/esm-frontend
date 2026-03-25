import { Badge } from '@/src/components/ui';
import { CATEGORIES } from '@/src/constants/categories';
import { useThemeStore } from '@/src/store/themeStore';
import { Report } from '@/src/types';
import { MapPin, MessageCircle, ThumbsUp } from 'lucide-react-native';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface ReportCardProps {
    report: Report;
    onPress?: () => void;
}

/** Format ISO date string to readable Russian locale */
function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString('ru-RU');
    } catch {
        return iso;
    }
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onPress }) => {
    const category = CATEGORIES.find((c) => c.name === report.rubric_name);
    const isDarkMode = useThemeStore((s) => s.isDarkMode);

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm mb-3"
        >
            {/* Author row */}
            <View className="flex-row items-center gap-2 mb-3">
                <View className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center">
                    <Text className="text-gray-600 dark:text-gray-300 font-bold text-xs">
                        {report.author_username?.charAt(0) ?? '?'}
                    </Text>
                </View>
                <Text className="font-medium text-gray-900 dark:text-gray-100 text-xs">{report.author_username}</Text>
                <Text className="text-gray-400 dark:text-gray-500 text-xs">•</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs">{formatDate(report.created_at)}</Text>
            </View>

            {/* Content row */}
            <View className="flex-row gap-3">
                <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: ((category?.darkColor && isDarkMode) ? category.darkColor : (category?.color || '#999')) + '20' }}
                >
                    <Text className="text-xl">{category?.icon || '❓'}</Text>
                </View>

                <View className="flex-1">
                    <Text className="font-semibold text-gray-900 dark:text-white mb-1" numberOfLines={1}>
                        {report.title}
                    </Text>

                    <View className="flex-row items-center gap-1 mb-1">
                        <MapPin size={10} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
                        <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
                            {report.address || 'Адрес не указан'}
                        </Text>
                    </View>

                    <Text className="text-sm text-gray-600 dark:text-gray-300 mb-2" numberOfLines={2}>
                        {report.description}
                    </Text>

                    {/* Image */}
                    {report.preview_photo && (
                        <View className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 mb-3">
                            <Image
                                source={{ uri: report.preview_photo }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        </View>
                    )}

                    {/* Footer */}
                    <View className="flex-row items-center justify-between mt-1">
                        <Badge status={report.status} />
                        <View className="flex-row items-center gap-3">
                            <View className="flex-row items-center gap-1">
                                <ThumbsUp size={14} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                                <Text className="text-xs text-gray-400 dark:text-gray-500">0</Text>
                            </View>
                            <View className="flex-row items-center gap-1">
                                <MessageCircle size={14} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                                <Text className="text-xs text-gray-400 dark:text-gray-500">0</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};
