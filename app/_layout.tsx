import { useReportsStore } from '@/src/store/reportsStore';
import { useRubricsStore } from '@/src/store/rubricsStore';
import { useThemeStore } from '@/src/store/themeStore';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
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

  useEffect(() => {
    setColorScheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, setColorScheme]);

  // Load rubrics and sync pending drafts on startup
  useEffect(() => {
    useRubricsStore.getState().fetchRubrics();
    useReportsStore.getState().syncDrafts();
  }, []);

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
