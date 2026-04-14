import { Button, Input } from '@/src/components/ui';
import { authService } from '@/src/services/auth';
import { useThemeStore } from '@/src/store/themeStore';
import { navigateBack } from '@/src/utils/navigation';
import { router } from 'expo-router';
import { ArrowLeft, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const isWeb = Platform.OS === 'web';

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
            setError('');
            router.replace('/(auth)/login');
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

    const getIcon = () => {
        if (!isCodeSent) return <Mail size={36} color={isDarkMode ? '#60A5FA' : '#2563EB'} />;
        if (!isCodeVerified) return <KeyRound size={36} color={isDarkMode ? '#60A5FA' : '#2563EB'} />;
        return <Lock size={36} color={isDarkMode ? '#60A5FA' : '#2563EB'} />;
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

    // ── Step indicator ──
    const StepIndicator = () => {
        const currentStep = !isCodeSent ? 0 : !isCodeVerified ? 1 : 2;
        return (
            <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 24,
            }}>
                {[0, 1, 2].map((step) => (
                    <View
                        key={step}
                        style={{
                            width: step === currentStep ? 32 : 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: step <= currentStep
                                ? '#3B82F6'
                                : (isDarkMode ? '#374151' : '#E5E7EB'),
                        }}
                    />
                ))}
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#030712' : '#EFF6FF', overflow: 'hidden' }}>
            {/* Decorative gradient circles (web only) */}
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
                        paddingVertical: 24,
                        paddingHorizontal: 16,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                >
                    {/* ── Animated Header ── */}
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
                            width: 80, height: 80, borderRadius: 24,
                            alignItems: 'center', justifyContent: 'center',
                            marginBottom: 16,
                            backgroundColor: isDarkMode ? '#1E3A5F' : '#DBEAFE',
                            shadowColor: '#3B82F6',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.25,
                            shadowRadius: 16,
                            elevation: 8,
                        }}>
                            {getIcon()}
                        </View>
                        <Text style={{
                            fontSize: 26, fontWeight: '800',
                            color: isDarkMode ? '#F9FAFB' : '#111827',
                            letterSpacing: -0.5,
                            marginBottom: 6,
                        }}>
                            {getTitle()}
                        </Text>
                        <Text style={{
                            fontSize: 15, fontWeight: '400',
                            color: isDarkMode ? '#9CA3AF' : '#6B7280',
                            textAlign: 'center',
                            lineHeight: 22,
                        }}>
                            {getSubtitle()}
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
                        <StepIndicator />

                        {/* Error message */}
                        {error ? (
                            <View style={{
                                backgroundColor: isDarkMode ? 'rgba(239,68,68,0.1)' : '#FEF2F2',
                                padding: 14,
                                borderRadius: 12,
                                marginBottom: 16,
                                borderWidth: 1,
                                borderColor: isDarkMode ? 'rgba(239,68,68,0.2)' : '#FECACA',
                            }}>
                                <Text style={{
                                    color: isDarkMode ? '#FCA5A5' : '#DC2626',
                                    fontSize: 14, textAlign: 'center', fontWeight: '500',
                                }}>{error}</Text>
                            </View>
                        ) : null}

                        {!isCodeSent ? (
                            // Шаг 1: Ввод email
                            <View>
                                <Text style={{
                                    fontSize: 14, fontWeight: '600',
                                    color: isDarkMode ? '#D1D5DB' : '#374151',
                                    marginBottom: 8,
                                }}>Email</Text>
                                <Input
                                    placeholder="your@email.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />

                                <View style={{ paddingTop: 8 }}>
                                    <Button
                                        title={isLoading ? 'Отправка...' : 'Отправить код'}
                                        onPress={handleRequestReset}
                                        disabled={!email || isLoading}
                                        loading={isLoading}
                                    />
                                </View>

                                <View style={{
                                    marginTop: 16,
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                                    borderRadius: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 12,
                                }}>
                                    <ShieldCheck size={18} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
                                    <Text style={{
                                        fontSize: 13,
                                        color: isDarkMode ? '#6B7280' : '#9CA3AF',
                                        flex: 1,
                                        lineHeight: 18,
                                    }}>
                                        Мы отправим вам код подтверждения на указанный email
                                    </Text>
                                </View>
                            </View>
                        ) : !isCodeVerified ? (
                            // Шаг 2: Ввод кода подтверждения
                            <View>
                                <Text style={{
                                    fontSize: 14, fontWeight: '600',
                                    color: isDarkMode ? '#D1D5DB' : '#374151',
                                    marginBottom: 8,
                                }}>Код из письма</Text>
                                <Input
                                    placeholder="123456"
                                    value={code}
                                    onChangeText={setCode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />

                                <View style={{ paddingTop: 8 }}>
                                    <Button
                                        title={isLoading ? 'Проверка...' : 'Подтвердить код'}
                                        onPress={handleVerifyCode}
                                        disabled={!code || isLoading}
                                        loading={isLoading}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={{ paddingVertical: 14, alignItems: 'center' }}
                                    onPress={handleRequestReset}
                                    disabled={isLoading}
                                >
                                    <Text style={{
                                        fontSize: 14,
                                        color: isDarkMode ? '#60A5FA' : '#2563EB',
                                        fontWeight: '500',
                                    }}>Отправить код повторно</Text>
                                </TouchableOpacity>

                                <View style={{
                                    marginTop: 4,
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                                    borderRadius: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 12,
                                }}>
                                    <Mail size={18} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
                                    <Text style={{
                                        fontSize: 13,
                                        color: isDarkMode ? '#6B7280' : '#9CA3AF',
                                        flex: 1,
                                        lineHeight: 18,
                                    }}>
                                        Если письмо не пришло, проверьте папку Спам
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            // Шаг 3: Установка нового пароля
                            <View>
                                <Text style={{
                                    fontSize: 14, fontWeight: '600',
                                    color: isDarkMode ? '#D1D5DB' : '#374151',
                                    marginBottom: 8,
                                }}>Новый пароль</Text>
                                <Input
                                    placeholder="Минимум 6 символов"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                />

                                <Text style={{
                                    fontSize: 14, fontWeight: '600',
                                    color: isDarkMode ? '#D1D5DB' : '#374151',
                                    marginBottom: 8,
                                }}>Подтвердите пароль</Text>
                                <Input
                                    placeholder="Повторите пароль"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />

                                <View style={{ paddingTop: 8 }}>
                                    <Button
                                        title={isLoading ? 'Сохранение...' : 'Изменить пароль'}
                                        onPress={handleSetNewPassword}
                                        disabled={!newPassword || !confirmPassword || isLoading}
                                        loading={isLoading}
                                    />
                                </View>
                            </View>
                        )}
                    </Animated.View>

                    {/* ── Back link ── */}
                    <Animated.View style={{
                        opacity: fadeAnim,
                        paddingTop: 24,
                        paddingBottom: 16,
                        alignItems: 'center',
                    }}>
                        <TouchableOpacity
                            onPress={() => navigateBack('/(auth)/login')}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                            }}
                        >
                            <ArrowLeft size={18} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
                            <Text style={{
                                fontSize: 15, fontWeight: '600',
                                color: isDarkMode ? '#60A5FA' : '#2563EB',
                            }}>
                                Вернуться ко входу
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
