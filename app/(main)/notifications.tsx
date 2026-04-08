import { useNotificationsStore } from '@/src/store/notificationsStore';
import { useThemeStore } from '@/src/store/themeStore';
import { Notification } from '@/src/types';
import { navigateBack } from '@/src/utils/navigation';
import { router } from 'expo-router';
import {
    AlertTriangle,
    Bell,
    CheckCircle,
    Info,
    MessageSquare,
    X,
    XCircle,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function NotificationItem({
    notification,
    onPress,
    isLast = false,
}: {
    notification: Notification;
    onPress: () => void;
    isLast?: boolean;
}) {
    const isDarkMode = useThemeStore((s) => s.isDarkMode);

    const getIconConfig = () => {
        switch (notification.notification_type) {
            case 'success':
                return { color: '#10B981', Icon: CheckCircle };
            case 'warning':
                return { color: '#F59E0B', Icon: AlertTriangle };
            case 'error':
                return { color: '#EF4444', Icon: XCircle };
            case 'system':
                return { color: '#8B5CF6', Icon: Bell };
            case 'post':
                return { color: '#3B82F6', Icon: MessageSquare };
            case 'info':
            default:
                return { color: '#6366F1', Icon: Info };
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

    const { color, Icon } = getIconConfig();

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className={`p-4 ${!isLast ? 'border-b border-gray-100 dark:border-gray-700' : ''} ${
                notification.is_read
                    ? 'bg-white dark:bg-gray-800'
                    : 'bg-blue-50/50 dark:bg-blue-900/20'
            }`}
        >
            <View className="flex-row items-start">
                <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: `${color}20` }}
                >
                    <Icon size={18} color={color} />
                </View>
                <View className="flex-1">
                    <Text
                        className={`font-semibold text-sm mb-1 ${
                            notification.is_read
                                ? 'text-gray-900 dark:text-gray-100'
                                : 'text-gray-900 dark:text-white'
                        }`}
                    >
                        {notification.subject}
                    </Text>
                    <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                        {notification.message}
                    </Text>
                    <Text className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(notification.created_at)}
                    </Text>
                </View>
                {!notification.is_read && (
                    <View className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                )}
            </View>
        </TouchableOpacity>
    );
}

export default function NotificationsScreen() {
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const notifications = useNotificationsStore((s) => s.notifications);
    const unreadCount = useNotificationsStore((s) => s.unreadCount);
    const isLoading = useNotificationsStore((s) => s.isLoading);
    const markAsRead = useNotificationsStore((s) => s.markAsRead);
    const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
    const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications);

    const [filter, setFilter] = useState<'all' | 'unread'>('unread');

    // Получение всех уведомлений при монтировании экрана
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleNotificationPress = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        // Переход по ссылке если она есть
        if (notification.link) {
            // Если ссылка выглядит как ID поста, переходим в профиль с openReportId
            const postIdMatch = notification.link.match(/\/posts\/(\d+)/);
            if (postIdMatch) {
                router.push({
                    pathname: '/(main)/profile',
                    params: { openReportId: postIdMatch[1] },
                });
                return;
            }
        }

        // Также проверяем metadata для post_id
        if (notification.metadata?.post_id) {
            router.push({
                pathname: '/(main)/profile',
                params: { openReportId: String(notification.metadata.post_id) },
            });
        }
    };

    const filteredNotifications = notifications.filter(
        (n) => filter === 'all' || !n.is_read
    );

    const groupedNotifications = filteredNotifications.reduce(
        (groups, notification) => {
            const date = new Date(notification.created_at);
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
        },
        {} as Record<string, Notification[]>
    );

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
                    <Text className="font-bold text-lg dark:text-gray-100">
                        Уведомления
                    </Text>
                    <View className="w-8" />
                </View>
            </SafeAreaView>

            {/* Tabs Filter — always visible */}
            <View className="w-full max-w-lg self-center px-4 pt-4">
                <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
                    <TouchableOpacity
                        onPress={() => setFilter('unread')}
                        activeOpacity={0.7}
                        className="flex-1 py-2 rounded-lg flex-row items-center justify-center"
                        style={filter === 'unread' ? {
                            backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1,
                        } : undefined}
                    >
                        <Text
                            style={{ fontSize: 14, fontWeight: '500', color: filter === 'unread' ? (isDarkMode ? '#60A5FA' : '#2563EB') : (isDarkMode ? '#9CA3AF' : '#6B7280') }}
                        >
                            Непрочитанные
                        </Text>
                        {unreadCount > 0 && (
                            <View className="ml-1.5 bg-blue-500 px-1.5 py-0.5 rounded-full items-center justify-center">
                                <Text className="text-[10px] font-bold text-white">
                                    {unreadCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilter('all')}
                        activeOpacity={0.7}
                        className="flex-1 py-2 rounded-lg items-center justify-center"
                        style={filter === 'all' ? {
                            backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1,
                        } : undefined}
                    >
                        <Text
                            style={{ fontSize: 14, fontWeight: '500', color: filter === 'all' ? (isDarkMode ? '#60A5FA' : '#2563EB') : (isDarkMode ? '#9CA3AF' : '#6B7280') }}
                        >
                            Все
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            {isLoading && notifications.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator
                        size="large"
                        color={isDarkMode ? '#60A5FA' : '#2563EB'}
                    />
                    <Text className="text-sm text-gray-400 dark:text-gray-500 mt-3">
                        Загрузка уведомлений...
                    </Text>
                </View>
            ) : filteredNotifications.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
                        <Bell size={32} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
                    </View>
                    <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
                        {filter === 'unread' ? 'Нет непрочитанных уведомлений' : 'Уведомлений пока нет'}
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                        {filter === 'unread'
                            ? 'Все уведомления прочитаны'
                            : 'Здесь будут появляться уведомления об изменении статуса ваших заявок'}
                    </Text>
                </View>
            ) : (
                <ScrollView className="flex-1">
                    <View className="w-full max-w-lg self-center px-4">
                        {/* Mark all as read button */}
                        {notifications.length > 0 && unreadCount > 0 && (
                            <TouchableOpacity 
                                onPress={markAllAsRead}
                                className="mb-4 py-3 px-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                            >
                                <Text className="text-sm text-blue-600 dark:text-blue-400 font-semibold text-center">
                                    Отметить все как прочитанные
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Notifications grouped by date */}
                        {Object.entries(groupedNotifications).map(([group, items]) => (
                            <View key={group} className="mb-4">
                                <View className="mb-2 px-1">
                                    <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                        {group}
                                    </Text>
                                </View>
                                <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                                    {items.map((notification, index) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                            onPress={() =>
                                                handleNotificationPress(notification)
                                            }
                                            isLast={index === items.length - 1}
                                        />
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                    <View className="h-8" />
                </ScrollView>
            )}
        </View>
    );
}
