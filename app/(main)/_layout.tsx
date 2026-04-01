import { useThemeStore } from '@/src/store/themeStore';
import { Stack } from 'expo-router';

export default function MainLayout() {
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    return (
        <Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }
        }}>
            <Stack.Screen name="map" />
            <Stack.Screen
                name="create"
                options={{
                    animation: 'slide_from_right',
                }}
            />
            <Stack.Screen
                name="profile"
                options={{
                    animation: 'slide_from_bottom',
                }}
            />
            <Stack.Screen
                name="account"
                options={{
                    animation: 'slide_from_right',
                }}
            />
            <Stack.Screen
                name="password"
                options={{
                    animation: 'slide_from_right',
                }}
            />
            <Stack.Screen
                name="notifications"
                options={{
                    animation: 'slide_from_right',
                }}
            />
        </Stack>
    );
}
