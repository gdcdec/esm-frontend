import { getStatusConfig } from '@/src/constants/status';
import { ReportStatus } from '@/src/types';
import React from 'react';
import { Text, View } from 'react-native';

interface BadgeProps {
    status: ReportStatus | string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
    const config = getStatusConfig(status);

    return (
        <View className={`px-2.5 py-1 rounded-full ${config.bg}`}>
            <Text className={`text-[10px] font-bold uppercase tracking-wider ${config.text}`}>
                {config.label}
            </Text>
        </View>
    );
};
