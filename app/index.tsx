import { useAuthStore } from '@/src/store/authStore';
import { Redirect } from 'expo-router';

export default function Index() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    if (isAuthenticated) {
        return <Redirect href="/(main)/map" />;
    }

    return <Redirect href="/(auth)/login" />;
}
