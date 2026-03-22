import { Badge } from '@/src/components/ui';
import { CATEGORIES } from '@/src/constants/categories';
import { reportsService } from '@/src/services/reports';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import { Report } from '@/src/types';
import * as Print from 'expo-print';
import { router, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { ChevronLeft, ChevronRight, Download, Settings, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

// Компонент карусели фотографий
function PhotoCarousel({ photos, isDarkMode }: { photos: any[], isDarkMode: boolean }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

    if (!photos || photos.length === 0) {
        return null;
    }

    const goToPrevious = () => {
        setCurrentIndex((prev) => prev === 0 ? photos.length - 1 : prev - 1);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => prev === photos.length - 1 ? 0 : prev + 1);
    };

    const handlePhotoPress = (photo: any) => {
        setSelectedPhoto(photo);
    };

    const closeModal = () => {
        setSelectedPhoto(null);
    };

    return (
        <>
            <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Фотографии ({currentIndex + 1}/{photos.length})
                </Text>

                <View className="relative">
                    {/* Кнопка навигации слева */}
                    {photos.length > 1 && (
                        <TouchableOpacity
                            onPress={goToPrevious}
                            className="absolute left-0 top-0 bottom-0 w-12 items-center justify-center z-10"
                            style={{ left: -16 }}
                        >
                            <View className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full items-center justify-center shadow-lg border border-gray-200 dark:border-gray-700">
                                <ChevronLeft size={20} color={isDarkMode ? '#F9FAFB' : '#374151'} />
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Кнопка навигации справа */}
                    {photos.length > 1 && (
                        <TouchableOpacity
                            onPress={goToNext}
                            className="absolute right-0 top-0 bottom-0 w-12 items-center justify-center z-10"
                            style={{ right: -16 }}
                        >
                            <View className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full items-center justify-center shadow-lg border border-gray-200 dark:border-gray-700">
                                <ChevronRight size={20} color={isDarkMode ? '#F9FAFB' : '#374151'} />
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Основное изображение */}
                    <View className="w-full h-64 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 relative border border-gray-200 dark:border-gray-700">
                        <TouchableOpacity
                            onPress={() => handlePhotoPress(photos[currentIndex])}
                            className="flex-1 relative"
                            activeOpacity={0.9}
                        >
                            <Image
                                source={{ uri: photos[currentIndex].photo_url }}
                                className="w-full h-full"
                                resizeMode="cover"
                                onError={(e) => {
                                    console.log(`Carousel image ${currentIndex + 1} error:`, e.nativeEvent.error);
                                }}
                                onLoad={() => {
                                    console.log(`Carousel image ${currentIndex + 1} loaded: ${photos[currentIndex].photo_url}`);
                                }}
                            />

                            {/* Подпись к фото */}
                            {photos[currentIndex].caption && (
                                <View className="absolute bottom-3 left-3 right-3 bg-black/60 dark:bg-black/80 rounded-lg p-3">
                                    <Text className="text-white text-sm leading-relaxed">
                                        {photos[currentIndex].caption}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Индикаторы */}
                    {photos.length > 1 && (
                        <View className="flex-row justify-center items-center mt-4 gap-2">
                            {photos.map((_, index) => (
                                <View
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-all duration-200 ${index === currentIndex
                                        ? 'bg-blue-600 dark:bg-blue-400 w-6'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </View>

            {/* Модальное окно для полного просмотра фото */}
            <Modal
                visible={!!selectedPhoto}
                animationType="fade"
                transparent={true}
                onRequestClose={closeModal}
            >
                {/* Область для закрытия по фону */}
                <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={1}
                    onPress={closeModal}
                >
                    <View className="flex-1 bg-black/80 relative">
                        {/* Кнопка закрытия */}
                        <TouchableOpacity
                            onPress={closeModal}
                            className="absolute top-12 right-4 p-2 -mr-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 z-50"
                        >
                            <X size={24} color="white" />
                        </TouchableOpacity>

                        {/* Область изображения (не закрывает модальное окно) */}
                        {selectedPhoto && (
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={(e) => e.stopPropagation()}
                                style={{ flex: 1 }}
                            >
                                <View className="flex-1 justify-center items-center">
                                    <Image
                                        source={{ uri: selectedPhoto.photo_url }}
                                        className="w-full h-full max-w-full max-h-full"
                                        resizeMode="contain"
                                    />

                                    {/* Подпись к фото */}
                                    {selectedPhoto.caption && (
                                        <View className="absolute bottom-8 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                            <Text className="text-white text-base leading-relaxed">
                                                {selectedPhoto.caption}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

export default function ProfileScreen() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const isDarkMode = useThemeStore((s) => s.isDarkMode);

    const [myReports, setMyReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [reportDetailLoading, setReportDetailLoading] = useState(false);
    const reportsPerPage = 5;

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

    const fetchReportDetails = useCallback(async (reportId: number) => {
        setReportDetailLoading(true);
        try {
            const detailedReport = await reportsService.getById(reportId);

            setSelectedReport(detailedReport);
        } catch (err) {
            console.warn('Failed to fetch report details:', err);
            // Если не удалось загрузить детали, показываем базовую информацию
            const basicReport = myReports.find(r => r.id === reportId);
            if (basicReport) {
                setSelectedReport(basicReport);
            }
        } finally {
            setReportDetailLoading(false);
        }
    }, [myReports]);

    const handleExport = async (id: number) => {
        setIsExporting(true);
        try {
            const data = await reportsService.export(id);
            const reportInfo = myReports.find(r => r.id === id) || selectedReport;

            if (data.letter && reportInfo) {
                const html = `
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
    <style>
      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; }
      h1 { font-size: 24px; margin-bottom: 10px; color: #111827; }
      .meta { color: #6B7280; font-size: 14px; margin-bottom: 20px; border-bottom: 1px solid #E5E7EB; padding-bottom: 15px; line-height: 1.8; }
      .letter { white-space: pre-wrap; margin-top: 20px; font-size: 15px; color: #1F2937; }
      img { max-width: 100%; max-height: 400px; border-radius: 8px; margin-top: 30px; display: block; object-fit: contain; }
    </style>
  </head>
  <body>
    <h1>${'Обращение: ' + reportInfo.title || 'Обращение'}</h1>
    
    <div class="letter">${data.letter.replace(/\n/g, '<br/>')}</div>
    
    ${reportInfo.preview_photo ? `<img src="${reportInfo.preview_photo}" />` : ''}
  </body>
</html>`;

                if (Platform.OS === 'web') {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                        printWindow.document.write(html);
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => {
                            printWindow.print();
                            printWindow.close();
                        }, 250);
                    } else {
                        Alert.alert('Экспорт', 'Заблокировано всплывающее окно. Пожалуйста, разрешите всплывающие окна для этого сайта.');
                    }
                } else {
                    const { uri } = await Print.printToFileAsync({ html });
                    if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(uri, {
                            mimeType: 'application/pdf',
                            dialogTitle: 'Экспорт обращения',
                            UTI: 'com.adobe.pdf'
                        });
                    } else {
                        Alert.alert('Экспорт', 'Функция "Поделиться" недоступна на вашем устройстве');
                    }
                }
            } else {
                Alert.alert('Экспорт', data.message || 'Ошибка генерации документа.');
            }
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert('Ошибка', 'Не удалось экспортировать обращение.');
        } finally {
            setIsExporting(false);
        }
    };

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
    const publishedReports = myReports.filter(r => {
        const s = (r.status || '').toString().toLowerCase();
        return s === 'published';
    }).length;
    const checkReports = myReports.filter(r => {
        const s = (r.status || '').toString().toLowerCase();
        return s === 'check';
    }).length;
    const activeReports = publishedReports + checkReports;
    const influence = totalReports > 0 ? Math.floor((activeReports / totalReports) * 100) : 0;

    // Пагинация
    const totalPages = Math.ceil(totalReports / reportsPerPage);
    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    const currentReports = myReports.slice(indexOfFirstReport, indexOfLastReport);

    // Сброс страницы при изменении количества заявок
    React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages]);

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
                        onPress={() => router.replace('/(main)/map')}
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
                            <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {user?.username?.charAt(0)?.toUpperCase() ?? '?'}
                            </Text>
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
                <View className="px-4">
                    {/* List Column */}
                    <View className="w-full max-w-md self-center">
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
                                ) : currentReports.length === 0 ? (
                                    <View className="py-8 items-center">
                                        <Text className="text-gray-400 dark:text-gray-500 text-sm">У вас пока нет заявок</Text>
                                    </View>
                                ) : (
                                    currentReports.map((r) => {
                                        const cat = CATEGORIES.find((c) => c.name === r.rubric_name);
                                        return (
                                            <TouchableOpacity
                                                key={r.id}
                                                onPress={() => fetchReportDetails(r.id)}
                                                activeOpacity={0.7}
                                                className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border flex-row items-center gap-3 mb-3 ${selectedReport?.id === r.id
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

                        {/* Pagination */}
                        {!isLoading && totalReports > 0 && totalPages > 1 && (
                            <View className="px-6 pb-4">
                                <View className="w-full max-w-sm self-center">
                                    <View className="flex-row items-center justify-center gap-4 py-2">
                                        <TouchableOpacity
                                            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className={`p-1 rounded ${currentPage === 1
                                                ? 'opacity-30'
                                                : 'opacity-70'
                                                }`}
                                        >
                                            <ChevronLeft
                                                size={16}
                                                color={isDarkMode ? '#9CA3AF' : '#6B7280'}
                                            />
                                        </TouchableOpacity>

                                        <Text className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
                                            {currentPage} / {totalPages}
                                        </Text>

                                        <TouchableOpacity
                                            onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className={`p-1 rounded ${currentPage === totalPages
                                                ? 'opacity-30'
                                                : 'opacity-70'
                                                }`}
                                        >
                                            <ChevronRight
                                                size={16}
                                                color={isDarkMode ? '#9CA3AF' : '#6B7280'}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}

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
                </View>
            </ScrollView>

            {/* Unified Report Detail Modal */}
            <Modal
                visible={!!selectedReport || reportDetailLoading}
                animationType="fade"
                transparent={true}
                onRequestClose={() => !reportDetailLoading && setSelectedReport(null)}
            >
                <View
                    style={{ flex: 1, paddingHorizontal: 16 }}
                    className="justify-center items-center bg-black/50"
                >
                    <View
                        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl"
                        style={{
                            maxHeight: Platform.OS === 'web' ? '90%' : '85%',
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.25,
                            shadowRadius: 20,
                            elevation: 20,
                            borderWidth: Platform.OS === 'web' ? 0 : 1,
                            borderColor: isDarkMode ? '#374151' : '#F3F4F6'
                        }}
                    >
                        <View className="p-6">
                            {reportDetailLoading ? (
                                <View className="flex-1 justify-center items-center py-8">
                                    <ActivityIndicator size="large" color={isDarkMode ? '#60A5FA' : '#2563EB'} />
                                    <Text className="text-gray-500 dark:text-gray-400 mt-3">
                                        Загрузка деталей...
                                    </Text>
                                </View>
                            ) : selectedReport ? (
                                <ReportDetailInner
                                    report={selectedReport}
                                    isDarkMode={isDarkMode}
                                    onClose={() => setSelectedReport(null)}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onExport={handleExport}
                                    isDeleting={isDeleting}
                                    isExporting={isExporting}
                                />
                            ) : null}
                        </View>
                    </View>
                </View>
            </Modal>
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
    onExport,
    isDeleting,
    isExporting
}: {
    report: Report,
    isDarkMode: boolean,
    onClose: () => void,
    onEdit: (r: Report) => void,
    onDelete: (id: number) => void,
    onExport: (id: number) => void,
    isDeleting: boolean,
    isExporting: boolean
}) {
    // Находим категорию
    const cat = CATEGORIES.find((c) => c.name === report.rubric_name);

    // Создаем массив фотографий для карусели
    const carouselPhotos = [];

    // Сначала добавляем preview_photo если есть
    if (report.preview_photo) {
        carouselPhotos.push({
            id: 'preview',
            photo_url: report.preview_photo,
            caption: null,
            order: 0
        });
    }

    // Затем добавляем все фото из массива photos
    if (report.photos && report.photos.length > 0) {
        carouselPhotos.push(...report.photos);
    }

    return (
        <View style={{ flexShrink: 1 }}>
            <View className="flex-row justify-between items-start mb-4">
                <Badge status={report.status} />
                <TouchableOpacity onPress={onClose}>
                    <X size={20} color={isDarkMode ? "#F9FAFB" : "#111827"} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flexShrink: 1 }}
            >
                <Text className="text-xl font-bold dark:text-white mb-2">
                    {report.title}
                </Text>

                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {report.address}
                </Text>

                {/* Рубрика */}
                {report.rubric_name && (
                    <View className="flex-row items-center mb-4">
                        <View
                            className="w-8 h-8 rounded-lg items-center justify-center mr-2"
                            style={{
                                backgroundColor: (cat?.color || '#999') + '20',
                            }}
                        >
                            <Text className="text-sm">{cat?.icon || '❗'}</Text>
                        </View>
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {report.rubric_name}
                        </Text>
                    </View>
                )}

                {/* Описание */}
                {report.description && (
                    <View className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl mb-6">
                        <Text className="text-gray-700 dark:text-gray-300 leading-6">
                            {report.description}
                        </Text>
                    </View>
                )}

                {/* Карусель фотографий */}
                <PhotoCarousel photos={carouselPhotos} isDarkMode={isDarkMode} />

                {/* Метаданные */}
                <View className="flex-row items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 mb-4">
                    <Text className="text-xs text-gray-400 dark:text-gray-500">
                        Создано: {report.created_at ? new Date(report.created_at).toLocaleDateString('ru-RU') : ''}
                    </Text>
                    <Text className="text-xs text-gray-400 dark:text-gray-500">
                        ID: #{report.id}
                    </Text>
                </View>
            </ScrollView>

            <View className="flex-row gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <TouchableOpacity
                    onPress={() => onExport(report.id)}
                    disabled={isExporting}
                    className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl items-center justify-center border border-gray-200 dark:border-gray-600"
                >
                    {isExporting ? (
                        <ActivityIndicator size="small" color={isDarkMode ? '#D1D5DB' : '#4B5563'} />
                    ) : (
                        <Download size={20} color={isDarkMode ? '#D1D5DB' : '#4B5563'} />
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => onEdit(report)}
                    className="flex-1 py-3 bg-blue-600 rounded-xl items-center justify-center"
                >
                    <Text className="text-white font-bold text-sm">Изменить</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => onDelete(report.id)}
                    disabled={isDeleting}
                    className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 rounded-xl items-center"
                >
                    <Text className="text-red-500 font-bold text-sm">
                        {isDeleting ? 'Удаление...' : 'Удалить'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
