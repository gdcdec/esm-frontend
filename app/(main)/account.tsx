import { authService } from '@/src/services/auth';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import { navigateBack } from '@/src/utils/navigation';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight as ChevronRightIcon, Info, Lock as LockIcon, Mail, Phone, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountScreen() {
    const user = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const insets = useSafeAreaInsets();

    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [lastName, setLastName] = useState(user?.last_name || '');
    const [patronymic, setPatronymic] = useState(user?.patronymic || '');
    const [phone, setPhone] = useState(user?.phone_number || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Состояние уведомления (тот же паттерн что и в create.tsx)
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'error' | 'success'>('error');
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Валидация телефона
    const digitsOnly = phone.replace(/\D/g, '');
    const isPhoneValid = digitsOnly.length === 0 || (digitsOnly.length === 11 && digitsOnly.startsWith('7'));
    const phoneError = phone.length > 0 && !isPhoneValid;

    const showToast = (message: string, type: 'error' | 'success' = 'error') => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToastMessage(message);
        setToastType(type);
        toastTimer.current = setTimeout(() => {
            setToastMessage(null);
        }, 3000);
    };

    const handlePhoneChange = (text: string) => {
        let digits = text.replace(/\D/g, '');
        if (digits.startsWith('8')) digits = '7' + digits.slice(1);
        if (!digits) { setPhone(''); return; }
        if (!digits.startsWith('7')) digits = '7' + digits;

        let res = '+7';
        if (digits.length > 1) res += ' (' + digits.slice(1, 4);
        if (digits.length >= 5) res += ') ' + digits.slice(4, 7);
        if (digits.length >= 8) res += '-' + digits.slice(7, 9);
        if (digits.length >= 10) res += '-' + digits.slice(9, 11);

        setPhone(res);
    };

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
            } catch {
                // Используем кэшированные данные пользователя из хранилища
            } finally {
                setIsLoading(false);
            }
        };
        loadUserProfile();
    }, []);

    const handleSave = async () => {
        // Валидация телефона
        if (phone.length > 0 && !isPhoneValid) {
            showToast('Телефон должен содержать 11 цифр и начинаться с 7', 'error');
            return;
        }

        setIsSaving(true);
        try {
        // Отправляем только непустые поля — валидаторы бэкенда отклоняют пустые строки
            // для first_name, last_name, phone_number и т.д. (allow_blank=True не обходит валидаторы)
            const payload: Record<string, string> = {};
            if (firstName.trim())  payload.first_name  = firstName.trim();
            if (lastName.trim())   payload.last_name   = lastName.trim();
            if (patronymic.trim()) payload.patronymic  = patronymic.trim();
            if (digitsOnly.length === 11) {
                payload.phone_number = `+${digitsOnly}`;
            }

            const updatedUser = await authService.updateCurrentUser(payload);
            setUser(updatedUser);
            showToast('Данные профиля обновлены', 'success');
        } catch (error: any) {
            const data = error?.response?.data;
            const message =
                data?.detail ||
                data?.first_name?.[0] ||
                data?.last_name?.[0] ||
                data?.phone_number?.[0] ||
                data?.patronymic?.[0] ||
                data?.non_field_errors?.[0] ||
                'Не удалось сохранить изменения';
            showToast(typeof message === 'string' ? message : JSON.stringify(message), 'error');
        } finally {
            setIsSaving(false);

        }
    };

    const handleGoBack = () => {
        navigateBack('/(main)/profile');
    };

    const handleChangePassword = () => {
        router.push('/(main)/password');
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Toast Notification */}
            {toastMessage && (
                <View
                    className={`absolute left-4 right-4 ${toastType === 'success' ? 'bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800' : 'bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800'} rounded-2xl p-4 shadow-xl flex-row items-center`}
                    style={{ top: Math.max(insets.top + 8, 16), elevation: 12, zIndex: 9999 }}
                >
                    <Info size={22} color={toastType === 'success' ? (isDarkMode ? '#86EFAC' : '#16A34A') : (isDarkMode ? '#FCA5A5' : '#DC2626')} />
                    <Text className={`${toastType === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'} font-medium ml-3 flex-1`}>{toastMessage}</Text>
                    <TouchableOpacity onPress={() => setToastMessage(null)} className="p-1">
                        <X size={20} color={toastType === 'success' ? (isDarkMode ? '#86EFAC' : '#16A34A') : (isDarkMode ? '#FCA5A5' : '#DC2626')} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Header */}
            <SafeAreaView edges={['top']} className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800">
                <View className="flex-row items-center justify-between px-4 py-3">
                    <TouchableOpacity
                        onPress={() => navigateBack('/(main)/profile')}
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

                        {/* Phone with validation */}
                        <View className="px-4 py-3">
                            <Text className="text-xs text-gray-400 dark:text-gray-500 mb-1">Телефон</Text>
                            <View className="flex-row items-center">
                                <Phone size={16} color={phoneError ? '#EF4444' : (isDarkMode ? "#6B7280" : "#9CA3AF")} className="mr-2" />
                                <TextInput
                                    value={phone}
                                    onChangeText={handlePhoneChange}
                                    placeholder="+7 (___) ___-__-__"
                                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                                    keyboardType="phone-pad"
                                    className="flex-1 text-base text-gray-900 dark:text-gray-100"
                                />
                            </View>
                            {phoneError && (
                                <Text className="text-xs text-red-500 dark:text-red-400 mt-1">
                                    Телефон должен содержать 11 цифр и начинаться с 7
                                </Text>
                            )}
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
                        disabled={isSaving || phoneError}
                        className={`rounded-xl py-4 items-center mb-6 ${
                            isSaving || phoneError ? 'bg-blue-400' : 'bg-blue-600'
                        }`}
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
