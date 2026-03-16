import { ReportStatus } from '@/src/types';
import React from 'react';
import { Text, View } from 'react-native';

interface BadgeProps {
    status: ReportStatus;
}

const STATUS_CONFIG: Record<ReportStatus, { bg: string; text: string; label: string }> = {
    published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Опубликовано' },
    check: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'На рассмотрении' },
    draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Черновик' },
    archived: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Архив' },
    banned: { bg: 'bg-red-100', text: 'text-red-700', label: 'Заблокировано' },
};

export const Badge: React.FC<BadgeProps> = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.check;

    return (
        <View className={`px-2.5 py-1 rounded-full ${config.bg}`}>
            <Text className={`text-[10px] font-bold uppercase tracking-wider ${config.text}`}>
                {config.label}
            </Text>
        </View>
    );
};
