import { useThemeStore } from '@/src/store/themeStore';
import { router } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, Lock } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PasswordScreen() {
    const isDarkMode = useThemeStore((s) => s.isDarkMode);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleGoBack = () => {
        router.back();
    };

    const handleChangePassword = async () => {
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Ошибка', 'Заполните все поля');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Ошибка', 'Новый пароль должен содержать минимум 6 символов');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Ошибка', 'Новые пароли не совпадают');
            return;
        }

        setIsSaving(true);
        try {
            await authService.changePassword(currentPassword, newPassword);
            Alert.alert('Успех', 'Пароль успешно изменен');
            router.back();
        } catch (error: any) {
            const message = error?.response?.data?.detail || 
                          error?.response?.data?.old_password?.[0] || 
                          'Не удалось изменить пароль. Проверьте текущий пароль.';
            Alert.alert('Ошибка', message);
        } finally {
            setIsSaving(false);
        }
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
                    <Text className="font-bold text-lg dark:text-gray-100">Изменить пароль</Text>
                    <View className="w-8" />
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1">
                <View className="w-full max-w-md self-center px-4 pt-6">
                    {/* Current Password */}
                    <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
                        <View className="px-4 py-4">
                            <Text className="text-xs text-gray-400 dark:text-gray-500 mb-2">Текущий пароль</Text>
                            <View className="flex-row items-center">
                                <Lock size={18} color={isDarkMode ? "#6B7280" : "#9CA3AF"} className="mr-3" />
                                <TextInput
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="Введите текущий пароль"
                                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                                    secureTextEntry={!showCurrentPassword}
                                    className="flex-1 text-base text-gray-900 dark:text-gray-100"
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="p-2"
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                                    ) : (
                                        <Eye size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* New Password */}
                    <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
                        <View className="px-4 py-4 border-b border-gray-50 dark:border-gray-700">
                            <Text className="text-xs text-gray-400 dark:text-gray-500 mb-2">Новый пароль</Text>
                            <View className="flex-row items-center">
                                <Lock size={18} color={isDarkMode ? "#6B7280" : "#9CA3AF"} className="mr-3" />
                                <TextInput
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Введите новый пароль (мин. 6 символов)"
                                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                                    secureTextEntry={!showNewPassword}
                                    className="flex-1 text-base text-gray-900 dark:text-gray-100"
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                    className="p-2"
                                >
                                    {showNewPassword ? (
                                        <EyeOff size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                                    ) : (
                                        <Eye size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm New Password */}
                        <View className="px-4 py-4">
                            <Text className="text-xs text-gray-400 dark:text-gray-500 mb-2">Подтвердите новый пароль</Text>
                            <View className="flex-row items-center">
                                <Lock size={18} color={isDarkMode ? "#6B7280" : "#9CA3AF"} className="mr-3" />
                                <TextInput
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Повторите новый пароль"
                                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                                    secureTextEntry={!showConfirmPassword}
                                    className="flex-1 text-base text-gray-900 dark:text-gray-100"
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="p-2"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                                    ) : (
                                        <Eye size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Hint */}
                    <View className="mb-6 px-2">
                        <Text className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Пароль должен содержать минимум 6 символов. Рекомендуется использовать комбинацию букв, цифр и специальных символов.
                        </Text>
                    </View>

                    {/* Change Password Button */}
                    <TouchableOpacity
                        onPress={handleChangePassword}
                        disabled={isSaving}
                        className="bg-blue-600 rounded-xl py-4 items-center mb-6"
                    >
                        <Text className="text-white font-bold text-base">
                            {isSaving ? 'Сохранение...' : 'Изменить пароль'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
