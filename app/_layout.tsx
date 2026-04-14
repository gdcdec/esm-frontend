import { useAuthStore } from '@/src/store/authStore';
import { useNotificationsStore } from '@/src/store/notificationsStore';
import { useReportsStore } from '@/src/store/reportsStore';
import { useRubricsStore } from '@/src/store/rubricsStore';
import { useThemeStore } from '@/src/store/themeStore';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const { setColorScheme } = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    setColorScheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, setColorScheme]);

  // Загрузка рубрик и синхронизация черновиков при старте
  useEffect(() => {
    useRubricsStore.getState().fetchRubrics();
    useReportsStore.getState().syncDrafts();
  }, []);

  // Запуск/остановка опроса уведомлений в зависимости от состояния авторизации
  useEffect(() => {
    if (isAuthenticated && _hasHydrated) {
      useNotificationsStore.getState().startPolling();
    } else {
      useNotificationsStore.getState().stopPolling();
    }
    return () => {
      useNotificationsStore.getState().stopPolling();
    };
  }, [isAuthenticated, _hasHydrated]);

    // Защита авторизации — перенаправление в зависимости от состояния
    useEffect(() => {
        // Ждем готовности состояния авторизации и навигации
        if (!_hasHydrated || !segments[0]) return;

        const inAuthGroup = segments[0] === '(auth)';
        const isRulesPage = (segments as any[]).includes('rules');

        // Откладываем навигацию до следующего цикла рендера для монтирования Root Layout
        const rafId = requestAnimationFrame(() => {
            if (!isAuthenticated && !inAuthGroup && !isRulesPage) {
                // Не авторизован — перенаправляем на вход
                router.replace('/(auth)/login');
            } else if (isAuthenticated && inAuthGroup && !isRulesPage) {
                // Авторизован, но на странице входа (не правила) — перенаправляем на карту
                router.replace('/(main)/map');
            }
        });

        return () => cancelAnimationFrame(rafId);
    }, [isAuthenticated, _hasHydrated, segments, router]);

  // Ничего не показываем пока проверяем авторизацию (чтобы не было мигания)
  if (!_hasHydrated) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <View className={`flex-1 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`} />
          </SafeAreaProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <View className={`flex-1 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
            <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' } }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(main)" />
              </Stack>
            </ThemeProvider>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          </View>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
