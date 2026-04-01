import { router } from 'expo-router';

/**
 * Безопасная навигация назад.
 * Если есть история навигации — идёт назад.
 * Если истории нет — переходит на fallback путь.
 */
export function navigateBack(fallbackPath: string) {
    if (router.canGoBack()) {
        router.back();
    } else {
        router.replace(fallbackPath as any);
    }
}
