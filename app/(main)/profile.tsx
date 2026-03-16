import { Badge } from '@/src/components/ui';
import { CATEGORIES } from '@/src/constants/categories';
import { reportsService } from '@/src/services/reports';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import { Report } from '@/src/types';
import { router, useFocusEffect } from 'expo-router';
import { Settings, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const isDarkMode = useThemeStore((s) => s.isDarkMode);

    const [myReports, setMyReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchMyReports = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await reportsService.getMine();
            setMyReports(data);
        } catch (err) {
            console.warn('Failed to fetch my reports:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchMyReports();
        }, [fetchMyReports])
    );

    const xp = user?.xp ?? 350;
    const nextLevelXp = user?.nextLevelXp ?? 500;
    const progress = (xp / nextLevelXp) * 100;

    // Считаем статистику по заявкам
    const totalReports = myReports.length;
    const publishedReports = myReports.filter(r => r.status === 'published').length;
    const checkReports = myReports.filter(r => r.status === 'check').length;
    const activeReports = publishedReports + checkReports;
    const influence = totalReports > 0 ? Math.floor((activeReports / totalReports) * 100) : 0;

    // Расчет уровня на основе активных заявок (решенных + в работе)
    const calculateLevel = (activeCount: number) => {
        if (activeCount >= 50) return 10;
        if (activeCount >= 35) return 9;
        if (activeCount >= 25) return 8;
        if (activeCount >= 18) return 7;
        if (activeCount >= 12) return 6;
        if (activeCount >= 8) return 5;
        if (activeCount >= 5) return 4;
        if (activeCount >= 3) return 3;
        if (activeCount >= 1) return 2;
        return 1;
    };

    const userLevel = calculateLevel(activeReports);

    // Расчет XP для следующего уровня
    const getLevelRequirements = (level: number) => {
        const requirements = [0, 1, 3, 5, 8, 12, 18, 25, 35, 50];
        return {
            currentLevelMin: requirements[level - 1] || 0,
            nextLevelMin: requirements[level] || 50,
        };
    };

    const { currentLevelMin, nextLevelMin } = getLevelRequirements(userLevel);
    const currentXp = activeReports - currentLevelMin;
    const neededXp = nextLevelMin - currentLevelMin;
    const xpProgress = neededXp > 0 ? (currentXp / neededXp) * 100 : 100;

    const handleLogout = () => {
        logout();
        router.replace('/(auth)/login');
    };

    const handleDelete = async (id: number) => {
        const confirmDelete = () => {
            if (Platform.OS === 'web') {
                return window.confirm('Вы уверены, что хотите удалить эту заявку?');
            }
            return new Promise((resolve) => {
                Alert.alert(
                    'Удаление',
                    'Вы уверены, что хотите удалить эту заявку?',
                    [
                        { text: 'Отмена', style: 'cancel', onPress: () => resolve(false) },
                        { text: 'Удалить', style: 'destructive', onPress: () => resolve(true) },
                    ]
                );
            });
        };

        const confirmed = await confirmDelete();
        if (!confirmed) return;

        setIsDeleting(true);
        try {
            await reportsService.delete(id);
            setMyReports((prev) => prev.filter((r) => r.id !== id));
            setSelectedReport(null);
        } catch (err) {
            console.warn('Failed to delete report:', err);
            if (Platform.OS === 'web') {
                window.alert('Не удалось удалить заявку');
            } else {
                Alert.alert('Ошибка', 'Не удалось удалить заявку');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (report: Report) => {
        setSelectedReport(null);
        router.push({
            pathname: '/(main)/create',
            params: { editId: String(report.id) },
        });
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <SafeAreaView edges={['top']} className="bg-white dark:bg-gray-900 shadow-sm">
                <View className="flex-row items-center justify-between px-4 py-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 -ml-2 rounded-full"
                    >
                        <X size={24} color={isDarkMode ? "#F9FAFB" : "#111827"} />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg dark:text-gray-100">Мой профиль</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/(main)/settings' as any)}
                        className="p-2 -mr-2 rounded-full"
                    >
                        <Settings size={24} color={isDarkMode ? "#F9FAFB" : "#111827"} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1 pt-4">
                {/* Profile card */}
                <View className="bg-white dark:bg-gray-800 p-4 mx-4 mb-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 items-center">
                    <View className="w-full max-w-md self-center">
                        <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mb-3 border-2 border-white dark:border-gray-800 shadow-sm self-center">
                            <Text className="text-3xl">🧑‍💼</Text>
                        </View>
                        <Text className="text-lg font-bold mb-1 dark:text-gray-100 text-center">
                            {user ? `${user.first_name} ${user.last_name}`.trim() || user.username : 'Пользователь'}
                        </Text>
                        <Text className="text-blue-600 font-semibold text-sm mb-3 text-center">
                            Уровень {userLevel}
                        </Text>

                        {/* XP bar */}
                        <View className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
                            <View
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${xpProgress}%` }}
                            />
                        </View>
                        <Text className="text-xs text-gray-400 dark:text-gray-500 mb-4 text-center">
                            {xp} / {nextLevelXp} XP
                        </Text>

                        {/* Stats */}
                        <View className="flex-row w-full pt-3 border-t border-gray-50 dark:border-gray-700">
                            <View className="flex-1 items-center">
                                <Text className="text-base font-bold dark:text-gray-100">{totalReports}</Text>
                                <Text className="text-xs text-gray-400 dark:text-gray-500">Заявок</Text>
                            </View>
                            <View className="flex-1 items-center border-l border-r border-gray-50 dark:border-gray-700">
                                <Text className="text-base font-bold dark:text-gray-100">{publishedReports}</Text>
                                <Text className="text-xs text-gray-400 dark:text-gray-500">Опубликовано</Text>
                            </View>
                            <View className="flex-1 items-center">
                                <Text className="text-base font-bold dark:text-gray-100">{checkReports}</Text>
                                <Text className="text-xs text-gray-400 dark:text-gray-500">На рассмотрении</Text>
                            </View>
                            <View className="flex-1 items-center">
                                <Text className="text-base font-bold dark:text-gray-100">{influence}%</Text>
                                <Text className="text-xs text-gray-400 dark:text-gray-500">Влияние</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Web: Page Header */}
                {Platform.OS === 'web' && (
                    <View className="items-center mb-10 pt-4">
                        <Text className="text-3xl font-bold dark:text-white">Мои заявки</Text>
                        <Text className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            {totalReports} всего
                        </Text>
                        <View className="w-12 h-1 bg-blue-500 rounded-full mt-3" />
                    </View>
                )}

                {/* Main Content Area */}
                <View className={`flex-1 ${Platform.OS === 'web' ? 'flex-row px-4 w-full gap-10 justify-center items-start' : ''}`}>
                    
                    {/* List Column */}
                    <View 
                        className={Platform.OS === 'web' ? 'w-full max-w-md' : ''}
                        style={Platform.OS === 'web' ? { minWidth: 420 } : {}}
                    >
                        {/* Header (Native only) */}
                        {Platform.OS !== 'web' && (
                            <View className="mb-6">
                                <Text className="font-bold text-gray-900 dark:text-gray-100 text-xl text-center">
                                    Мои заявки
                                </Text>
                                <Text className="text-xs text-center text-gray-400 dark:text-gray-500 mt-1">
                                    {totalReports} всего
                                </Text>
                            </View>
                        )}

                        <View className="px-6 pb-8">
                            <View className="w-full max-w-sm self-center">
                                {isLoading ? (
                                    <View className="py-8 items-center">
                                        <ActivityIndicator size="small" color={isDarkMode ? '#60A5FA' : '#2563EB'} />
                                    </View>
                                ) : myReports.length === 0 ? (
                                    <View className="py-8 items-center">
                                        <Text className="text-gray-400 dark:text-gray-500 text-sm">У вас пока нет заявок</Text>
                                    </View>
                                ) : (
                                    myReports.map((r) => {
                                        const cat = CATEGORIES.find((c) => c.name === r.rubric_name);
                                        return (
                                            <TouchableOpacity
                                                key={r.id}
                                                onPress={() => setSelectedReport(r)}
                                                activeOpacity={0.7}
                                                className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border flex-row items-center gap-3 mb-3 ${
                                                    selectedReport?.id === r.id 
                                                        ? 'border-blue-500 dark:border-blue-400' 
                                                        : 'border-gray-100 dark:border-gray-800'
                                                }`}
                                            >
                                                <View
                                                    className="w-10 h-10 rounded-xl items-center justify-center"
                                                    style={{
                                                        backgroundColor: (cat?.color || '#999') + '20',
                                                    }}
                                                >
                                                    <Text className="text-lg">{cat?.icon || '❗'}</Text>
                                                </View>
                                                <View className="flex-1">
                                                    <Text
                                                        className="font-semibold text-gray-900 dark:text-gray-100"
                                                        numberOfLines={1}
                                                    >
                                                        {r.title}
                                                    </Text>
                                                    <Text className="text-xs text-gray-400 dark:text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU') : ''}</Text>
                                                </View>
                                                <Badge status={r.status} />
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </View>
                        </View>

                        {/* Logout */}
                        <View className="px-6 pb-8">
                            <View className="w-full max-w-sm self-center">
                                <TouchableOpacity
                                    onPress={handleLogout}
                                    className="py-3 bg-red-50 dark:bg-red-900/20 rounded-xl items-center"
                                >
                                    <Text className="text-red-500 font-semibold">Выйти из аккаунта</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Web Detail Column */}
                    {Platform.OS === 'web' && selectedReport && (
                        <Animated.View 
                            entering={SlideInRight.springify().damping(20).stiffness(100)}
                            className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8"
                        >
                            <ReportDetailInner 
                                report={selectedReport} 
                                isDarkMode={isDarkMode} 
                                onClose={() => setSelectedReport(null)}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                isDeleting={isDeleting}
                            />
                        </Animated.View>
                    )}
                </View>
            </ScrollView>

            {/* Mobile Report Detail Modal */}
            {Platform.OS !== 'web' && (
                <Modal
                    visible={!!selectedReport}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setSelectedReport(null)}
                >
                    <View className="flex-1 justify-end">
                        <TouchableOpacity 
                            className="flex-1" 
                            onPress={() => setSelectedReport(null)} 
                        />
                        <View 
                            className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 min-h-[50%]"
                            style={{
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: -4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 12,
                                elevation: 20,
                            }}
                        >
                            <View className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full self-center mb-6" />
                            {selectedReport && (
                                <ReportDetailInner 
                                    report={selectedReport} 
                                    isDarkMode={isDarkMode} 
                                    onClose={() => setSelectedReport(null)}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    isDeleting={isDeleting}
                                />
                            )}
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
}

// ─── Internal Detail Component ──────────────────────────────────
function ReportDetailInner({ 
    report, 
    isDarkMode, 
    onClose, 
    onEdit, 
    onDelete, 
    isDeleting 
}: { 
    report: Report, 
    isDarkMode: boolean, 
    onClose: () => void,
    onEdit: (r: Report) => void,
    onDelete: (id: number) => void,
    isDeleting: boolean
}) {
    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row justify-between items-start mb-4">
                <Badge status={report.status} />
                <TouchableOpacity onPress={onClose}>
                    <X size={24} color={isDarkMode ? "#F9FAFB" : "#111827"} />
                </TouchableOpacity>
            </View>

            <Text className="text-2xl font-bold dark:text-white mb-2">
                {report.title}
            </Text>
            
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {report.address}
            </Text>

            {report.description && (
                <View className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mb-6">
                    <Text className="text-gray-700 dark:text-gray-300 leading-6">
                        {report.description}
                    </Text>
                </View>
            )}

            {report.preview_photo && (
                <View className="w-full h-64 rounded-2xl overflow-hidden mb-6 bg-gray-100 dark:bg-gray-800">
                    <Image 
                        source={{ uri: report.preview_photo }} 
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                </View>
            )}

            <View className="flex-row gap-3">
                <TouchableOpacity 
                    onPress={() => onEdit(report)}
                    className="flex-1 py-4 bg-blue-600 rounded-2xl items-center"
                >
                    <Text className="text-white font-bold">Изменить</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => onDelete(report.id)}
                    disabled={isDeleting}
                    className="flex-1 py-4 bg-red-50 dark:bg-red-900/20 rounded-2xl items-center"
                >
                    <Text className="text-red-500 font-bold">
                        {isDeleting ? 'Удаление...' : 'Удалить'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
