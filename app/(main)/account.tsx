import { authService } from '@/src/services/auth';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight as ChevronRightIcon, Lock as LockIcon, Mail, Phone } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountScreen() {
    const user = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);
    const isDarkMode = useThemeStore((s) => s.isDarkMode);

    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [lastName, setLastName] = useState(user?.last_name || '');
    const [patronymic, setPatronymic] = useState(user?.patronymic || '');
    const [phone, setPhone] = useState(user?.phone_number || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load current user profile from API
    useEffect(() => {
        const loadUserProfile = async () => {
            setIsLoading(true);
            try {
                const userData = await authService.getCurrentUser();
                setUser(userData);
                setFirstName(userData.first_name || '');
                setLastName(userData.last_name || '');
                setPatronymic(userData.patronymic || '');
                setPhone(userData.phone_number || '');
            } catch (error) {
                console.error('Failed to load user profile:', error);
                // Keep using cached user data from store
            } finally {
                setIsLoading(false);
            }
        };
        loadUserProfile();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedUser = await authService.updateCurrentUser({
                first_name: firstName,
                last_name: lastName,
                patronymic: patronymic,
                phone_number: phone,
            });
            setUser(updatedUser);
            Alert.alert('Успех', 'Данные профиля обновлены');
        } catch (error: any) {
            const message = error?.response?.data?.detail || 'Не удалось сохранить изменения';
            Alert.alert('Ошибка', message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoBack = () => {
        router.replace('/(main)/settings');
    };

    const handleChangePassword = () => {
        router.push('/(main)/password');
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <SafeAreaView edges={['top']} className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800">
                <View className="flex-row items-center justify-between px-4 py-3">
                    <TouchableOpacity
                        onPress={handleGoBack}
                        className="p-2 -ml-2 rounded-full"
                    >
                        <ChevronLeft size={24} color={isDarkMode ? "#F9FAFB" : "#111827"} />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg dark:text-gray-100">Управление аккаунтом</Text>
                    <View className="w-8" />
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1">
                <View className="w-full max-w-md self-center px-4">
                    {/* Profile Avatar */}
                    <View className="items-center mt-6 mb-6">
                        {isLoading ? (
                            <ActivityIndicator size="large" color={isDarkMode ? '#60A5FA' : '#2563EB'} className="mb-4" />
                        ) : (
                            <>
                                <View className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mb-3">
                                    <Text className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                        {user?.username?.charAt(0)?.toUpperCase() ?? '?'}
                                    </Text>
                                </View>
                                <Text className="text-lg font-bold dark:text-white">
                                    {user?.username || 'Пользователь'}
                                </Text>
                                <Text className="text-sm text-gray-500 dark:text-gray-400">
                                    {user?.email || ''}
                                </Text>
                            </>
                        )}
                    </View>

                    {/* Personal Info Section */}
                    <View className="mt-2 mb-1">
                        <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                            Личные данные
                        </Text>
                    </View>
                    <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
                        {/* Last Name */}
                        <View className="px-4 py-3 border-b border-gray-50 dark:border-gray-700">
                            <Text className="text-xs text-gray-400 dark:text-gray-500 mb-1">Фамилия</Text>
                            <TextInput
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Введите фамилию"
                                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                                className="text-base text-gray-900 dark:text-gray-100"
                            />
                        </View>

                        {/* First Name */}
                        <View className="px-4 py-3 border-b border-gray-50 dark:border-gray-700">
                            <Text className="text-xs text-gray-400 dark:text-gray-500 mb-1">Имя</Text>
                            <TextInput
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="Введите имя"
                                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                                className="text-base text-gray-900 dark:text-gray-100"
                            />
                        </View>

                        {/* Patronymic */}
                        <View className="px-4 py-3 border-b border-gray-50 dark:border-gray-700">
                            <Text className="text-xs text-gray-400 dark:text-gray-500 mb-1">Отчество</Text>
                            <TextInput
                                value={patronymic}
                                onChangeText={setPatronymic}
                                placeholder="Введите отчество"
                                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                                className="text-base text-gray-900 dark:text-gray-100"
                            />
                        </View>

                        {/* Phone */}
                        <View className="px-4 py-3">
                            <Text className="text-xs text-gray-400 dark:text-gray-500 mb-1">Телефон</Text>
                            <View className="flex-row items-center">
                                <Phone size={16} color={isDarkMode ? "#6B7280" : "#9CA3AF"} className="mr-2" />
                                <TextInput
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="+7 (___) ___-__-__"
                                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                                    keyboardType="phone-pad"
                                    className="flex-1 text-base text-gray-900 dark:text-gray-100"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Account Info Section */}
                    <View className="mt-2 mb-1">
                        <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                            Информация об аккаунте
                        </Text>
                    </View>
                    <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
                        <View className="px-4 py-3 border-b border-gray-50 dark:border-gray-700">
                            <Text className="text-xs text-gray-400 dark:text-gray-500 mb-1">Имя пользователя</Text>
                            <Text className="text-base text-gray-900 dark:text-gray-100">{user?.username || '-'}</Text>
                        </View>
                        <View className="px-4 py-3">
                            <Text className="text-xs text-gray-400 dark:text-gray-500 mb-1">Email</Text>
                            <View className="flex-row items-center">
                                <Mail size={16} color={isDarkMode ? "#6B7280" : "#9CA3AF"} className="mr-2" />
                                <Text className="text-base text-gray-900 dark:text-gray-100">{user?.email || '-'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Security Section */}
                    <View className="mt-2 mb-1">
                        <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                            Безопасность
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleChangePassword}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-6 flex-row items-center justify-between px-4 py-4"
                    >
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 items-center justify-center mr-3">
                                <LockIcon size={16} color="#F59E0B" />
                            </View>
                            <Text className="text-base text-gray-900 dark:text-gray-100">Изменить пароль</Text>
                        </View>
                        <ChevronRightIcon size={18} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
                    </TouchableOpacity>

                    {/* Save Button */}
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 rounded-xl py-4 items-center mb-6"
                    >
                        <Text className="text-white font-bold text-base">
                            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
