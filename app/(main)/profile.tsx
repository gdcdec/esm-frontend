import { Badge } from '@/src/components/ui';
import { CATEGORIES } from '@/src/constants/categories';
import { MOCK_REPORTS } from '@/src/constants/mock-data';
import { useAuthStore } from '@/src/store/authStore';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const xp = user?.xp ?? 350;
    const nextLevelXp = user?.nextLevelXp ?? 500;
    const progress = (xp / nextLevelXp) * 100;

    const handleLogout = () => {
        logout();
        router.replace('/(auth)/login');
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <SafeAreaView edges={['top']} className="bg-white shadow-sm">
                <View className="flex-row items-center justify-between px-4 py-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 -ml-2 rounded-full"
                    >
                        <X size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg">Мой профиль</Text>
                    <View className="w-8" />
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1">
                {/* Profile card */}
                <View className="bg-white p-6 mx-4 rounded-3xl shadow-sm border border-gray-100 items-center">
                    <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4 border-2 border-white shadow-sm">
                        <Text className="text-4xl">🧑‍💼</Text>
                    </View>
                    <Text className="text-xl font-bold mb-1">
                        {user?.name || 'Алексей Н.'}
                    </Text>
                    <Text className="text-blue-600 font-semibold text-sm mb-4">
                        Уровень {user?.level ?? 5}
                    </Text>

                    {/* XP bar */}
                    <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <View
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </View>
                    <Text className="text-xs text-gray-400 mb-6">
                        {xp} / {nextLevelXp} XP
                    </Text>

                    {/* Stats */}
                    <View className="flex-row w-full pt-4 border-t border-gray-50">
                        <View className="flex-1 items-center">
                            <Text className="text-lg font-bold">12</Text>
                            <Text className="text-xs text-gray-400">Заявок</Text>
                        </View>
                        <View className="flex-1 items-center border-l border-r border-gray-50">
                            <Text className="text-lg font-bold">8</Text>
                            <Text className="text-xs text-gray-400">Решено</Text>
                        </View>
                        <View className="flex-1 items-center">
                            <Text className="text-lg font-bold">🔥</Text>
                            <Text className="text-xs text-gray-400">Влияние</Text>
                        </View>
                    </View>
                </View>

                {/* My reports */}
                <View className="w-full max-w-sm self-center mt-6">
                    <Text className="font-bold text-gray-900 mb-3 text-lg">
                        Мои заявки
                    </Text>

                    <View className="pb-4">
                        {MOCK_REPORTS.map((r) => {
                            const cat = CATEGORIES.find((c) => c.name === r.rubric_name);
                            return (
                                <View
                                    key={r.id}
                                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-row items-center gap-3 mb-3"
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
                                            className="font-semibold text-gray-900"
                                            numberOfLines={1}
                                        >
                                            {r.title}
                                        </Text>
                                        <Text className="text-xs text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU') : ''}</Text>
                                    </View>
                                    <Badge status={r.status} />
                                </View>
                            );
                        })}
                    </View>

                    {/* Logout */}
                    <View className="pb-8">
                        <TouchableOpacity
                            onPress={handleLogout}
                            className="py-3 bg-red-50 rounded-xl items-center"
                        >
                            <Text className="text-red-500 font-semibold">Выйти из аккаунта</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
