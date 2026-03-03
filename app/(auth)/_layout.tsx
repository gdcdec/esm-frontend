import { useThemeStore } from '@/src/store/themeStore';
import { Stack } from 'expo-router';

export default function AuthLayout() {
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    return (
        <Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }
        }}>
            <Stack.Screen name="login" />
        </Stack>
    );
}
