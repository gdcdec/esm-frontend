import { authService } from '@/src/services/auth';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import { navigateBack } from '@/src/utils/navigation';
import { router } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, Info, Lock, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PasswordScreen() {
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const user = useAuthStore((s) => s.user);
    const insets = useSafeAreaInsets();

    // Шаги: 'request' → 'verify' → 'reset'
    const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
    const [email, setEmail] = useState(user?.email || '');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Уведомление toast
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'error' | 'success'>('error');
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Валидация пароля (те же правила что и в login.tsx)
    const passwordMinLength = newPassword.length >= 8;
    const passwordHasUpper = /[A-ZА-ЯЁ]/.test(newPassword);
    const passwordHasLower = /[a-zа-яё]/.test(newPassword);
    const passwordHasNumber = /[0-9]/.test(newPassword);
    const passwordHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/? ]/.test(newPassword);
    const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
    const isPasswordValid = passwordMinLength && passwordHasUpper && passwordHasLower && passwordHasNumber && passwordHasSpecial;

    const showToast = (message: string, type: 'error' | 'success' = 'error') => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToastMessage(message);
        setToastType(type);
        toastTimer.current = setTimeout(() => {
            setToastMessage(null);
        }, 3000);
    };

    const handleGoBack = () => {
        navigateBack('/(main)/account');
    };

    // Шаг 1: Запрос кода сброса
    const handleRequestCode = async () => {
        if (!email.trim()) {
            showToast('Введите email', 'error');
            return;
        }
        setIsSaving(true);
        try {
            await authService.requestPasswordReset(email.trim());
            showToast('Код отправлен на вашу почту', 'success');
            setStep('verify');
        } catch (error: any) {
            const msg = error?.response?.data?.detail ||
                       error?.response?.data?.email?.[0] ||
                       error?.response?.data?.error ||
                       'Не удалось отправить код';
            showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Шаг 2: Проверка кода
    const handleVerifyCode = async () => {
        if (!code.trim()) {
            showToast('Введите код из письма', 'error');
            return;
        }
        setIsSaving(true);
        try {
            await authService.verifyResetCode(email.trim(), code.trim());
            showToast('Код подтвержден', 'success');
            setStep('reset');
        } catch (error: any) {
            const msg = error?.response?.data?.detail ||
                       error?.response?.data?.code?.[0] ||
                       error?.response?.data?.non_field_errors?.[0] ||
                       'Неверный или просроченный код';
            showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Шаг 3: Установка нового пароля
    const handleResetPassword = async () => {
        if (!isPasswordValid) {
            showToast('Пароль не соответствует требованиям', 'error');
            return;
        }
        if (!passwordsMatch) {
            showToast('Пароли не совпадают', 'error');
            return;
        }
        setIsSaving(true);
        try {
            await authService.confirmPasswordReset(email.trim(), code.trim(), newPassword);
            showToast('Пароль успешно изменен!', 'success');
            setTimeout(() => router.back(), 1500);
        } catch (error: any) {
            const msg = error?.response?.data?.detail ||
                       error?.response?.data?.new_password?.[0] ||
                       error?.response?.data?.error ||
                       'Не удалось изменить пароль';
            showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 'request': return 'Шаг 1 из 3';
            case 'verify': return 'Шаг 2 из 3';
            case 'reset': return 'Шаг 3 из 3';
        }
    };

    const getStepDescription = () => {
        switch (step) {
            case 'request': return 'Отправим код подтверждения на вашу почту';
            case 'verify': return 'Введите код из письма';
            case 'reset': return 'Придумайте новый пароль';
        }
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
                        onPress={() => navigateBack('/(main)/account')}
                        className="p-2 -ml-2 rounded-full"
                    >
                        <ChevronLeft size={24} color={isDarkMode ? "#F9FAFB" : "#111827"} />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg dark:text-gray-100">Изменить пароль</Text>
                    <View className="w-8" />
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
                <View className="w-full max-w-md self-center px-4 pt-6">
                    {/* Step indicator */}
                    <View className="flex-row items-center gap-2 mb-2">
                        {[1, 2, 3].map((s) => (
                            <View
                                key={s}
                                className={`flex-1 h-1 rounded-full ${
                                    s <= (step === 'request' ? 1 : step === 'verify' ? 2 : 3)
                                        ? 'bg-blue-600'
                                        : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                            />
                        ))}
                    </View>
                    <Text className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                        {getStepTitle()}
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        {getStepDescription()}
                    </Text>

                    {/* Step 1: Email */}
                    {step === 'request' && (
                        <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
                            <View className="px-4 py-4">
                                <Text className="text-xs text-gray-400 dark:text-gray-500 mb-2">Email аккаунта</Text>
                                <View className="flex-row items-center">
                                    <Lock size={18} color={isDarkMode ? "#6B7280" : "#9CA3AF"} className="mr-3" />
                                    <TextInput
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="Введите ваш email"
                                        placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        className="flex-1 text-base text-gray-900 dark:text-gray-100"
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Step 2: Code */}
                    {step === 'verify' && (
                        <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
                            <View className="px-4 py-4">
                                <Text className="text-xs text-gray-400 dark:text-gray-500 mb-2">Код подтверждения</Text>
                                <TextInput
                                    value={code}
                                    onChangeText={setCode}
                                    placeholder="Введите код из письма"
                                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                                    keyboardType="number-pad"
                                    className="text-base text-gray-900 dark:text-gray-100 text-center tracking-widest"
                                    style={{ fontSize: 24, letterSpacing: 8 }}
                                />
                            </View>
                        </View>
                    )}

                    {/* Step 3: New password */}
                    {step === 'reset' && (
                        <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
                            <View className="px-4 py-4 border-b border-gray-50 dark:border-gray-700">
                                <Text className="text-xs text-gray-400 dark:text-gray-500 mb-2">Новый пароль</Text>
                                <View className="flex-row items-center">
                                    <Lock size={18} color={isDarkMode ? "#6B7280" : "#9CA3AF"} className="mr-3" />
                                    <TextInput
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        placeholder="Введите новый пароль"
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
                    )}

                    {/* Password requirements (shown on step 3 when typing) */}
                    {step === 'reset' && newPassword.length > 0 && (
                        <View className="mb-4 px-2">
                            {[
                                { ok: passwordMinLength, text: 'Минимум 8 символов' },
                                { ok: passwordHasUpper, text: 'Заглавная буква' },
                                { ok: passwordHasLower, text: 'Строчная буква' },
                                { ok: passwordHasNumber, text: 'Цифра' },
                                { ok: passwordHasSpecial, text: 'Спецсимвол или пробел' },
                            ].map(({ ok, text }) => (
                                <View key={text} className="flex-row items-center gap-2 mb-1">
                                    <View className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                    <Text className={`text-xs ${ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                        {text}
                                    </Text>
                                </View>
                            ))}
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

                    {/* Hint for step 2 */}
                    {step === 'verify' && (
                        <View className="mb-4 px-2">
                            <Text className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                Проверьте ваш email ({email}). Если письмо не пришло, проверьте папку «Спам».
                            </Text>
                            <TouchableOpacity onPress={handleRequestCode} disabled={isSaving} className="mt-2">
                                <Text className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    Отправить код повторно
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Action Button */}
                    <TouchableOpacity
                        onPress={
                            step === 'request' ? handleRequestCode :
                            step === 'verify' ? handleVerifyCode :
                            handleResetPassword
                        }
                        disabled={isSaving}
                        className={`rounded-xl py-4 items-center mb-6 ${isSaving ? 'bg-blue-400' : 'bg-blue-600'}`}
                    >
                        <Text className="text-white font-bold text-base">
                            {isSaving ? 'Загрузка...' :
                             step === 'request' ? 'Отправить код' :
                             step === 'verify' ? 'Подтвердить код' :
                             'Изменить пароль'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
