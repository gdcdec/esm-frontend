import { useNotificationsStore } from '@/src/store/notificationsStore';
import { useThemeStore } from '@/src/store/themeStore';
import { Notification } from '@/src/types';
import { navigateBack } from '@/src/utils/navigation';
import { router } from 'expo-router';
import {
    Bell,
    Trash2,
    X
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Swipeable только для native (не для web)
let Swipeable: any = null;
if (Platform.OS !== 'web') {
    try {
        Swipeable = require('react-native-gesture-handler/Swipeable').default;
    } catch {
        Swipeable = null;
    }
}

function NotificationItem({
    notification,
    onPress,
    onDelete,
}: {
    notification: Notification;
    onPress: () => void;
    onDelete: () => void;
}) {
    const isDarkMode = useThemeStore((s) => s.isDarkMode);

    const renderRightActions = () => (
        <TouchableOpacity
            onPress={onDelete}
            className="bg-red-500 justify-center items-center px-6 rounded-r-2xl"
        >
            <Trash2 size={20} color="white" />
        </TouchableOpacity>
    );

    const getIconColor = () => {
        switch (notification.type) {
            case 'draft_published':
                return '#10B981'; // green
            case 'status_changed':
                return '#3B82F6'; // blue
            case 'system':
                return '#8B5CF6'; // purple
            default:
                return '#6B7280'; // gray
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Только что';
        if (diffInMinutes < 60) return `${diffInMinutes} мин. назад`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч. назад`;
        return date.toLocaleDateString('ru-RU');
    };

    const content = (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className={`p-4 border-b border-gray-100 dark:border-gray-700 ${
                notification.isRead
                    ? 'bg-white dark:bg-gray-800'
                    : 'bg-blue-50/50 dark:bg-blue-900/20'
            }`}
        >
            <View className="flex-row items-start">
                <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: `${getIconColor()}20` }}
                >
                    <Bell size={18} color={getIconColor()} />
                </View>
                <View className="flex-1">
                    <Text
                        className={`font-semibold text-sm mb-1 ${
                            notification.isRead
                                ? 'text-gray-900 dark:text-gray-100'
                                : 'text-gray-900 dark:text-white'
                        }`}
                    >
                        {notification.title}
                    </Text>
                    <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                        {notification.message}
                    </Text>
                    <Text className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(notification.createdAt)}
                    </Text>
                </View>
                {!notification.isRead && (
                    <View className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                )}
            </View>
        </TouchableOpacity>
    );

    if (Platform.OS === 'web' || !Swipeable) {
        return (
            <View className="relative">
                {content}
                <TouchableOpacity
                    onPress={onDelete}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 hover:opacity-100"
                >
                    <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <Swipeable renderRightActions={renderRightActions}>
            {content}
        </Swipeable>
    );
}

export default function NotificationsScreen() {
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const notifications = useNotificationsStore((s) => s.notifications);
    const unreadCount = useNotificationsStore((s) => s.unreadCount());
    const markAsRead = useNotificationsStore((s) => s.markAsRead);
    const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
    const deleteNotification = useNotificationsStore((s) => s.deleteNotification);
    const clearAll = useNotificationsStore((s) => s.clearAll);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleNotificationPress = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        if (notification.reportId) {
            router.push({
                pathname: '/(main)/profile',
                params: { openReportId: String(notification.reportId) },
            });
        }
    };

    const handleClearAll = () => {
        setShowConfirmModal(true);
    };

    const confirmClearAll = () => {
        clearAll();
        setShowConfirmModal(false);
    };

    const groupedNotifications = notifications.reduce((groups, notification) => {
        const date = new Date(notification.createdAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let group: string;
        if (date.toDateString() === today.toDateString()) {
            group = 'Сегодня';
        } else if (date.toDateString() === yesterday.toDateString()) {
            group = 'Вчера';
        } else {
            group = date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
            });
        }

        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(notification);
        return groups;
    }, {} as Record<string, Notification[]>);

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <SafeAreaView
                edges={['top']}
                className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800"
            >
                <View className="flex-row items-center justify-between px-4 py-3">
                    <TouchableOpacity
                        onPress={() => navigateBack('/(main)/profile')}
                        className="p-2 -ml-2 rounded-full"
                    >
                        <X size={24} color={isDarkMode ? '#F9FAFB' : '#111827'} />
                    </TouchableOpacity>
                    <View className="flex-1 items-center">
                        <Text className="font-bold text-lg dark:text-gray-100">
                            Уведомления
                        </Text>
                        {unreadCount > 0 && (
                            <Text className="text-xs text-blue-500">
                                {unreadCount} новых
                            </Text>
                        )}
                    </View>
                    <View className="w-8" />
                </View>

                {/* Actions */}
                {notifications.length > 0 && (
                    <View className="flex-row justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                        <TouchableOpacity onPress={markAllAsRead}>
                            <Text className="text-sm text-blue-500 font-medium">
                                Отметить всё прочитанным
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleClearAll}>
                            <Text className="text-sm text-red-500 font-medium">
                                Очистить всё
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>

            {/* Content */}
            {notifications.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
                        <Bell size={32} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
                    </View>
                    <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
                        Уведомлений пока нет
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                        Здесь будут появляться уведомления об изменении статуса ваших заявок
                    </Text>
                </View>
            ) : (
                <ScrollView className="flex-1">
                    {Object.entries(groupedNotifications).map(([group, items]) => (
                        <View key={group}>
                            <View className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
                                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {group}
                                </Text>
                            </View>
                            <View className="bg-white dark:bg-gray-800">
                                {items.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onPress={() => handleNotificationPress(notification)}
                                        onDelete={() => deleteNotification(notification.id)}
                                    />
                                ))}
                            </View>
                        </View>
                    ))}
                    <View className="h-8" />
                </ScrollView>
            )}

            {/* Confirm Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showConfirmModal}
                onRequestClose={() => setShowConfirmModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-4">
                    <View className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-xl">
                        <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Очистить уведомления?
                        </Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Все уведомления будут удалены. Это действие нельзя отменить.
                        </Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setShowConfirmModal(false)}
                                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700"
                            >
                                <Text className="text-gray-700 dark:text-gray-300 font-semibold text-center">
                                    Отмена
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmClearAll}
                                className="flex-1 py-3 rounded-xl bg-red-500"
                            >
                                <Text className="text-white font-semibold text-center">
                                    Удалить
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
