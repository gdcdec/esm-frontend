import { ReportStatus } from '@/src/types';
import React from 'react';
import { Text, View } from 'react-native';

interface BadgeProps {
    status: ReportStatus | string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    // Current statuses
    published: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Опубликовано' },
    check: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'На рассмотрении' },
    draft: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', label: 'Черновик' },
    archived: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Архив' },
    banned: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Отклонено' },
};

export const Badge: React.FC<BadgeProps> = ({ status }) => {
    const rawStatus = (status || '').toString().toLowerCase();
    const config = STATUS_CONFIG[rawStatus] || STATUS_CONFIG.check;

    return (
        <View className={`px-2.5 py-1 rounded-full ${config.bg}`}>
            <Text className={`text-[10px] font-bold uppercase tracking-wider ${config.text}`}>
                {config.label}
            </Text>
        </View>
    );
};
