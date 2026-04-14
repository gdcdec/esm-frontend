import { Button, Input } from '@/src/components/ui';
import { authService } from '@/src/services/auth';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import { router } from 'expo-router';
import { CheckSquare, ChevronDown, Eye, EyeOff, MapPin, Square } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const isWeb = Platform.OS === 'web';

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

    // Модальные окна
    const [showCityModal, setShowCityModal] = useState(false);
    const [citySearchQuery, setCitySearchQuery] = useState('');
    const CITIES = ['Самара', 'Москва', 'Санкт-Петербург', 'Владивосток', 'Казань', 'Екатеринбург', 'Нижний Новгород', 'Новосибирск'];

    const filteredCities = CITIES.filter(c => c.toLowerCase().includes(citySearchQuery.toLowerCase()));

    // Валидация пароля
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

    // Валидация телефона
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const isPhoneValid = digitsOnly.length === 11 && digitsOnly.startsWith('7');

    const login = useAuthStore((state) => state.login);
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const insets = useSafeAreaInsets();

    // Анимации
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 4,
                tension: 50,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

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

    // ── Tab switcher ──
    const TabSwitcher = () => (
        <View
            style={{
                flexDirection: 'row',
                backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
                borderRadius: 14,
                padding: 4,
                marginBottom: 24,
            }}
        >
            <TouchableOpacity
                onPress={() => { setIsLogin(true); setError(''); }}
                style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 11,
                    alignItems: 'center',
                    backgroundColor: isLogin
                        ? (isDarkMode ? '#374151' : '#FFFFFF')
                        : 'transparent',
                    ...(isLogin ? {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 2,
                    } : {}),
                }}
            >
                <Text style={{
                    fontWeight: isLogin ? '700' : '500',
                    fontSize: 15,
                    color: isLogin
                        ? (isDarkMode ? '#F9FAFB' : '#111827')
                        : (isDarkMode ? '#9CA3AF' : '#6B7280'),
                }}>
                    Вход
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => { setIsLogin(false); setError(''); }}
                style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 11,
                    alignItems: 'center',
                    backgroundColor: !isLogin
                        ? (isDarkMode ? '#374151' : '#FFFFFF')
                        : 'transparent',
                    ...(!isLogin ? {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 2,
                    } : {}),
                }}
            >
                <Text style={{
                    fontWeight: !isLogin ? '700' : '500',
                    fontSize: 15,
                    color: !isLogin
                        ? (isDarkMode ? '#F9FAFB' : '#111827')
                        : (isDarkMode ? '#9CA3AF' : '#6B7280'),
                }}>
                    Регистрация
                </Text>
            </TouchableOpacity>
        </View>
    );

    // ── Password requirement row ──
    const ReqRow = ({ ok, text }: { ok: boolean; text: string }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <View style={{
                width: 18, height: 18, borderRadius: 9,
                backgroundColor: ok ? '#22C55E' : (isDarkMode ? '#374151' : '#E5E7EB'),
                alignItems: 'center', justifyContent: 'center',
            }}>
                {ok && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✓</Text>}
            </View>
            <Text style={{
                fontSize: 13,
                color: ok
                    ? (isDarkMode ? '#86EFAC' : '#16A34A')
                    : (isDarkMode ? '#6B7280' : '#9CA3AF'),
            }}>
                {text}
            </Text>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#030712' : '#EFF6FF', overflow: 'hidden' }}>
            {/* Decorative gradient circles (web only, native handles via bg color) */}
            {isWeb && (
                <>
                    <div style={{
                        position: 'absolute', top: -120, right: -100,
                        width: 400, height: 400, borderRadius: 999,
                        background: isDarkMode
                            ? 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: -80, left: -120,
                        width: 350, height: 350, borderRadius: 999,
                        background: isDarkMode
                            ? 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                </>
            )}

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'center',
                        paddingTop: 24,
                        paddingBottom: Math.max(insets.bottom, 24),
                        paddingHorizontal: 16,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                >
                    {/* ── Animated Logo ── */}
                    <Animated.View style={{
                        alignItems: 'center',
                        marginBottom: 28,
                        paddingHorizontal: 24,
                        opacity: fadeAnim,
                        transform: [
                            { translateY: slideAnim },
                            { scale: logoScale },
                        ],
                    }}>
                        <View style={{
                            width: 88, height: 88, borderRadius: 24,
                            alignItems: 'center', justifyContent: 'center',
                            marginBottom: 16,
                            shadowColor: '#3B82F6',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.25,
                            shadowRadius: 16,
                            elevation: 8,
                            overflow: 'hidden',
                        }}>
                            <Image
                                source={require('@/assets/images/icon.png')}
                                style={{ width: 88, height: 88, borderRadius: 24 }}
                                resizeMode="cover"
                            />
                        </View>
                        <Text style={{
                            fontSize: 28, fontWeight: '800',
                            color: isDarkMode ? '#F9FAFB' : '#111827',
                            letterSpacing: -0.5,
                            marginBottom: 6,
                        }}>
                            Мой Донос
                        </Text>
                        <Text style={{
                            fontSize: 15, fontWeight: '400',
                            color: isDarkMode ? '#9CA3AF' : '#6B7280',
                            textAlign: 'center',
                        }}>
                            Сделаем наш город лучше вместе
                        </Text>
                    </Animated.View>

                    {/* ── Form Card ── */}
                    <Animated.View style={{
                        width: '100%',
                        maxWidth: 420,
                        alignSelf: 'center',
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                        backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
                        borderRadius: 24,
                        padding: 24,
                        shadowColor: isDarkMode ? '#000' : '#94A3B8',
                        shadowOffset: { width: 0, height: 12 },
                        shadowOpacity: isDarkMode ? 0.4 : 0.12,
                        shadowRadius: 24,
                        elevation: 12,
                        borderWidth: 1,
                        borderColor: isDarkMode ? '#1F2937' : '#F1F5F9',
                    }}>
                        <TabSwitcher />

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
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        height: 52,
                                        backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                                        borderRadius: 12,
                                        paddingHorizontal: 16,
                                        borderWidth: 1,
                                        borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                                        marginBottom: 12,
                                    }}
                                >
                                    <MapPin size={18} color={isDarkMode ? '#6B7280' : '#9CA3AF'} style={{ marginRight: 10 }} />
                                    <Text style={{
                                        flex: 1,
                                        fontSize: 16,
                                        color: city
                                            ? (isDarkMode ? '#F3F4F6' : '#111827')
                                            : (isDarkMode ? '#6B7280' : '#9CA3AF'),
                                    }}>
                                        {city || 'Выберите город'}
                                    </Text>
                                    <ChevronDown size={18} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
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
                                    <View style={{
                                        marginBottom: 16,
                                        paddingHorizontal: 4,
                                        paddingVertical: 12,
                                        backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                                        borderRadius: 12,
                                        paddingLeft: 16,
                                    }}>
                                        <ReqRow ok={passwordMinLength} text="Минимум 8 символов" />
                                        <ReqRow ok={passwordHasUpper} text="Заглавная буква" />
                                        <ReqRow ok={passwordHasLower} text="Строчная буква" />
                                        <ReqRow ok={passwordHasNumber} text="Цифра" />
                                        <ReqRow ok={passwordHasSpecial} text="Спецсимвол или пробел" />
                                        {confirmPassword.length > 0 && (
                                            <ReqRow ok={passwordsMatch} text={passwordsMatch ? 'Пароли совпадают' : 'Пароли не совпадают'} />
                                        )}
                                    </View>
                                )}

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
                                    <TouchableOpacity onPress={() => setAgreed(!agreed)}>
                                        {agreed ? (
                                            <CheckSquare size={22} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
                                        ) : (
                                            <Square size={22} color={isDarkMode ? '#4B5563' : '#D1D5DB'} />
                                        )}
                                    </TouchableOpacity>
                                    <Text style={{
                                        fontSize: 14,
                                        color: isDarkMode ? '#D1D5DB' : '#4B5563',
                                        flex: 1, flexWrap: 'wrap',
                                    }}>
                                        Я согласен с{' '}
                                        <Text
                                            style={{ color: isDarkMode ? '#60A5FA' : '#2563EB', textDecorationLine: 'underline' }}
                                            onPress={() => router.push('/(auth)/rules')}
                                        >
                                            пользовательским соглашением
                                        </Text>
                                    </Text>
                                </View>
                            </>
                        )}

                        {isLogin && (
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingBottom: 8 }}>
                                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                                    <Text style={{
                                        fontSize: 14, fontWeight: '500',
                                        color: isDarkMode ? '#60A5FA' : '#2563EB',
                                    }}>
                                        Забыли пароль?
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Error message */}
                        {error ? (
                            <View style={{
                                backgroundColor: isDarkMode ? 'rgba(239,68,68,0.1)' : '#FEF2F2',
                                padding: 14,
                                borderRadius: 12,
                                marginBottom: 8,
                                borderWidth: 1,
                                borderColor: isDarkMode ? 'rgba(239,68,68,0.2)' : '#FECACA',
                            }}>
                                <Text style={{
                                    color: isDarkMode ? '#FCA5A5' : '#DC2626',
                                    fontSize: 14, textAlign: 'center', fontWeight: '500',
                                }}>{error}</Text>
                            </View>
                        ) : null}

                        <View style={{ paddingTop: 8 }}>
                            <Button
                                title={isLoading
                                    ? (isLogin ? 'Вход...' : 'Регистрация...')
                                    : (isLogin ? 'Войти' : 'Зарегистрироваться')
                                }
                                onPress={handleSubmit}
                                disabled={isSubmitDisabled}
                                loading={isLoading}
                            />
                        </View>
                    </Animated.View>

                    {/* ── Footer ── */}
                    <Animated.View style={{
                        opacity: fadeAnim,
                        alignItems: 'center',
                        paddingTop: 24,
                        paddingBottom: 16,
                    }}>
                        <Text style={{
                            fontSize: 14,
                            color: isDarkMode ? '#6B7280' : '#9CA3AF',
                        }}>
                            © 2026 Мой Донос
                        </Text>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* City Input Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showCityModal}
                onRequestClose={() => setShowCityModal(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                }}>
                    <View style={{
                        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                        borderRadius: 24,
                        width: '100%',
                        maxWidth: 400,
                        padding: 24,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 20 },
                        shadowOpacity: 0.25,
                        shadowRadius: 25,
                        elevation: 20,
                    }}>
                        <Text style={{
                            fontSize: 22, fontWeight: '700',
                            color: isDarkMode ? '#F9FAFB' : '#111827',
                            marginBottom: 6,
                        }}>Выберите город</Text>
                        <Text style={{
                            fontSize: 14,
                            color: isDarkMode ? '#9CA3AF' : '#6B7280',
                            marginBottom: 16,
                        }}>Укажите город проживания</Text>

                        <TextInput
                            style={{
                                backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
                                borderWidth: 1,
                                borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                                fontSize: 16,
                                color: isDarkMode ? '#F3F4F6' : '#111827',
                                marginBottom: 16,
                            }}
                            placeholder="Поиск города..."
                            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                            value={citySearchQuery}
                            onChangeText={setCitySearchQuery}
                        />

                        <ScrollView style={{
                            maxHeight: 250,
                            marginBottom: 16,
                            borderRadius: 12,
                            backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
                        }}>
                            {filteredCities.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    onPress={() => {
                                        setCity(c);
                                        setShowCityModal(false);
                                        setCitySearchQuery('');
                                    }}
                                    style={{
                                        padding: 16,
                                        borderBottomWidth: 1,
                                        borderBottomColor: isDarkMode ? '#1F2937' : '#F3F4F6',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        backgroundColor: city === c
                                            ? (isDarkMode ? 'rgba(59,130,246,0.15)' : '#EFF6FF')
                                            : 'transparent',
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: city === c ? '700' : '400',
                                        color: city === c
                                            ? (isDarkMode ? '#93C5FD' : '#1D4ED8')
                                            : (isDarkMode ? '#D1D5DB' : '#374151'),
                                    }}>
                                        {c}
                                    </Text>
                                    {city === c && <CheckSquare size={20} color={isDarkMode ? '#60A5FA' : '#2563EB'} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={() => setShowCityModal(false)}
                            style={{
                                paddingVertical: 14,
                                borderRadius: 12,
                                backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 16,
                                color: isDarkMode ? '#D1D5DB' : '#374151',
                            }}>Отмена</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
