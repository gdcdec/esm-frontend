import { Button, Input } from '@/src/components/ui';
import { authService } from '@/src/services/auth';
import { useThemeStore } from '@/src/store/themeStore';
import { navigateBack } from '@/src/utils/navigation';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isCodeVerified, setIsCodeVerified] = useState(false);

    const isDarkMode = useThemeStore((s) => s.isDarkMode);

    const handleRequestReset = async () => {
        if (!email) {
            setError('Пожалуйста, введите email');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            await authService.requestPasswordReset(email);
            setIsCodeSent(true);
        } catch (err: any) {
            const msg =
                err?.response?.data?.email?.[0] ||
                err?.response?.data?.error ||
                err?.response?.data?.detail ||
                'Ошибка при отправке кода. Проверьте email и попробуйте еще раз.';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!code) {
            setError('Пожалуйста, введите код');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const res = await authService.verifyResetCode(email, code);
            if (res.verified) {
                setIsCodeVerified(true);
            }
        } catch (err: any) {
            const msg =
                err?.response?.data?.code?.[0] ||
                err?.response?.data?.error ||
                err?.response?.data?.detail ||
                'Неверный код. Попробуйте еще раз.';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetNewPassword = async () => {
        if (!newPassword || !confirmPassword) {
            setError('Пожалуйста, введите новый пароль и подтверждение');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        if (newPassword.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            await authService.confirmPasswordReset(email, code, newPassword);
            // Success — show alert and go back
            setError('');
            router.replace('/(auth)/login');
            // Use setTimeout to show alert after navigation
            setTimeout(() => {
                Alert.alert('Успех', 'Пароль успешно изменен! Теперь вы можете войти с новым паролем.');
            }, 300);
        } catch (err: any) {
            const msg =
                err?.response?.data?.new_password?.[0] ||
                err?.response?.data?.error ||
                err?.response?.data?.detail ||
                'Ошибка при изменении пароля. Попробуйте еще раз.';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setIsLoading(false);
        }
    };

    const getTitle = () => {
        if (!isCodeSent) return 'Забыли пароль?';
        if (!isCodeVerified) return 'Введите код';
        return 'Новый пароль';
    };

    const getSubtitle = () => {
        if (!isCodeSent) return 'Введите email для получения кода восстановления';
        if (!isCodeVerified) return `Мы отправили 6-значный код на ${email}`;
        return 'Придумайте новый надёжный пароль';
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
                <View className="items-center mb-8">
                    <View className="w-20 h-20 rounded-full bg-blue-50 dark:bg-gray-800 items-center justify-center mb-4">
                        <Mail size={40} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {getTitle()}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-center">
                        {getSubtitle()}
                    </Text>
                </View>

                {/* Error */}
                {error ? (
                    <View className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl mb-4 w-full max-w-sm self-center">
                        <Text className="text-red-600 dark:text-red-400 text-sm text-center">{error}</Text>
                    </View>
                ) : null}

                {!isCodeSent ? (
                    // Step 1: Enter email
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
                ) : !isCodeVerified ? (
                    // Step 2: Enter verification code
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

                        <Button
                            title={isLoading ? 'Проверка...' : 'Подтвердить код'}
                            onPress={handleVerifyCode}
                            disabled={!code || isLoading}
                            className="mt-6"
                        />

                        <TouchableOpacity
                            className="py-3 items-center"
                            onPress={handleRequestReset}
                            disabled={isLoading}
                        >
                            <Text className="text-blue-600 dark:text-blue-400 text-sm">Отправить код повторно</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    // Step 3: Set new password
                    <View className="w-full max-w-sm self-center space-y-4">
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
                            disabled={!newPassword || !confirmPassword || isLoading}
                            className="mt-6"
                        />
                    </View>
                )}

                {/* Info text */}
                <View className="mt-6 items-center">
                    <Text className="text-gray-500 dark:text-gray-400 text-sm text-center">
                        {!isCodeSent
                            ? 'Мы отправим вам код подтверждения на указанный email'
                            : 'Если письмо не пришло, проверьте папку Спам'
                        }
                    </Text>
                </View>

                <TouchableOpacity
                    className="py-4 items-center"
                    onPress={() => navigateBack('/(auth)/login')}
                >
                    <Text className="text-blue-600 dark:text-blue-400 font-medium">
                        Вспомнили пароль? Войти
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
