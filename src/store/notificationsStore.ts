import { Notification, NotificationType, Report, ReportStatus } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface NotificationsState {
    notifications: Notification[];
    isEnabled: boolean;
    _hasHydrated: boolean;

    unreadCount: () => number;
    setEnabled: (enabled: boolean) => void;
    setHasHydrated: (state: boolean) => void;
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => void;
    clearAll: () => void;
    generateFromReports: (currentReports: Report[], previousReports: Report[]) => void;
    requestPushPermissions: () => Promise<boolean>;
    scheduleLocalNotification: (title: string, body: string) => Promise<void>;
}

const STATUS_LABELS: Record<ReportStatus, string> = {
    draft: 'Черновик',
    published: 'Опубликована',
    check: 'На рассмотрении',
    archived: 'Решена',
    banned: 'Заблокирована',
};

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getStatusChangeMessage(
    title: string,
    previousStatus: ReportStatus,
    newStatus: ReportStatus
): { type: NotificationType; message: string } {
    if (previousStatus === 'draft' && newStatus === 'published') {
        return {
            type: 'draft_published',
            message: `Ваш черновик «${title}» опубликован`,
        };
    }

    if (newStatus === 'archived') {
        return {
            type: 'status_changed',
            message: `Заявка «${title}» решена`,
        };
    }

    if (newStatus === 'check') {
        return {
            type: 'status_changed',
            message: `Заявка «${title}» взята на рассмотрение`,
        };
    }

    if (newStatus === 'published') {
        return {
            type: 'status_changed',
            message: `Заявка «${title}» опубликована`,
        };
    }

    return {
        type: 'status_changed',
        message: `Заявка «${title}» изменила статус на «${STATUS_LABELS[newStatus]}»`,
    };
}

export const useNotificationsStore = create<NotificationsState>()(
    persist(
        (set, get) => ({
            notifications: [],
            isEnabled: true,
            _hasHydrated: false,

            unreadCount: () => {
                return get().notifications.filter((n) => !n.isRead).length;
            },

            setEnabled: (enabled) => {
                set({ isEnabled: enabled });
            },

            setHasHydrated: (state) => {
                set({ _hasHydrated: state });
            },

            addNotification: (notification) => {
                const { isEnabled } = get();
                if (!isEnabled) return;

                const newNotification: Notification = {
                    ...notification,
                    id: generateId(),
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({
                    notifications: [newNotification, ...state.notifications],
                }));

                // Отправляем локальное push-уведомление
                if (Platform.OS !== 'web') {
                    get().scheduleLocalNotification(notification.title, notification.message);
                }
            },

            markAsRead: (id) => {
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, isRead: true } : n
                    ),
                }));
            },

            markAllAsRead: () => {
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
                }));
            },

            deleteNotification: (id) => {
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== id),
                }));
            },

            clearAll: () => {
                set({ notifications: [] });
            },

            generateFromReports: (currentReports, previousReports) => {
                const { isEnabled } = get();
                if (!isEnabled) return;

                const previousMap = new Map(previousReports.map((r) => [r.id, r]));

                currentReports.forEach((currentReport) => {
                    const previousReport = previousMap.get(currentReport.id);

                    if (previousReport && previousReport.status !== currentReport.status) {
                        const { type, message } = getStatusChangeMessage(
                            currentReport.title,
                            previousReport.status,
                            currentReport.status
                        );

                        get().addNotification({
                            type,
                            title: type === 'draft_published' ? 'Черновик опубликован' : 'Изменение статуса',
                            message,
                            reportId: currentReport.id,
                            reportTitle: currentReport.title,
                            status: currentReport.status,
                            previousStatus: previousReport.status,
                            isRead: false,
                        });
                    }
                });
            },

            requestPushPermissions: async () => {
                if (Platform.OS === 'web') return false;

                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                return finalStatus === 'granted';
            },

            scheduleLocalNotification: async (title: string, body: string) => {
                if (Platform.OS === 'web') return;

                const { isEnabled } = get();
                if (!isEnabled) return;

                try {
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title,
                            body,
                            sound: true,
                            priority: Notifications.AndroidNotificationPriority.HIGH,
                        },
                        trigger: null, // Показать сразу
                    });
                } catch (error) {
                    console.warn('Failed to schedule notification:', error);
                }
            },
        }),
        {
            name: 'notifications-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                notifications: state.notifications,
                isEnabled: state.isEnabled,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

// Конфигурация уведомлений для Expo
if (Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}
