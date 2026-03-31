import { Button, Input } from '@/src/components/ui';
import { authService } from '@/src/services/auth';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import { router } from 'expo-router';
import { CheckSquare, Eye, EyeOff, Square } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, Modal } from 'react-native';

export default function LoginScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [patronymic, setPatronymic] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [city, setCity] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Modals
    const [showCityModal, setShowCityModal] = useState(false);
    const [citySearchQuery, setCitySearchQuery] = useState('');
    const CITIES = ['Самара', 'Москва', 'Санкт-Петербург', 'Владивосток', 'Казань', 'Екатеринбург', 'Нижний Новгород', 'Новосибирск'];

    const filteredCities = CITIES.filter(c => c.toLowerCase().includes(citySearchQuery.toLowerCase()));

    // Password validation
    const passwordMinLength = password.length >= 8;
    const passwordHasUpper = /[A-ZА-ЯЁ]/.test(password);
    const passwordHasLower = /[a-zа-яё]/.test(password);
    const passwordHasNumber = /[0-9]/.test(password);
    const passwordHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/? ]/.test(password);

    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    const isPasswordValid = passwordMinLength && 
        passwordHasUpper && 
        passwordHasLower && 
        passwordHasNumber && 
        passwordHasSpecial;

    // Phone validation
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const isPhoneValid = digitsOnly.length === 11 && digitsOnly.startsWith('7');

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
                if (!isPhoneValid) {
                    setError('Телефон должен содержать 11 цифр и начинаться с 7 (или 8)');
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
                    patronymic,
                    phone_number: `+${digitsOnly}`,
                    city,
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
            console.warn('Login/Register error:', err.response?.data || err.message);
            let msg = 'Ошибка соединения с сервером';
            if (err?.response?.data) {
                const data = err.response.data;
                if (data.non_field_errors) msg = data.non_field_errors[0];
                else if (data.detail) msg = data.detail;
                else if (data.message) msg = data.message;
                else if (data.username) msg = `Имя пользователя: ${data.username[0]}`;
                else if (data.email) msg = `Email: ${data.email[0]}`;
                else if (data.password) msg = `Пароль: ${data.password[0]}`;
                else if (data.password2) msg = `Повтор пароля: ${data.password2[0]}`;
                else if (data.first_name) msg = `Имя: ${data.first_name[0]}`;
                else if (data.last_name) msg = `Фамилия: ${data.last_name[0]}`;
                else if (data.patronymic) msg = `Отчество: ${data.patronymic[0]}`;
                else if (data.phone_number) msg = `Телефон: ${data.phone_number[0]}`;
                else if (data.city) msg = `Город: ${data.city[0]}`;
                else {
                    const firstKey = Object.keys(data)[0];
                    if (firstKey && Array.isArray(data[firstKey])) {
                        msg = `${firstKey}: ${data[firstKey][0]}`;
                    } else if (typeof data === 'string') {
                        msg = data;
                    }
                }
            } else if (err.message) {
                msg = err.message;
            }
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
                            <Input
                                placeholder="Отчество (необязательно)"
                                value={patronymic}
                                onChangeText={setPatronymic}
                            />
                            <Input
                                placeholder="Телефон"
                                value={phoneNumber}
                                onChangeText={(text) => {
                                    let digits = text.replace(/\D/g, '');
                                    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
                                    if (!digits) { setPhoneNumber(''); return; }
                                    if (!digits.startsWith('7')) digits = '7' + digits;
                                    
                                    let res = '+7';
                                    if (digits.length > 1) res += ' (' + digits.slice(1, 4);
                                    if (digits.length >= 5) res += ') ' + digits.slice(4, 7);
                                    if (digits.length >= 8) res += '-' + digits.slice(7, 9);
                                    if (digits.length >= 10) res += '-' + digits.slice(9, 11);
                                    
                                    setPhoneNumber(res);
                                }}
                                keyboardType="phone-pad"
                            />
                            <TouchableOpacity 
                                onPress={() => setShowCityModal(true)}
                                className="flex-row items-center h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 border border-gray-200 dark:border-gray-700 mb-4"
                            >
                                <Text className={city ? 'text-gray-900 dark:text-gray-100 flex-1' : 'text-gray-400 dark:text-gray-500 flex-1'}>
                                    {city || 'Выберите город'}
                                </Text>
                            </TouchableOpacity>
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

                    <View className="relative">
                        <Input
                            placeholder="Пароль"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            hideClearButton
                        />
                        {password.length > 0 && (
                            <View className="absolute right-0 top-0 bottom-3 justify-center">
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    className="px-4 py-2"
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                                    ) : (
                                        <Eye size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {!isLogin && (
                        <>
                            <View className="relative">
                                <Input
                                    placeholder="Повторите пароль"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    hideClearButton
                                />
                                {confirmPassword.length > 0 && (
                                    <View className="absolute right-0 top-0 bottom-3 justify-center">
                                        <TouchableOpacity
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="px-4 py-2"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                                            ) : (
                                                <Eye size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Password requirements */}
                            {password.length > 0 && (
                                <View className="mb-3 px-1">
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <View className={`w-1.5 h-1.5 rounded-full ${passwordMinLength ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                        <Text className={`text-xs ${passwordMinLength ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                            Минимум 8 символов
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <View className={`w-1.5 h-1.5 rounded-full ${passwordHasUpper ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                        <Text className={`text-xs ${passwordHasUpper ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                            Заглавная буква
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <View className={`w-1.5 h-1.5 rounded-full ${passwordHasLower ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                        <Text className={`text-xs ${passwordHasLower ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                            Строчная буква
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <View className={`w-1.5 h-1.5 rounded-full ${passwordHasNumber ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                        <Text className={`text-xs ${passwordHasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                            Цифра
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <View className={`w-1.5 h-1.5 rounded-full ${passwordHasSpecial ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                        <Text className={`text-xs ${passwordHasSpecial ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                            Спецсимвол или пробел
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

                            <View className="flex-row items-center gap-3 py-2">
                                <TouchableOpacity onPress={() => setAgreed(!agreed)}>
                                    {agreed ? (
                                        <CheckSquare size={20} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
                                    ) : (
                                        <Square size={20} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
                                    )}
                                </TouchableOpacity>
                                <Text className="text-sm text-gray-600 dark:text-gray-300 flex-1 flex-wrap">
                                    Я согласен с{' '}
                                    <Text
                                        className="text-blue-600 dark:text-blue-400 underline"
                                        onPress={() => router.push('/(auth)/rules')}
                                    >
                                        пользовательским соглашением
                                    </Text>
                                </Text>
                            </View>
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

            {/* City Input Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showCityModal}
                onRequestClose={() => setShowCityModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-4">
                    <View className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-xl leading-relaxed">
                        <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Выберите город</Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">Укажите город проживания</Text>

                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100 mb-4"
                            placeholder="Поиск города..."
                            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                            value={citySearchQuery}
                            onChangeText={setCitySearchQuery}
                        />

                        <ScrollView style={{ maxHeight: 250 }} className="mb-4 rounded-xl bg-gray-50 dark:bg-gray-900">
                            {filteredCities.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    onPress={() => {
                                        setCity(c);
                                        setShowCityModal(false);
                                        setCitySearchQuery('');
                                    }}
                                    className={`p-4 border-b border-gray-200 dark:border-gray-800 flex-row justify-between items-center ${city === c ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}
                                >
                                    <Text className={`text-base ${city === c ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {c}
                                    </Text>
                                    {city === c && <CheckSquare size={20} color={isDarkMode ? '#60A5FA' : '#2563EB'} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View className="flex-row justify-end gap-3">
                            <TouchableOpacity
                                onPress={() => setShowCityModal(false)}
                                className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 w-full"
                            >
                                <Text className="text-gray-700 dark:text-gray-300 font-semibold text-center">Отмена</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}
