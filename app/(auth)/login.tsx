import { Button, Input } from '@/src/components/ui';
import { authService } from '@/src/services/auth';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import { router } from 'expo-router';
import { CheckSquare, Eye, EyeOff, Square } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password validation
    const passwordMinLength = password.length >= 6;
    const passwordHasLetter = /[a-zA-Zа-яА-Я]/.test(password);
    const passwordHasNumber = /[0-9]/.test(password);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    const isPasswordValid = passwordMinLength && passwordHasLetter && passwordHasNumber;

    const login = useAuthStore((state) => state.login);
    const isDarkMode = useThemeStore((s) => s.isDarkMode);

    const handleSubmit = async () => {
        setError('');
        setIsLoading(true);

        try {
            if (isLogin) {
                // ── Login ──
                const data = await authService.login(username, password);
                login(
                    {
                        id: data.user_id,
                        username: data.username,
                        email: data.email,
                        first_name: data.first_name,
                        last_name: data.last_name,
                    },
                    data.token
                );
                router.replace('/(main)/map');
            } else {
                // ── Register ──
                if (!isPasswordValid) {
                    setError('Пароль не соответствует требованиям');
                    setIsLoading(false);
                    return;
                }
                if (!passwordsMatch) {
                    setError('Пароли не совпадают');
                    setIsLoading(false);
                    return;
                }

                const data = await authService.register({
                    username: username,
                    email,
                    password,
                    password2: confirmPassword,
                    first_name: firstName,
                    last_name: lastName,
                });

                login(
                    {
                        id: data.user.id,
                        username: data.user.username,
                        email: data.user.email,
                        first_name: data.user.first_name,
                        last_name: data.user.last_name,
                        city: data.user.city,
                    },
                    data.token
                );
                router.replace('/(main)/map');
            }
        } catch (err: any) {
            const msg =
                err?.response?.data?.non_field_errors?.[0] ||
                err?.response?.data?.detail ||
                err?.response?.data?.username?.[0] ||
                err?.response?.data?.email?.[0] ||
                err?.response?.data?.password?.[0] ||
                err?.response?.data?.message ||
                'Ошибка соединения с сервером';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setIsLoading(false);
        }
    };

    const isSubmitDisabled = isLoading || (!isLogin && !agreed);

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-white dark:bg-gray-900"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerClassName="flex-grow justify-center p-6"
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo */}
                <View className="items-center mb-8">
                    <View className="w-24 h-24 rounded-full bg-blue-50 dark:bg-gray-800 items-center justify-center mb-6 shadow-sm">
                        <Text className="text-5xl">🏙️</Text>
                    </View>
                    <Text className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Мой Донос*</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-center px-4">
                        Сделаем наш город лучше вместе
                    </Text>
                </View>

                {/* Form */}
                <View className="w-full max-w-sm self-center">
                    {!isLogin && (
                        <>
                            <Input
                                placeholder="Имя"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                            <Input
                                placeholder="Фамилия"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </>
                    )}

                    <Input
                        placeholder={isLogin ? "Имя пользователя или Email" : "Имя пользователя"}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />

                    {!isLogin && (
                        <Input
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    )}

                    <View className="relative justify-center mb-3">
                        <Input
                            placeholder="Пароль"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            hideClearButton
                            className="mb-0"
                        />
                        {!isLogin && (
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                className="absolute right-0 top-0 bottom-0 justify-center px-4"
                            >
                                {showPassword ? (
                                    <EyeOff size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                                ) : (
                                    <Eye size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    {!isLogin && (
                        <>
                            <View className="relative justify-center mb-3">
                                <Input
                                    placeholder="Повторите пароль"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    hideClearButton
                                    className="mb-0"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-0 top-0 bottom-0 justify-center px-4"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                                    ) : (
                                        <Eye size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Password requirements */}
                            {password.length > 0 && (
                                <View className="mb-3 px-1">
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <View className={`w-1.5 h-1.5 rounded-full ${passwordMinLength ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                        <Text className={`text-xs ${passwordMinLength ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                            Минимум 6 символов
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <View className={`w-1.5 h-1.5 rounded-full ${passwordHasLetter ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                        <Text className={`text-xs ${passwordHasLetter ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                            Содержит букву
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <View className={`w-1.5 h-1.5 rounded-full ${passwordHasNumber ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                        <Text className={`text-xs ${passwordHasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                            Содержит цифру
                                        </Text>
                                    </View>
                                    {confirmPassword.length > 0 && (
                                        <View className="flex-row items-center gap-2">
                                            <View className={`w-1.5 h-1.5 rounded-full ${passwordsMatch ? 'bg-green-500' : 'bg-red-400'}`} />
                                            <Text className={`text-xs ${passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                                {passwordsMatch ? 'Пароли совпадают' : 'Пароли не совпадают'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            <TouchableOpacity
                                className="flex-row items-center gap-3 py-2"
                                onPress={() => setAgreed(!agreed)}
                            >
                                {agreed ? (
                                    <CheckSquare size={20} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
                                ) : (
                                    <Square size={20} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
                                )}
                                <Text className="text-sm text-gray-600 dark:text-gray-300">
                                    Я согласен с правилами приложения
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {isLogin && (
                        <View className="flex-row justify-end pb-2">
                            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                                <Text className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                    Забыли пароль?
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Error message */}
                    {error ? (
                        <View className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl mb-2">
                            <Text className="text-red-600 dark:text-red-400 text-sm text-center">{error}</Text>
                        </View>
                    ) : null}

                    <View className="pt-2">
                        <Button
                            title={isLoading
                                ? (isLogin ? 'Вход...' : 'Регистрация...')
                                : (isLogin ? 'Войти' : 'Зарегистрироваться')
                            }
                            onPress={handleSubmit}
                            disabled={isSubmitDisabled}
                        />
                    </View>

                    <TouchableOpacity
                        className="py-4 items-center"
                        onPress={() => { setIsLogin(!isLogin); setError(''); }}
                    >
                        <Text className="text-blue-600 dark:text-blue-400 font-medium">
                            {isLogin ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
