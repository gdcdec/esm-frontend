import { Badge } from '@/src/components/ui';
import { CATEGORIES } from '@/src/constants/categories';
import { Report } from '@/src/types';
import { MapPin, MessageCircle, ThumbsUp } from 'lucide-react-native';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface ReportCardProps {
    report: Report;
    onPress?: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onPress }) => {
    const category = CATEGORIES.find((c) => c.id === report.category);

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-3"
        >
            {/* Author row */}
            <View className="flex-row items-center gap-2 mb-3">
                <View className="w-6 h-6 rounded-full bg-gray-200 items-center justify-center">
                    <Text className="text-gray-600 font-bold text-xs">
                        {report.author.charAt(0)}
                    </Text>
                </View>
                <Text className="font-medium text-gray-900 text-xs">{report.author}</Text>
                <Text className="text-gray-400 text-xs">•</Text>
                <Text className="text-gray-500 text-xs">{report.date}</Text>
            </View>

            {/* Content row */}
            <View className="flex-row gap-3">
                <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: (category?.color || '#999') + '20' }}
                >
                    <Text className="text-xl">{category?.icon || '❓'}</Text>
                </View>

                <View className="flex-1">
                    <Text className="font-semibold text-gray-900 mb-1" numberOfLines={1}>
                        {report.title}
                    </Text>

                    <View className="flex-row items-center gap-1 mb-1">
                        <MapPin size={10} color="#9CA3AF" />
                        <Text className="text-xs text-gray-500" numberOfLines={1}>
                            {report.address || 'Адрес не указан'}
                        </Text>
                    </View>

                    <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
                        {report.desc || 'Нет описания'}
                    </Text>

                    {/* Image */}
                    {report.image && (
                        <View className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 mb-3">
                            <Image
                                source={{ uri: report.image }}
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
                                <ThumbsUp size={14} color="#9CA3AF" />
                                <Text className="text-xs text-gray-400">{report.likes}</Text>
                            </View>
                            <View className="flex-row items-center gap-1">
                                <MessageCircle size={14} color="#9CA3AF" />
                                <Text className="text-xs text-gray-400">{report.comments}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};
