import { Badge } from '@/src/components/ui';
import { reportsService } from '@/src/services/reports';
import { useAuthStore } from '@/src/store/authStore';
import { useNotificationsStore } from '@/src/store/notificationsStore';
import type { DraftReport } from '@/src/store/reportsStore';
import { useReportsStore } from '@/src/store/reportsStore';
import { useRubricsStore } from '@/src/store/rubricsStore';
import { useThemeStore } from '@/src/store/themeStore';
import { Report } from '@/src/types';
import { navigateBack } from '@/src/utils/navigation';
import * as Print from 'expo-print';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Bell, ChevronLeft, ChevronRight, CloudUpload, Download, FileClock, FileText, Settings, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Inline тип для DraftReport если импорт не работает
type DraftReportType = DraftReport;

const { width: screenWidth } = Dimensions.get('window');

// Компонент карусели фотографий
interface Photo {
    photo_url: string;
    id?: number | string;
    [key: string]: any;
}

function PhotoCarousel({ photos, isDarkMode }: { photos: Photo[], isDarkMode: boolean }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

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
    const params = useLocalSearchParams();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const unreadCount = useNotificationsStore((s) => s.unreadCount());
    const generateFromReports = useNotificationsStore((s) => s.generateFromReports);

    const [myReports, setMyReports] = useState<Report[]>(() => useReportsStore.getState().myReports);
    const [previousReports, setPreviousReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [reportToDelete, setReportToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [reportDetailLoading, setReportDetailLoading] = useState(false);
    const [exportPreview, setExportPreview] = useState<{ report: Report; letter: string } | null>(null);
    const [editableLetterText, setEditableLetterText] = useState('');
    const reportsPerPage = 5;

    // Drafts state
    const drafts = useReportsStore((s) => s.drafts);
    const removeDraft = useReportsStore((s) => s.removeDraft);
    const [activeTab, setActiveTab] = useState<'reports' | 'drafts'>('reports');
    const [selectedDraft, setSelectedDraft] = useState<DraftReportType | null>(null);
    const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [currentDraftsPage, setCurrentDraftsPage] = useState(1);

    // Combine local drafts with server drafts (from myReports)
    const serverDrafts = myReports.filter(r => r.status === 'draft');
    const allDrafts = [...drafts, ...serverDrafts];

    // Drafts pagination
    const totalDraftsPages = Math.ceil(allDrafts.length / reportsPerPage);
    const indexOfLastDraft = currentDraftsPage * reportsPerPage;
    const indexOfFirstDraft = indexOfLastDraft - reportsPerPage;
    const currentDrafts = allDrafts.slice(indexOfFirstDraft, indexOfLastDraft);

    const fetchMyReports = useCallback(async () => {
        // Сохраняем текущие заявки как предыдущие перед загрузкой
        setPreviousReports(myReports);

        if (useReportsStore.getState().myReports.length === 0) {
            setIsLoading(true);
        }
        try {
            const data = await useReportsStore.getState().fetchMine();
            // Генерируем уведомления на основе изменений
            generateFromReports(data, myReports);
            setMyReports(data);
        } catch (err) {
            console.warn('Failed to fetch my reports:', err);
        } finally {
            setIsLoading(false);
        }
    }, [myReports, generateFromReports]);

    const fetchReportDetails = useCallback(async (reportId: number) => {
        // Мгновенно показываем то, что есть в списке
        const cachedReport = myReports.find(r => r.id === reportId);
        if (cachedReport) {
            setSelectedReport(cachedReport);
        } else {
            setReportDetailLoading(true);
        }

        try {
            // Тихо получаем полные данные напрямую без лишних оберток
            // reportsService.getById гарантированно отдает свежие данные с фото
            const freshReport = await reportsService.getById(reportId);

            // Плавно обновляем окно, только если оно всё ещё открыто на этой заявке
            setSelectedReport(prev => (prev && prev.id === reportId) ? freshReport : prev);
        } catch (err) {
            console.warn('Failed to fetch full report details:', err);
        } finally {
            setReportDetailLoading(false);
        }
    }, [myReports]);

    const handleExport = async (id: number) => {
        setIsExporting(true);
        try {
            const data = await reportsService.export(id);
            const reportInfo = selectedReport || myReports.find(r => r.id === id);

            if (data.letter && reportInfo) {
                setEditableLetterText(data.letter);
                setExportPreview({ report: reportInfo, letter: data.letter });
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

    const handleConfirmExport = async () => {
        if (!exportPreview) return;
        const { report: reportInfo } = exportPreview;
        const letterText = editableLetterText;

        // Collect all photo URLs
        const allPhotos: string[] = [];
        if (reportInfo.preview_photo) allPhotos.push(reportInfo.preview_photo);
        if (reportInfo.photos && reportInfo.photos.length > 0) {
            reportInfo.photos.forEach((p: any) => {
                if (p.photo_url && !allPhotos.includes(p.photo_url)) allPhotos.push(p.photo_url);
            });
        }

        const photosHtml = allPhotos.length > 0
            ? `<div class="photos">${allPhotos.map(url => `<img src="${url}" />`).join('')}</div>`
            : '';

        const html = `
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; }
      h1 { font-size: 22px; margin-bottom: 16px; color: #111827; }
      .letter { white-space: pre-wrap; font-size: 15px; color: #1F2937; }
      .photos { margin-top: 30px; }
      .photos img { max-width: 100%; max-height: 400px; border-radius: 8px; margin-bottom: 16px; display: block; object-fit: contain; }
    </style>
  </head>
  <body>
    <h1>${'Обращение: ' + (reportInfo.title || '')}</h1>
    <div class="letter">${letterText.replace(/\n/g, '<br/>')}</div>
    ${photosHtml}
  </body>
</html>`;

        setExportPreview(null);

        try {
            if (Platform.OS === 'web') {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                    }, 500);
                } else {
                    Alert.alert('Экспорт', 'Заблокировано всплывающее окно.');
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
        } catch (err) {
            console.error('Print error:', err);
            Alert.alert('Ошибка', 'Не удалось создать PDF.');
        }
    };

    const requestPushPermissions = useNotificationsStore((s) => s.requestPushPermissions);

    useFocusEffect(
        useCallback(() => {
            fetchMyReports();
            // Запрашиваем разрешения на push-уведомления
            if (Platform.OS !== 'web') {
                requestPushPermissions();
            }
        }, [fetchMyReports, requestPushPermissions])
    );

    // Расширенная система статистики профиля
    // XP начисляется за разные действия: публикация (50), рассмотрение (30), решенная (100)
    const calculateStats = () => {
        // Exclude draft reports from stats
        const nonDraftReports = myReports.filter(r => r.status !== 'draft');
        const total = nonDraftReports.length;
        const published = nonDraftReports.filter(r => (r.status || '').toString().toLowerCase() === 'published').length;
        const check = nonDraftReports.filter(r => (r.status || '').toString().toLowerCase() === 'check').length;
        const archived = nonDraftReports.filter(r => (r.status || '').toString().toLowerCase() === 'archived').length;
        const active = published + archived;
        const xp = (published * 50) + (check * 30) + (archived * 100);
        return { total, published, check, archived, active, xp };
    };
    const stats = calculateStats();

    // Система уровней на основе XP (не только количества)
    // Чем выше уровень, тем больше XP нужно для следующего
    const calculateLevel = (xp: number) => {
        // Требования XP для каждого уровня: 0, 100, 250, 500, 900, 1500, 2300, 3400, 4800, 6500
        const levelThresholds = [0, 100, 250, 500, 900, 1500, 2300, 3400, 4800, 6500, 9000];

        for (let i = levelThresholds.length - 1; i >= 0; i--) {
            if (xp >= levelThresholds[i]) {
                return {
                    level: Math.min(i + 1, 10),
                    currentLevelXp: levelThresholds[i],
                    nextLevelXp: levelThresholds[i + 1] || levelThresholds[i] + 2500,
                };
            }
        }
        return { level: 1, currentLevelXp: 0, nextLevelXp: 100 };
    };

    const { level, currentLevelXp, nextLevelXp } = calculateLevel(stats.xp);
    const xpProgress = nextLevelXp > currentLevelXp
        ? ((stats.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
        : 100;

    // Система влияния (Influence) - комплексная метрика
    // Учитывает: эффективность (решённые/все), активность, разнообразие
    const calculateInfluence = () => {
        if (stats.total === 0) return 0;

        // Базовое влияние от количества заявок (до 40%)
        // Логарифмическая шкала: 1 заявка = 5%, 5 = 15%, 10 = 25%, 20+ = 40%
        const volumeScore = Math.min(40, 5 + Math.log2(stats.total + 1) * 10);

        // Эффективность - процент решённых/опубликованных (до 35%)
        // archived считаем успешно решёнными
        const resolvedRate = stats.total > 0 ? stats.archived / stats.total : 0;
        const efficiencyScore = Math.min(35, resolvedRate * 70);

        // Активность - процент опубликованных (до 25%)
        const publicationRate = stats.total > 0 ? stats.published / stats.total : 0;
        const activityScore = Math.min(25, publicationRate * 50 + (stats.published > 0 ? 5 : 0));

        return Math.floor(volumeScore + efficiencyScore + activityScore);
    };

    const influence = calculateInfluence();

    // Названия уровней для отображения
    const levelNames: Record<number, string> = {
        1: 'Новичок',
        2: 'Активист',
        3: 'Участник',
        4: 'Опытный',
        5: 'Эксперт',
        6: 'Специалист',
        7: 'Мастер',
        8: 'Лидер',
        9: 'Ветеран',
        10: 'Легенда',
    };

    // Переменные для обратной совместимости с UI
    const userLevel = level;
    const totalReports = stats.total;
    const publishedReports = stats.published;
    const checkReports = stats.check;
    const totalPages = Math.ceil(stats.total / reportsPerPage);
    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    const currentReports = myReports
        .filter((r) => r.status !== 'draft')
        .slice(indexOfFirstReport, indexOfLastReport);

    // Сброс страницы при изменении количества заявок
    React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages]);

    // Сброс страницы черновиков при изменении количества черновиков
    React.useEffect(() => {
        if (currentDraftsPage > totalDraftsPages && totalDraftsPages > 0) {
            setCurrentDraftsPage(1);
        }
    }, [currentDraftsPage, totalDraftsPages]);

    const handleLogout = () => {
        logout();
        router.replace('/(auth)/login');
    };

    const promptDelete = (id: number) => {
        setReportToDelete(id);
    };

    const confirmDelete = async () => {
        if (reportToDelete === null) return;

        setIsDeleting(true);
        try {
            await reportsService.delete(reportToDelete);
            setMyReports((prev) => prev.filter((r) => r.id !== reportToDelete));
            setSelectedReport(null);
            setReportToDelete(null);
        } catch (err) {
            console.warn('Failed to delete report:', err);
            Alert.alert('Ошибка', 'Не удалось удалить заявку');
        } finally {
            setIsDeleting(false);
        }
    };

    // Обработка параметра открытия заявки из уведомления
    React.useEffect(() => {
        if (params.openReportId) {
            const reportId = parseInt(params.openReportId as string, 10);
            if (!isNaN(reportId)) {
                fetchReportDetails(reportId);
            }
        }
    }, [params.openReportId]);

    const handleEdit = (report: Report) => {
        setSelectedReport(null);
        router.push({
            pathname: '/(main)/create',
            params: { editId: String(report.id) },
        });
    };

    // Draft handlers
    const handleEditDraft = (draft: DraftReportType) => {
        setSelectedDraft(null);
        router.push({
            pathname: '/(main)/create',
            params: { 
                draftId: draft.localId,
                address: draft.address,
                lat: String(draft.latitude),
                lon: String(draft.longitude),
            },
        });
    };

    const handleDeleteDraft = (localId: string) => {
        setDraftToDelete(localId);
    };

    const confirmDeleteDraft = () => {
        if (draftToDelete) {
            removeDraft(draftToDelete);
            setDraftToDelete(null);
            setSelectedDraft(null);
        }
    };

    // Sync drafts handler
    const handleSyncDrafts = async () => {
        if (drafts.length === 0) return;
        setIsSyncing(true);
        try {
            await useReportsStore.getState().syncDrafts();
            Alert.alert('Успех', 'Черновики синхронизированы');
        } catch (err) {
            Alert.alert('Ошибка', 'Не удалось синхронизировать черновики. Проверьте подключение к интернету.');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <SafeAreaView edges={['top']} className="bg-white dark:bg-gray-900 shadow-sm">
                <View className="flex-row items-center justify-between px-4 py-3">
                    <TouchableOpacity
                        onPress={() => navigateBack('/(main)/map')}
                        className="p-2 -ml-2 rounded-full"
                    >
                        <X size={24} color={isDarkMode ? "#F9FAFB" : "#111827"} />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg dark:text-gray-100">Мой профиль</Text>
                    <View className="flex-row items-center gap-1">
                        <TouchableOpacity
                            onPress={() => router.push('/(main)/notifications')}
                            className="p-2 -mr-1 rounded-full relative"
                        >
                            <Bell size={24} color={isDarkMode ? "#F9FAFB" : "#111827"} />
                            {unreadCount > 0 && (
                                <View className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full items-center justify-center px-1">
                                    <Text className="text-white text-[10px] font-bold">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/(main)/settings' as any)}
                            className="p-2 -mr-2 rounded-full"
                        >
                            <Settings size={24} color={isDarkMode ? "#F9FAFB" : "#111827"} />
                        </TouchableOpacity>
                    </View>
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
                        <Text className="text-blue-600 font-semibold text-sm mb-1 text-center">
                            Уровень {userLevel} · {levelNames[userLevel]}
                        </Text>

                        {/* XP bar */}
                        <View className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
                            <View
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${xpProgress}%` }}
                            />
                        </View>
                        <Text className="text-xs text-gray-400 dark:text-gray-500 mb-4 text-center">
                            {stats.xp} / {nextLevelXp} XP
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
                            <View className="mb-4">
                                <Text className="font-bold text-gray-900 dark:text-gray-100 text-xl text-center">
                                    {activeTab === 'reports' ? 'Мои заявки' : 'Черновики'}
                                </Text>
                                <Text className="text-xs text-center text-gray-400 dark:text-gray-500 mt-1">
                                    {activeTab === 'reports' ? `${totalReports} всего` : `${allDrafts.length} всего`}
                                </Text>
                            </View>
                        )}

                        {/* Tabs */}
                        <View className="px-6 mb-4">
                            <View className="w-full max-w-sm self-center flex-row bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                                <TouchableOpacity
                                    onPress={() => setActiveTab('reports')}
                                    className={`flex-1 py-2 rounded-lg ${activeTab === 'reports' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                                >
                                    <Text className={`text-sm font-medium text-center ${activeTab === 'reports' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        Заявки ({totalReports})
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setActiveTab('drafts')}
                                    className={`flex-1 py-2 rounded-lg ${activeTab === 'drafts' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                                >
                                    <Text className={`text-sm font-medium text-center ${activeTab === 'drafts' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        Черновики ({allDrafts.length})
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="px-6 pb-8">
                            <View className="w-full max-w-sm self-center">
                                {activeTab === 'reports' ? (
                                    // Reports list
                                    isLoading ? (
                                        <View className="py-8 items-center">
                                            <ActivityIndicator size="small" color={isDarkMode ? '#60A5FA' : '#2563EB'} />
                                        </View>
                                    ) : currentReports.length === 0 ? (
                                        <View className="py-8 items-center">
                                            <Text className="text-gray-400 dark:text-gray-500 text-sm">У вас пока нет заявок</Text>
                                        </View>
                                    ) : (
                                        currentReports.map((r) => {
                                            const cat = useRubricsStore.getState().getRubric(r.rubric_name);
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
                                                        className="w-10 h-10 rounded-xl items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-700"
                                                    >
                                                        {cat?.photoUrl ? (
                                                            <Image
                                                                source={{ uri: cat.photoUrl }}
                                                                style={{ width: 24, height: 24 }}
                                                                resizeMode="contain"
                                                            />
                                                        ) : (
                                                            <Text className="text-lg">❗</Text>
                                                        )}
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
                                    )
                                ) : (
                                    // Drafts list
                                    <>
                                        {/* Sync button - only for local drafts */}
                                        {drafts.length > 0 && (
                                            <TouchableOpacity
                                                onPress={handleSyncDrafts}
                                                disabled={isSyncing}
                                                className="mb-4 py-3 px-4 bg-blue-600 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
                                            >
                                                {isSyncing ? (
                                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                                ) : (
                                                    <>
                                                        <CloudUpload size={18} color="#FFFFFF" />
                                                        <Text className="text-white font-semibold text-sm">
                                                            Синхронизировать ({drafts.length})
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}

                                        {allDrafts.length === 0 ? (
                                            <View className="py-8 items-center">
                                                <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-3">
                                                    <FileClock size={28} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
                                                </View>
                                                <Text className="text-gray-400 dark:text-gray-500 text-sm text-center">Нет сохранённых черновиков</Text>
                                                <Text className="text-gray-300 dark:text-gray-600 text-xs text-center mt-1">Черновики создаются автоматически при отсутствии интернета</Text>
                                            </View>
                                        ) : (
                                            currentDrafts.map((d) => {
                                                // Check if it's a server draft (Report) or local draft (DraftReport)
                                                const isServerDraft = 'id' in d && !('localId' in d);
                                                const cat = useRubricsStore.getState().getRubric(
                                                    isServerDraft ? (d as Report).rubric_name : (d as DraftReportType).rubric
                                                );
                                                const itemKey = isServerDraft ? String((d as Report).id) : (d as DraftReportType).localId;
                                                const itemTitle = isServerDraft ? (d as Report).title : ((d as DraftReportType).title || 'Без названия');
                                                const itemDate = isServerDraft
                                                    ? new Date((d as Report).created_at || '').toLocaleDateString('ru-RU')
                                                    : new Date((d as DraftReportType).createdAt).toLocaleDateString('ru-RU');
                                                const photoCount = isServerDraft
                                                    ? ((d as Report).photos?.length || 0) + ((d as Report).preview_photo ? 1 : 0)
                                                    : (d as DraftReportType).photoUris.length;
                                                const isSelected = isServerDraft
                                                    ? selectedReport?.id === (d as Report).id
                                                    : selectedDraft?.localId === (d as DraftReportType).localId;

                                                return (
                                                    <TouchableOpacity
                                                        key={itemKey}
                                                        onPress={() => {
                                                            if (isServerDraft) {
                                                                fetchReportDetails((d as Report).id);
                                                            } else {
                                                                setSelectedDraft(d as DraftReportType);
                                                            }
                                                        }}
                                                        activeOpacity={0.7}
                                                        className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border flex-row items-center gap-3 mb-3 ${isSelected
                                                            ? 'border-blue-500 dark:border-blue-400'
                                                            : 'border-gray-100 dark:border-gray-800'
                                                            }`}
                                                    >
                                                        <View
                                                            className="w-10 h-10 rounded-xl items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-700"
                                                        >
                                                            {cat?.photoUrl ? (
                                                                <Image
                                                                    source={{ uri: cat.photoUrl }}
                                                                    style={{ width: 24, height: 24 }}
                                                                    resizeMode="contain"
                                                                />
                                                            ) : (
                                                                <Text className="text-lg">📝</Text>
                                                            )}
                                                        </View>
                                                        <View className="flex-1">
                                                            <Text
                                                                className="font-semibold text-gray-900 dark:text-gray-100"
                                                                numberOfLines={1}
                                                            >
                                                                {itemTitle}
                                                            </Text>
                                                            <Text className="text-xs text-gray-400 dark:text-gray-500">
                                                                {itemDate}
                                                                {photoCount > 0 && ` • ${photoCount} фото`}
                                                            </Text>
                                                        </View>
                                                        <Badge status="draft" />
                                                    </TouchableOpacity>
                                                );
                                            })
                                        )}
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Pagination */}
                        {activeTab === 'reports' ? (
                            // Reports pagination
                            !isLoading && totalReports > 0 && totalPages > 1 && (
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
                            )
                        ) : (
                            // Drafts pagination
                            allDrafts.length > 0 && totalDraftsPages > 1 && (
                                <View className="px-6 pb-4">
                                    <View className="w-full max-w-sm self-center">
                                        <View className="flex-row items-center justify-center gap-4 py-2">
                                            <TouchableOpacity
                                                onPress={() => setCurrentDraftsPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentDraftsPage === 1}
                                                className={`p-1 rounded ${currentDraftsPage === 1
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
                                                {currentDraftsPage} / {totalDraftsPages}
                                            </Text>

                                            <TouchableOpacity
                                                onPress={() => setCurrentDraftsPage(prev => Math.min(totalDraftsPages, prev + 1))}
                                                disabled={currentDraftsPage === totalDraftsPages}
                                                className={`p-1 rounded ${currentDraftsPage === totalDraftsPages
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
                            )
                        )}

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
                                    onDelete={promptDelete}
                                    onExport={handleExport}
                                    isDeleting={isDeleting}
                                    isExporting={isExporting}
                                />
                            ) : null}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Draft Detail Modal */}
            <Modal
                visible={!!selectedDraft}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setSelectedDraft(null)}
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
                            {selectedDraft && (
                                <DraftDetailInner
                                    draft={selectedDraft}
                                    isDarkMode={isDarkMode}
                                    onClose={() => setSelectedDraft(null)}
                                    onEdit={handleEditDraft}
                                    onDelete={handleDeleteDraft}
                                />
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Draft Delete Confirmation Modal */}
            <Modal
                visible={!!draftToDelete}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setDraftToDelete(null)}
            >
                <View
                    style={{ flex: 1, paddingHorizontal: 16 }}
                    className="justify-center items-center bg-black/50"
                >
                    <View
                        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl p-6"
                        style={{ elevation: 20 }}
                    >
                        <Text className="text-xl font-bold dark:text-white mb-2 text-center">
                            Удаление черновика
                        </Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center leading-5">
                            Вы уверены, что хотите удалить этот черновик? Это действие нельзя будет отменить.
                        </Text>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setDraftToDelete(null)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl items-center"
                            >
                                <Text className="text-gray-700 dark:text-gray-300 font-bold text-sm">Отмена</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmDeleteDraft}
                                className="flex-1 py-3 bg-red-50 dark:bg-red-900/40 border border-red-100 dark:border-red-800 rounded-xl items-center flex-row justify-center"
                            >
                                <Text className="text-red-600 font-bold text-sm">Удалить</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={!!reportToDelete}
                animationType="fade"
                transparent={true}
                onRequestClose={() => !isDeleting && setReportToDelete(null)}
            >
                <View
                    style={{ flex: 1, paddingHorizontal: 16 }}
                    className="justify-center items-center bg-black/50"
                >
                    <View
                        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl p-6"
                        style={{ elevation: 20 }}
                    >
                        <Text className="text-xl font-bold dark:text-white mb-2 text-center">
                            Удаление заявки
                        </Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center leading-5">
                            Вы уверены, что хотите удалить эту заявку? Это действие нельзя будет отменить.
                        </Text>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setReportToDelete(null)}
                                disabled={isDeleting}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl items-center"
                            >
                                <Text className="text-gray-700 dark:text-gray-300 font-bold text-sm">Отмена</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 py-3 bg-red-50 dark:bg-red-900/40 border border-red-100 dark:border-red-800 rounded-xl items-center flex-row justify-center"
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#DC2626" />
                                ) : (
                                    <Text className="text-red-600 font-bold text-sm">Удалить</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Export Preview Modal */}
            <Modal
                visible={!!exportPreview}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setExportPreview(null)}
            >
                <View
                    style={{ flex: 1, paddingHorizontal: 16 }}
                    className="justify-center items-center bg-black/50"
                >
                    <View
                        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl"
                        style={{
                            maxHeight: Platform.OS === 'web' ? '90%' : '85%',
                            elevation: 20,
                        }}
                    >
                        <View className="p-6" style={{ flexShrink: 1 }}>
                            {/* Header */}
                            <View className="flex-row justify-between items-center mb-4">
                                <View className="flex-row items-center gap-2">
                                    <FileText size={20} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
                                    <Text className="text-lg font-bold dark:text-white">
                                        Редактировать обращение
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setExportPreview(null)}>
                                    <X size={20} color={isDarkMode ? '#F9FAFB' : '#111827'} />
                                </TouchableOpacity>
                            </View>

                            {/* Report title */}
                            {exportPreview?.report && (
                                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    Обращение: {exportPreview.report.title}
                                </Text>
                            )}

                            {/* Editable letter */}
                            <ScrollView style={{ maxHeight: 400, flexShrink: 1 }}>
                                <TextInput
                                    value={editableLetterText}
                                    onChangeText={setEditableLetterText}
                                    multiline
                                    textAlignVertical="top"
                                    className="text-sm dark:text-white"
                                    style={{
                                        minHeight: 200,
                                        padding: 12,
                                        borderWidth: 1,
                                        borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                                        borderRadius: 12,
                                        backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                                        color: isDarkMode ? '#F9FAFB' : '#111827',
                                        fontSize: 14,
                                        lineHeight: 20,
                                    }}
                                    placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                                    placeholder="Текст обращения..."
                                />
                            </ScrollView>

                            {/* Photo count info */}
                            {exportPreview?.report && (() => {
                                let count = 0;
                                if (exportPreview.report.preview_photo) count++;
                                if (exportPreview.report.photos) count += exportPreview.report.photos.length;
                                return count > 0 ? (
                                    <Text className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                                        📎 {count} {count === 1 ? 'фото' : 'фото'} будет добавлено в PDF
                                    </Text>
                                ) : null;
                            })()}

                            {/* Actions */}
                            <View className="flex-row gap-3 mt-4">
                                <TouchableOpacity
                                    onPress={() => setExportPreview(null)}
                                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl items-center"
                                >
                                    <Text className="text-gray-700 dark:text-gray-300 font-bold text-sm">Отмена</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleConfirmExport}
                                    className="flex-1 py-3 bg-blue-600 rounded-xl items-center flex-row justify-center gap-2"
                                >
                                    <Download size={16} color="#fff" />
                                    <Text className="text-white font-bold text-sm">Экспорт PDF</Text>
                                </TouchableOpacity>
                            </View>
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
    const cat = useRubricsStore.getState().getRubric(report.rubric_name);

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
                {!!report.rubric_name && (
                    <View className="flex-row items-center mb-4">
                        <View
                            className="w-8 h-8 rounded-lg items-center justify-center mr-2 overflow-hidden bg-gray-100 dark:bg-gray-700"
                        >
                            {cat?.photoUrl ? (
                                <Image
                                    source={{ uri: cat.photoUrl }}
                                    style={{ width: 20, height: 20 }}
                                    resizeMode="contain"
                                />
                            ) : (
                                <Text className="text-sm">❗</Text>
                            )}
                        </View>
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {report.rubric_name}
                        </Text>
                    </View>
                )}

                {/* Описание */}
                {!!report.description && (
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

// ─── Draft Detail Component ──────────────────────────────────
function DraftDetailInner({
    draft,
    isDarkMode,
    onClose,
    onEdit,
    onDelete,
}: {
    draft: DraftReportType,
    isDarkMode: boolean,
    onClose: () => void,
    onEdit: (d: DraftReportType) => void,
    onDelete: (localId: string) => void,
}) {
    // Находим категорию
    const cat = useRubricsStore.getState().getRubric(draft.rubric);

    return (
        <View style={{ flexShrink: 1 }}>
            <View className="flex-row justify-between items-start mb-4">
                <Badge status="draft" />
                <TouchableOpacity onPress={onClose}>
                    <X size={20} color={isDarkMode ? "#F9FAFB" : "#111827"} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flexShrink: 1 }}
            >
                <Text className="text-xl font-bold dark:text-white mb-2">
                    {draft.title || 'Без названия'}
                </Text>

                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {draft.address}
                </Text>

                {/* Рубрика */}
                {!!draft.rubric && (
                    <View className="flex-row items-center mb-4">
                        <View
                            className="w-8 h-8 rounded-lg items-center justify-center mr-2 overflow-hidden bg-gray-100 dark:bg-gray-700"
                        >
                            {cat?.photoUrl ? (
                                <Image
                                    source={{ uri: cat.photoUrl }}
                                    style={{ width: 20, height: 20 }}
                                    resizeMode="contain"
                                />
                            ) : (
                                <Text className="text-sm">📝</Text>
                            )}
                        </View>
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {draft.rubric}
                        </Text>
                    </View>
                )}

                {/* Описание */}
                {!!draft.description && (
                    <View className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl mb-6">
                        <Text className="text-gray-700 dark:text-gray-300 leading-6">
                            {draft.description}
                        </Text>
                    </View>
                )}

                {/* Фото превью */}
                {draft.photoUris.length > 0 && (
                    <View className="mb-6">
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Фотографии ({draft.photoUris.length})
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                            {draft.photoUris.map((uri: string, index: number) => (
                                <View key={index} className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                    <Image
                                        source={{ uri }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Метаданные */}
                <View className="flex-row items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 mb-4">
                    <Text className="text-xs text-gray-400 dark:text-gray-500">
                        Создано: {draft.createdAt ? new Date(draft.createdAt).toLocaleDateString('ru-RU') : ''}
                    </Text>
                    <Text className="text-xs text-gray-400 dark:text-gray-500">
                        ID: {draft.localId}
                    </Text>
                </View>
            </ScrollView>

            <View className="flex-row gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <TouchableOpacity
                    onPress={() => onDelete(draft.localId)}
                    className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 rounded-xl items-center"
                >
                    <Text className="text-red-500 font-bold text-sm">Удалить</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => onEdit(draft)}
                    className="flex-1 py-3 bg-blue-600 rounded-xl items-center justify-center"
                >
                    <Text className="text-white font-bold text-sm">Продолжить</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
