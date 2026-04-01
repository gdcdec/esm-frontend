import { GallerySheet, SelectedPhoto } from '@/src/components/InlineGallery';
import { Button, Input } from '@/src/components/ui';
import { addressService } from '@/src/services/address';
import { photosService } from '@/src/services/photos';
import { reportsService } from '@/src/services/reports';
import { useReportsStore } from '@/src/store/reportsStore';
import { useRubricsStore } from '@/src/store/rubricsStore';
import { useThemeStore } from '@/src/store/themeStore';
import { AddressSearchResult, Report, ReportPhoto } from '@/src/types';
import { navigateBack } from '@/src/utils/navigation';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, ImagePlus, Info, Loader2, MapPin, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Cross-platform alert helper
const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n${message}`);
        onOk?.();
    } else {
        Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    }
};

// Cross-platform confirm helper
const showConfirm = (
    title: string,
    message: string,
    onYes: () => void,
    onNo: () => void
) => {
    if (Platform.OS === 'web') {
        if (window.confirm(`${title}\n${message}`)) {
            onYes();
        } else {
            onNo();
        }
    } else {
        Alert.alert(title, message, [
            { text: 'Нет', style: 'destructive', onPress: onNo },
            { text: 'Сохранить', onPress: onYes },
        ]);
    }
};

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export default function CreateReportScreen() {
    const params = useLocalSearchParams<{
        address?: string;
        lat?: string;
        lon?: string;
        editId?: string;
        draftId?: string;
    }>();
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const insets = useSafeAreaInsets();

    // Rubrics from cached store
    const rubrics = useRubricsStore((s) => s.rubrics);
    const isRubricsLoaded = useRubricsStore((s) => s.isLoaded);

    const [category, setCategory] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [address, setAddress] = useState(params.address ?? '');
    const [desc, setDesc] = useState('');
    const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingInitial, setIsFetchingInitial] = useState(!!params.editId || !!params.draftId);
    const [existingPhotos, setExistingPhotos] = useState<ReportPhoto[]>([]);
    const [originalReportStatus, setOriginalReportStatus] = useState<string | null>(null);

    const [formError, setFormErrorState] = useState<string | null>(null);
    const formErrorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setFormError = (msg: string | null) => {
        setFormErrorState(msg);
        if (formErrorTimeout.current) clearTimeout(formErrorTimeout.current);
        if (msg) {
            formErrorTimeout.current = setTimeout(() => {
                setFormErrorState(null);
            }, 3000);
        }
    };

    // Load existing report if editing or draft
    useEffect(() => {
        (async () => {
            // Make sure rubrics are loaded
            if (!isRubricsLoaded) {
                await useRubricsStore.getState().fetchRubrics();
            }

            if (params.editId) {
                try {
                    const report = await useReportsStore.getState().getById(parseInt(params.editId));
                    setTitle(report.title);
                    setAddress(report.address);
                    setDesc(report.description);
                    setCategory(report.rubric_name);
                    setSelectedLocation({ lat: report.latitude, lon: report.longitude });
                    setOriginalReportStatus(report.status || null);
                    if (report.photos) {
                        setExistingPhotos(report.photos);
                    }
                } catch (err) {
                    console.warn('Failed to fetch report:', err);
                }
            } else if (params.draftId) {
                // Load draft
                const draft = useReportsStore.getState().getDraft(params.draftId);
                if (draft) {
                    setTitle(draft.title);
                    setAddress(draft.address);
                    setDesc(draft.description);
                    setCategory(draft.rubric);
                    setSelectedLocation({ lat: draft.latitude, lon: draft.longitude });
                    // Convert photoUris to SelectedPhoto format
                    const draftPhotos: SelectedPhoto[] = draft.photoUris.map((uri, i) => ({
                        uri,
                        name: `draft_photo_${i}.jpg`,
                        type: 'image/jpeg',
                    }));
                    setPhotos(draftPhotos);
                }
            }
            setIsFetchingInitial(false);
        })();
    }, [params.editId, params.draftId]);

    // Address Autocomplete state
    const [suggestions, setSuggestions] = useState<AddressSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null);
    const preventSearchRef = useRef(false);

    const addressInputRef = useRef<TextInput>(null);
    const [addressSelection, setAddressSelection] = useState<{ start: number; end: number } | undefined>(undefined);

    useEffect(() => {
        if (address.length < 3) {
            setSuggestions([]);
            return;
        }
        if (preventSearchRef.current) {
            preventSearchRef.current = false;
            return;
        }

        const timeout = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await addressService.search(address);
                setSuggestions(results);
            } catch (e) {
                console.warn('Address search fail', e);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [address]);

    const handleSelectAddress = (item: AddressSearchResult) => {
        preventSearchRef.current = true;

        let shortAddress = '';
        const { street, house, city } = item;

        if (house && street) {
            const cityStr = city ? `, ${city}` : '';
            shortAddress = `${street}, ${house}${cityStr}`;
        } else {
            shortAddress = item.display_name;
        }

        setAddress(shortAddress);
        setSelectedLocation({ lat: item.latitude, lon: item.longitude });
        setSuggestions([]);
        setAddressSelection({ start: 0, end: 0 });
        Keyboard.dismiss();
    };

    function openGallery() {
        Keyboard.dismiss();
        setGalleryOpen(true);
    }

    function removePhoto(index: number, isExisting: boolean) {
        if (isExisting) {
            setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
        } else {
            setPhotos((prev) => prev.filter((_, i) => i !== index));
        }
    }

    // Web: file picker
    async function pickFromGalleryWeb() {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: MAX_PHOTOS - photos.length,
            quality: 0.8,
        });
        if (!result.canceled && result.assets) {
            const newPhotos: SelectedPhoto[] = result.assets
                .filter((a) => {
                    const mime = a.mimeType ?? '';
                    const size = a.fileSize ?? 0;
                    if (mime && !ALLOWED_TYPES.includes(mime)) return false;
                    if (size > MAX_FILE_SIZE) return false;
                    return true;
                })
                .map((a) => ({
                    uri: a.uri,
                    name: a.fileName ?? `photo_${Date.now()}.jpg`,
                    type: a.mimeType ?? 'image/jpeg',
                }));
            setPhotos((prev) => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
        }
    }

    // Check if user has entered any data (for draft prompt)
    const hasData = !!(title || desc || category || address !== (params.address ?? '') || photos.length > 0);

    // Handle close button — prompt to save draft if there's data
    const handleClose = () => {
        if (params.editId || !hasData) {
            navigateBack('/(main)/map');
            return;
        }

        // If editing a draft, update it
        if (params.draftId) {
            const lat = selectedLocation?.lat ?? (params.lat ? parseFloat(params.lat) : 0);
            const lon = selectedLocation?.lon ?? (params.lon ? parseFloat(params.lon) : 0);

            useReportsStore.getState().updateDraft(params.draftId, {
                title: title || 'Без названия',
                description: desc,
                address,
                latitude: lat,
                longitude: lon,
                rubric: category,
                photoUris: photos.map((p) => p.uri),
            });
            showAlert('Черновик обновлён', 'Изменения сохранены.', () => navigateBack('/(main)/map'));
            return;
        }

        showConfirm(
            'Сохранить черновик?',
            'У вас есть несохранённые данные. Сохранить как черновик?',
            () => {
                // Save draft
                const lat = selectedLocation?.lat ?? (params.lat ? parseFloat(params.lat) : 0);
                const lon = selectedLocation?.lon ?? (params.lon ? parseFloat(params.lon) : 0);

                useReportsStore.getState().saveDraft({
                    title: title || 'Без названия',
                    description: desc,
                    address,
                    latitude: lat,
                    longitude: lon,
                    rubric: category,
                    photoUris: photos.map((p) => p.uri),
                });

                showAlert('Черновик сохранён', 'Заявка сохранена как черновик.', () => navigateBack('/(main)/map'));
            },
            () => {
                // Discard
                navigateBack('/(main)/map');
            }
        );
    };

    const handleSubmit = async () => {
        setFormError(null);
        if (!category || !title || !address) {
            setFormError('Заполните обязательные поля');
            return;
        }

        // Character count validation
        const MIN_TITLE_LENGTH = 5;
        const MAX_TITLE_LENGTH = 100;
        const MIN_DESC_LENGTH = 10;
        const MAX_DESC_LENGTH = 2000;

        if (title.length < MIN_TITLE_LENGTH) {
            setFormError(`Название должно содержать минимум ${MIN_TITLE_LENGTH} символов`);
            return;
        }
        if (title.length > MAX_TITLE_LENGTH) {
            setFormError(`Название не должно превышать ${MAX_TITLE_LENGTH} символов`);
            return;
        }
        if (desc.length < MIN_DESC_LENGTH) {
            setFormError(`Описание должно содержать минимум ${MIN_DESC_LENGTH} символов`);
            return;
        }
        if (desc.length > MAX_DESC_LENGTH) {
            setFormError(`Описание не должно превышать ${MAX_DESC_LENGTH} символов`);
            return;
        }

        const lat = selectedLocation?.lat ?? (params.lat ? parseFloat(params.lat) : 0);
        const lon = selectedLocation?.lon ?? (params.lon ? parseFloat(params.lon) : 0);

        setIsSubmitting(true);
        try {
            let report: Report;
            if (params.editId) {
                // If editing a draft, send it for review (change status from draft to check)
                const isDraft = originalReportStatus === 'draft';
                report = await reportsService.update(parseInt(params.editId), {
                    title,
                    description: desc,
                    address,
                    latitude: lat,
                    longitude: lon,
                    rubric: category,
                    ...(isDraft && { status: 'check' }),
                });
            } else {
                report = await reportsService.create({
                    title,
                    description: desc,
                    address,
                    latitude: lat,
                    longitude: lon,
                    rubric: category,
                });
            }

            // Upload photos
            if (photos.length > 0) {
                try {
                    await photosService.upload(report.id, photos);
                } catch (photoErr: any) {
                    const photoMsg = photoErr?.response?.data?.detail || photoErr?.message;
                    showAlert(
                        params.editId ? 'Заявка обновлена' : 'Заявка создана',
                        `Заявка сохранена, но фото не загружены: ${photoMsg}`,
                        () => router.back()
                    );
                    return;
                }
            }

            showAlert('Успех', params.editId ? 'Заявка обновлена!' : 'Заявка отправлена на рассмотрение!', () => {
                // Remove draft if it was sent successfully
                if (params.draftId) {
                    useReportsStore.getState().removeDraft(params.draftId);
                }
                router.back();
            });
        } catch (e: any) {
            // Offline if there is no response from the server
            const isOffline = !e.response && !e.status;

            if (!params.editId && isOffline) {
                // Offline — save as draft
                useReportsStore.getState().saveDraft({
                    title,
                    description: desc,
                    address,
                    latitude: lat,
                    longitude: lon,
                    rubric: category,
                    photoUris: photos.map((p) => p.uri),
                });
                showAlert(
                    'Нет подключения',
                    'Заявка сохранена как черновик. Она будет автоматически отправлена при подключении к интернету.',
                    () => router.back()
                );
            } else {
                let serverMsg = 'Не удалось сохранить заявку';
                if (e?.response?.data) {
                    const data = e.response.data;
                    if (data.description) {
                        serverMsg = Array.isArray(data.description) ? data.description.join(', ') : data.description;
                    } else if (data.detail) {
                        serverMsg = data.detail;
                    } else if (typeof data === 'string') {
                        serverMsg = data;
                    } else {
                        serverMsg = JSON.stringify(data);
                    }
                } else if (e?.message) {
                    serverMsg = e.message;
                }
                setFormError(serverMsg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-gray-900">
            {/* Header */}
            <SafeAreaView edges={['top']} className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <View className="flex-row items-center justify-between px-4 py-3">
                    <TouchableOpacity
                        onPress={handleClose}
                        className="p-2 -ml-2 rounded-full"
                    >
                        <X size={24} color={isDarkMode ? '#F3F4F6' : '#111827'} />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg dark:text-gray-100">
                        {params.editId ? 'Редактирование' : params.draftId ? 'Редактирование черновика' : 'Новая заявка'}
                    </Text>
                    <View className="w-8" />
                </View>
            </SafeAreaView>

            {/* Form */}
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    className="flex-1 p-5"
                    keyboardShouldPersistTaps="handled"
                >
                    {isFetchingInitial && (
                        <View className="py-20 items-center">
                            <ActivityIndicator size="large" color="#2563EB" />
                        </View>
                    )}

                    {!isFetchingInitial && (
                        <>
                            {/* Step 1: Category */}
                            <Text className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
                                1. Что случилось?
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="mb-6 -mx-5 px-5"
                            >
                                {rubrics.length === 0 ? (
                                    <View className="py-4 px-8">
                                        <ActivityIndicator size="small" color={isDarkMode ? '#60A5FA' : '#2563EB'} />
                                    </View>
                                ) : rubrics.map((rub) => (
                                    <TouchableOpacity
                                        key={rub.name}
                                        onPress={() => setCategory(rub.name)}
                                        className={`w-20 items-center p-3 rounded-xl border mr-3 ${category === rub.name
                                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                                            : 'bg-gray-50 dark:bg-gray-800 border-transparent'
                                            }`}
                                    >
                                        <View className="w-10 h-10 rounded-full items-center justify-center mb-2 overflow-hidden bg-gray-200 dark:bg-gray-700">
                                            {rub.photoUrl ? (
                                                <Image
                                                    source={{ uri: rub.photoUrl }}
                                                    style={{ width: 28, height: 28 }}
                                                    resizeMode="contain"
                                                />
                                            ) : (
                                                <Text className="text-xl">📋</Text>
                                            )}
                                        </View>
                                        <Text
                                            className={`text-xs font-medium text-center ${category === rub.name ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-300'}`}
                                            numberOfLines={1}
                                        >
                                            {rub.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Step 2: Details */}
                            <Text className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
                                2. Детали
                            </Text>
                            <Input
                                placeholder="Краткое название"
                                value={title}
                                onChangeText={setTitle}
                            />

                            <View className="z-10 relative">
                                <Input
                                    ref={addressInputRef}
                                    placeholder="Адрес (например: ул. Ленина, 10)"
                                    value={address}
                                    selection={addressSelection}
                                    onSelectionChange={(e) => setAddressSelection(e.nativeEvent.selection)}
                                    onChangeText={(text) => {
                                        setAddress(text);
                                        setSelectedLocation(null);
                                    }}
                                />
                                {/* Address Autocomplete Dropdown */}
                                {(suggestions.length > 0 || isSearching) && (
                                    <View className="absolute top-[52px] left-0 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 p-2"
                                        style={{
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 12,
                                            elevation: 5,
                                        }}>
                                        {isSearching ? (
                                            <View className="p-4 items-center">
                                                <Loader2 size={24} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
                                            </View>
                                        ) : (
                                            suggestions.map((item, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    onPress={() => handleSelectAddress(item)}
                                                    className={`flex-row items-center p-3 ${index < suggestions.length - 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''
                                                        }`}
                                                >
                                                    <MapPin size={16} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} style={{ marginRight: 12 }} />
                                                    <Text className="flex-1 text-sm text-gray-700 dark:text-gray-300" numberOfLines={2}>
                                                        {item.display_name}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </View>
                                )}
                            </View>

                            <Input
                                placeholder="Подробное описание..."
                                multiline
                                value={desc}
                                onChangeText={setDesc}
                            />

                            {/* Step 3: Photos */}
                            <Text className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
                                3. Фотографии{' '}
                                {photos.length > 0 && (
                                    <Text className="text-gray-400 dark:text-gray-500 font-normal">
                                        ({photos.length}/{MAX_PHOTOS})
                                    </Text>
                                )}
                            </Text>

                            {/* Selected photos preview */}
                            {(photos.length > 0 || existingPhotos.length > 0) && (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    className="mb-3"
                                    style={{ overflow: 'visible' }}
                                    contentContainerStyle={{ paddingTop: 8, paddingRight: 8 }}
                                >
                                    {/* Existing photos */}
                                    {existingPhotos.map((photo, i) => (
                                        <View
                                            key={`existing-${photo.id}`}
                                            className="relative mr-3"
                                            style={{ width: 100, height: 100, overflow: 'visible' }}
                                        >
                                            <Image
                                                source={{ uri: photo.photo_url }}
                                                className="w-full h-full rounded-xl opacity-80"
                                                resizeMode="cover"
                                            />
                                            <TouchableOpacity
                                                onPress={() => removePhoto(i, true)}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                                                style={{
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 1 },
                                                    shadowOpacity: 0.2,
                                                    shadowRadius: 2,
                                                    elevation: 3,
                                                }}
                                            >
                                                <Trash2 size={12} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    {/* New photos */}
                                    {photos.map((photo, i) => (
                                        <View
                                            key={photo.uri}
                                            className="relative mr-3"
                                            style={{ width: 100, height: 100, overflow: 'visible' }}
                                        >
                                            <Image
                                                source={{ uri: photo.uri }}
                                                className="w-full h-full rounded-xl"
                                                resizeMode="cover"
                                            />
                                            <TouchableOpacity
                                                onPress={() => removePhoto(i, false)}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                                                style={{
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 1 },
                                                    shadowOpacity: 0.2,
                                                    shadowRadius: 2,
                                                    elevation: 3,
                                                }}
                                            >
                                                <Trash2 size={12} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            )}

                            {/* Add photo button — different per platform */}
                            {photos.length < MAX_PHOTOS && (
                                Platform.OS === 'web' ? (
                                    <TouchableOpacity
                                        onPress={pickFromGalleryWeb}
                                        className="w-full h-28 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 items-center justify-center"
                                    >
                                        <ImagePlus size={28} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
                                        <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2">Выбрать файл</Text>
                                        <Text className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                                            JPG, PNG, WebP · до 10 МБ
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        onPress={openGallery}
                                        className="flex-row items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                                    >
                                        <Camera size={18} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                                        <Text className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                            Добавить фото
                                        </Text>
                                    </TouchableOpacity>
                                )
                            )}

                            <View className="h-20" />
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Submit */}
            <SafeAreaView edges={['bottom']} className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-3">
                <Button
                    title={isSubmitting ? (params.editId ? 'Сохранение...' : params.draftId ? 'Отправка...' : 'Отправка...') : (params.editId ? 'Сохранить изменения' : params.draftId ? 'Отправить черновик' : 'Отправить')}
                    onPress={handleSubmit}
                    disabled={isSubmitting || isFetchingInitial}
                />
            </SafeAreaView>

            {/* Tap outside to close gallery */}
            {Platform.OS !== 'web' && galleryOpen && (
                <Pressable
                    onPress={() => setGalleryOpen(false)}
                    style={StyleSheet.absoluteFill}
                />
            )}

            {/* Gallery sheet overlay (native only) */}
            {Platform.OS !== 'web' && (
                <GallerySheet
                    visible={galleryOpen}
                    selected={photos}
                    maxPhotos={MAX_PHOTOS}
                    onSelectionChange={setPhotos}
                    onClose={() => setGalleryOpen(false)}
                />
            )}

            {/* Error Toast */}
            {formError && (
                <View
                    className="absolute left-4 right-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-2xl p-4 shadow-xl flex-row items-center"
                    style={{ top: Math.max(insets.top + 8, 16), elevation: 12, zIndex: 9999 }}
                >
                    <Info size={22} color={isDarkMode ? '#FCA5A5' : '#DC2626'} />
                    <Text className="text-red-800 dark:text-red-200 font-medium ml-3 flex-1">{formError}</Text>
                    <TouchableOpacity onPress={() => setFormError(null)} className="p-1">
                        <X size={20} color={isDarkMode ? '#FCA5A5' : '#DC2626'} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
