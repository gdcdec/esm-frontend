import { ReportStatus } from '@/src/types';
import React from 'react';
import { Text, View } from 'react-native';

interface BadgeProps {
    status: ReportStatus;
}

const STATUS_CONFIG: Record<ReportStatus, { bg: string; text: string; label: string }> = {
    solved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Решено' },
    progress: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'В работе' },
    pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'На рассмотрении' },
};

export const Badge: React.FC<BadgeProps> = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    return (
        <View className={`px-2.5 py-1 rounded-full ${config.bg}`}>
            <Text className={`text-[10px] font-bold uppercase tracking-wider ${config.text}`}>
                {config.label}
            </Text>
        </View>
    );
};
