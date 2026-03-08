import { Badge } from '@/src/components/ui';
import { CATEGORIES } from '@/src/constants/categories';
import { MOCK_REPORTS } from '@/src/constants/mock-data';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import { router } from 'expo-router';
import { Settings, X } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const isDarkMode = useThemeStore((s) => s.isDarkMode);

    const xp = user?.xp ?? 350;
    const nextLevelXp = user?.nextLevelXp ?? 500;
    const progress = (xp / nextLevelXp) * 100;

    // Считаем статистику по заявкам
    const totalReports = MOCK_REPORTS.length;
    const solvedReports = MOCK_REPORTS.filter(r => r.status === 'solved').length;
    const progressReports = MOCK_REPORTS.filter(r => r.status === 'progress').length;
    const activeReports = solvedReports + progressReports; // решенные + в работе
    const influence = Math.floor((activeReports / totalReports) * 100) || 0;

    // Расчет уровня на основе активных заявок (решенных + в работе)
    const calculateLevel = (activeCount: number) => {
        if (activeCount >= 50) return 10;
        if (activeCount >= 35) return 9;
        if (activeCount >= 25) return 8;
        if (activeCount >= 18) return 7;
        if (activeCount >= 12) return 6;
        if (activeCount >= 8) return 5;
        if (activeCount >= 5) return 4;
        if (activeCount >= 3) return 3;
        if (activeCount >= 1) return 2;
        return 1;
    };

    const userLevel = calculateLevel(activeReports);

    // Расчет XP для следующего уровня
    const getLevelRequirements = (level: number) => {
        const requirements = [0, 1, 3, 5, 8, 12, 18, 25, 35, 50];
        return {
            currentLevelMin: requirements[level - 1] || 0,
            nextLevelMin: requirements[level] || 50,
        };
    };

    const { currentLevelMin, nextLevelMin } = getLevelRequirements(userLevel);
    const currentXp = activeReports - currentLevelMin;
    const neededXp = nextLevelMin - currentLevelMin;
    const xpProgress = neededXp > 0 ? (currentXp / neededXp) * 100 : 100;

    const handleLogout = () => {
        logout();
        router.replace('/(auth)/login');
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <SafeAreaView edges={['top']} className="bg-white dark:bg-gray-900 shadow-sm">
                <View className="flex-row items-center justify-between px-4 py-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 -ml-2 rounded-full"
                    >
                        <X size={24} color={isDarkMode ? "#F9FAFB" : "#111827"} />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg dark:text-gray-100">Мой профиль</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/(main)/settings' as any)}
                        className="p-2 -mr-2 rounded-full"
                    >
                        <Settings size={24} color={isDarkMode ? "#F9FAFB" : "#111827"} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1 pt-4">
                {/* Profile card */}
                <View className="bg-white dark:bg-gray-800 p-4 mx-4 mb-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 items-center">
                    <View className="w-full max-w-md self-center">
                        <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mb-3 border-2 border-white dark:border-gray-800 shadow-sm self-center">
                            <Text className="text-3xl">🧑‍💼</Text>
                        </View>
                        <Text className="text-lg font-bold mb-1 dark:text-gray-100 text-center">
                            {user ? `${user.first_name} ${user.last_name}`.trim() || user.username : 'Пользователь'}
                        </Text>
                        <Text className="text-blue-600 font-semibold text-sm mb-3 text-center">
                            Уровень {userLevel}
                        </Text>

                        {/* XP bar */}
                        <View className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
                            <View
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${xpProgress}%` }}
                            />
                        </View>
                        <Text className="text-xs text-gray-400 dark:text-gray-500 mb-4 text-center">
                            {xp} / {nextLevelXp} XP
                        </Text>

                        {/* Stats */}
                        <View className="flex-row w-full pt-3 border-t border-gray-50 dark:border-gray-700">
                            <View className="flex-1 items-center">
                                <Text className="text-base font-bold dark:text-gray-100">{totalReports}</Text>
                                <Text className="text-xs text-gray-400 dark:text-gray-500">Заявок</Text>
                            </View>
                            <View className="flex-1 items-center border-l border-r border-gray-50 dark:border-gray-700">
                                <Text className="text-base font-bold dark:text-gray-100">{solvedReports}</Text>
                                <Text className="text-xs text-gray-400 dark:text-gray-500">Решено</Text>
                            </View>
                            <View className="flex-1 items-center">
                                <Text className="text-base font-bold dark:text-gray-100">{progressReports}</Text>
                                <Text className="text-xs text-gray-400 dark:text-gray-500">В работе</Text>
                            </View>
                            <View className="flex-1 items-center">
                                <Text className="text-base font-bold dark:text-gray-100">{influence}%</Text>
                                <Text className="text-xs text-gray-400 dark:text-gray-500">Влияние</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* My reports */}
                <View className="px-6 mb-6">
                    <View className="w-full max-w-sm self-center">
                        <Text className="font-bold text-gray-900 dark:text-gray-100 text-lg text-center mb-3">
                            Мои заявки
                        </Text>
                    </View>
                </View>

                <View className="px-6 pb-8">
                    <View className="w-full max-w-sm self-center">
                        {MOCK_REPORTS.map((r) => {
                            const cat = CATEGORIES.find((c) => c.name === r.rubric_name);
                            return (
                                <View
                                    key={r.id}
                                    className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex-row items-center gap-3 mb-3"
                                >
                                    <View
                                        className="w-10 h-10 rounded-xl items-center justify-center"
                                        style={{
                                            backgroundColor: (cat?.color || '#999') + '20',
                                        }}
                                    >
                                        <Text className="text-lg">{cat?.icon || '❗'}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text
                                            className="font-semibold text-gray-900 dark:text-gray-100"
                                            numberOfLines={1}
                                        >
                                            {r.title}
                                        </Text>
                                        <Text className="text-xs text-gray-400 dark:text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU') : ''}</Text>
                                    </View>
                                    <Badge status={r.status} />
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Logout */}
                <View className="px-6 pb-8">
                    <View className="w-full max-w-sm self-center">
                        <TouchableOpacity
                            onPress={handleLogout}
                            className="py-3 bg-red-50 dark:bg-red-900/20 rounded-xl items-center"
                        >
                            <Text className="text-red-500 font-semibold">Выйти из аккаунта</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
