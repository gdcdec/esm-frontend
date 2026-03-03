import { Button, Input } from '@/src/components/ui';
import { useThemeStore } from '@/src/store/themeStore';
import { router } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const isDarkMode = useThemeStore((s) => s.isDarkMode);

    const handleRequestReset = async () => {
        if (!email) {
            alert('Пожалуйста, введите email');
            return;
        }

        setIsLoading(true);
        try {
            // TODO: Заменить на реальный API вызов
            // await authApi.requestPasswordReset(email);
            
            // Имитация API запроса
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsCodeSent(true);
        } catch (error) {
            alert('Ошибка при отправке кода. Попробуйте еще раз.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!code) {
            alert('Пожалуйста, введите код');
            return;
        }

        setIsLoading(true);
        try {
            // TODO: Заменить на реальный API вызов
            // await authApi.verifyResetCode(email, code);
            
            // Имитация API запроса
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Здесь можно показать поле для нового пароля
        } catch (error) {
            alert('Неверный код. Попробуйте еще раз.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetNewPassword = async () => {
        if (!newPassword || !confirmPassword) {
            alert('Пожалуйста, введите новый пароль и подтверждение');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }

        if (newPassword.length < 6) {
            alert('Пароль должен содержать минимум 6 символов');
            return;
        }

        setIsLoading(true);
        try {
            // TODO: Заменить на реальный API вызов
            // await authApi.confirmPasswordReset(email, code, newPassword);
            
            // Имитация API запроса
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert('Пароль успешно изменен!');
            router.replace('/(auth)/login');
        } catch (error) {
            alert('Ошибка при изменении пароля. Попробуйте еще раз.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-white dark:bg-gray-900"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerClassName="flex-grow justify-center p-6"
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View className="mb-8">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mb-6 flex-row items-center"
                    >
                        <ArrowLeft size={24} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
                        <Text className="ml-2 text-blue-600 dark:text-blue-400 font-medium">Назад</Text>
                    </TouchableOpacity>

                    <View className="items-center">
                        <View className="w-20 h-20 rounded-full bg-blue-50 dark:bg-gray-800 items-center justify-center mb-4">
                            <Mail size={40} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            {isCodeSent ? 'Восстановление пароля' : 'Забыли пароль?'}
                        </Text>
                        <Text className="text-gray-600 dark:text-gray-400 text-center">
                            {!isCodeSent 
                                ? 'Введите email для получения кода восстановления'
                                : 'Введите код из письма и новый пароль'
                            }
                        </Text>
                    </View>
                </View>

                {!isCodeSent ? (
                    // Шаг 1: Ввод email
                    <View className="w-full max-w-sm self-center space-y-4">
                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">Email</Text>
                            <Input
                                placeholder="your@email.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                className="mb-0"
                            />
                        </View>

                        <Button
                            title={isLoading ? 'Отправка...' : 'Отправить код'}
                            onPress={handleRequestReset}
                            disabled={!email || isLoading}
                            className="mt-6"
                        />
                    </View>
                ) : (
                    // Шаг 2: Ввод кода и нового пароля
                    <View className="w-full max-w-sm self-center space-y-4">
                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">Код из письма</Text>
                            <Input
                                placeholder="123456"
                                value={code}
                                onChangeText={setCode}
                                keyboardType="number-pad"
                                maxLength={6}
                                className="mb-0"
                            />
                        </View>

                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">Новый пароль</Text>
                            <Input
                                placeholder="Минимум 6 символов"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                className="mb-0"
                            />
                        </View>

                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">Подтвердите пароль</Text>
                            <Input
                                placeholder="Повторите пароль"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                className="mb-0"
                            />
                        </View>

                        <Button
                            title={isLoading ? 'Сохранение...' : 'Изменить пароль'}
                            onPress={handleSetNewPassword}
                            disabled={!code || !newPassword || !confirmPassword || isLoading}
                            className="mt-6"
                        />
                    </View>
                )}

                {/* Дополнительная информация */}
                <View className="mt-8 items-center">
                    <Text className="text-gray-500 dark:text-gray-400 text-sm text-center">
                        {!isCodeSent 
                            ? 'Мы отправим вам код подтверждения на указанный email'
                            : 'Если письмо не пришло, проверьте папку Спам'
                        }
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
