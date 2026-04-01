import { notificationsService } from '@/src/services/notifications';
import { Notification } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    isEnabled: boolean;
    isLoading: boolean;
    _hasHydrated: boolean;
    _pollingInterval: ReturnType<typeof setInterval> | null;

    setEnabled: (enabled: boolean) => void;
    setHasHydrated: (state: boolean) => void;

    /** Fetch all notifications from server */
    fetchNotifications: () => Promise<void>;
    /** Fetch only the unread count (lightweight) */
    fetchUnreadCount: () => Promise<void>;
    /** Mark a single notification as read (server + local) */
    markAsRead: (id: number) => void;
    /** Mark all notifications as read (server + local) */
    markAllAsRead: () => void;

    /** Start polling for unread count every 60s */
    startPolling: () => void;
    /** Stop polling */
    stopPolling: () => void;

    /** Push notification permissions */
    requestPushPermissions: () => Promise<boolean>;
    /** Schedule a local push notification */
    scheduleLocalNotification: (title: string, body: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>()(
    persist(
        (set, get) => ({
            notifications: [],
            unreadCount: 0,
            isEnabled: true,
            isLoading: false,
            _hasHydrated: false,
            _pollingInterval: null,

            setEnabled: (enabled) => {
                set({ isEnabled: enabled });
            },

            setHasHydrated: (state) => {
                set({ _hasHydrated: state });
            },

            fetchNotifications: async () => {
                const { isEnabled } = get();
                if (!isEnabled) return;

                set({ isLoading: true });
                try {
                    const response = await notificationsService.getAll({ limit: 100 });
                    const newNotifications = response.notifications;
                    const oldNotifications = get().notifications;

                    // Detect truly new unread notifications to trigger local push
                    if (Platform.OS !== 'web' && oldNotifications.length > 0) {
                        const oldIds = new Set(oldNotifications.map((n) => n.id));
                        const brandNew = newNotifications.filter(
                            (n) => !oldIds.has(n.id) && !n.is_read
                        );
                        for (const n of brandNew) {
                            get().scheduleLocalNotification(n.subject, n.message);
                        }
                    }

                    set({
                        notifications: newNotifications,
                        unreadCount: response.unread_count,
                        isLoading: false,
                    });
                } catch (error) {
                    console.warn('Failed to fetch notifications:', error);
                    set({ isLoading: false });
                }
            },

            fetchUnreadCount: async () => {
                const { isEnabled } = get();
                if (!isEnabled) return;

                try {
                    const count = await notificationsService.getUnreadCount();
                    set({ unreadCount: count });
                } catch (error) {
                    // Silently fail — we'll retry on next poll
                }
            },

            markAsRead: async (id) => {
                // Optimistic local update
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
                    ),
                    unreadCount: Math.max(0, state.unreadCount - 1),
                }));

                try {
                    await notificationsService.markAsRead(id);
                } catch (error) {
                    console.warn('Failed to mark notification as read:', error);
                    // Revert on error — refetch
                    get().fetchNotifications();
                }
            },

            markAllAsRead: async () => {
                // Optimistic local update
                set((state) => ({
                    notifications: state.notifications.map((n) => ({
                        ...n,
                        is_read: true,
                        read_at: n.read_at || new Date().toISOString(),
                    })),
                    unreadCount: 0,
                }));

                try {
                    await notificationsService.markAllAsRead();
                } catch (error) {
                    console.warn('Failed to mark all notifications as read:', error);
                    get().fetchNotifications();
                }
            },

            startPolling: () => {
                const existing = get()._pollingInterval;
                if (existing) return; // already polling

                // Initial fetch
                get().fetchUnreadCount();

                const interval = setInterval(() => {
                    get().fetchUnreadCount();
                }, 60_000); // 60 seconds

                set({ _pollingInterval: interval });
            },

            stopPolling: () => {
                const interval = get()._pollingInterval;
                if (interval) {
                    clearInterval(interval);
                    set({ _pollingInterval: null });
                }
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
                        trigger: null, // Show immediately
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
                unreadCount: state.unreadCount,
                isEnabled: state.isEnabled,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

// Configure Expo notification handler
if (Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}
