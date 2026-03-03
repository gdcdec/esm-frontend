import { Button, Input } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import { router } from 'expo-router';
import { CheckSquare, Square } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreed, setAgreed] = useState(false);

    const login = useAuthStore((state) => state.login);
    const isDarkMode = useThemeStore((s) => s.isDarkMode);

    const handleSubmit = () => {
        // Demo: skip actual API call, just log in
        login(
            {
                id: 1,
                name: name || 'Алексей Н.',
                email: email || 'user@example.com',
                level: 5,
                xp: 350,
                nextLevelXp: 500,
            },
            'demo-token'
        );
        router.replace('/(main)/map');
    };

    const isSubmitDisabled = !isLogin && !agreed;

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
                        <Input
                            placeholder="Имя пользователя"
                            value={name}
                            onChangeText={setName}
                        />
                    )}
                    <Input
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <Input
                        placeholder="Пароль"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    {!isLogin && (
                        <>
                            <Input
                                placeholder="Повторите пароль"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
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

                    <View className="pt-2">
                        <Button
                            title={isLogin ? 'Войти' : 'Зарегистрироваться'}
                            onPress={handleSubmit}
                            disabled={isSubmitDisabled}
                        />
                    </View>

                    <TouchableOpacity
                        className="py-4 items-center"
                        onPress={() => setIsLogin(!isLogin)}
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
