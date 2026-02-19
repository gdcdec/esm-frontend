import { Stack } from 'expo-router';

export default function MainLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="map" />
            <Stack.Screen
                name="create"
                options={{
                    presentation: 'modal',
                    animation: 'slide_from_right',
                }}
            />
            <Stack.Screen
                name="profile"
                options={{
                    presentation: 'modal',
                    animation: 'slide_from_right',
                }}
            />
        </Stack>
    );
}
