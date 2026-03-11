import { GallerySheet, SelectedPhoto } from '@/src/components/InlineGallery';
import { Button, Input } from '@/src/components/ui';
import { addressService } from '@/src/services/address';
import { photosService } from '@/src/services/photos';
import { reportsService } from '@/src/services/reports';
import { Rubric, rubricsService } from '@/src/services/rubrics';
import { useThemeStore } from '@/src/store/themeStore';
import { AddressSearchResult } from '@/src/types';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, ImagePlus, Loader2, MapPin, Trash2, X } from 'lucide-react-native';
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
import { SafeAreaView } from 'react-native-safe-area-context';

// Cross-platform alert helper (Alert.alert doesn't work on web)
const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n${message}`);
        onOk?.();
    } else {
        Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    }
};

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export default function CreateReportScreen() {
    const params = useLocalSearchParams<{ address?: string; lat?: string; lon?: string }>();
    const isDarkMode = useThemeStore((s) => s.isDarkMode);

    const [rubrics, setRubrics] = useState<Rubric[]>([]);
    const [isLoadingRubrics, setIsLoadingRubrics] = useState(true);
    const [category, setCategory] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [address, setAddress] = useState(params.address ?? '');
    const [desc, setDesc] = useState('');
    const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch rubrics from API
    useEffect(() => {
        (async () => {
            try {
                const data = await rubricsService.getAll();
                setRubrics(data);
            } catch (err) {
                console.warn('Failed to fetch rubrics:', err);
            } finally {
                setIsLoadingRubrics(false);
            }
        })();
    }, []);

    // Address Autocomplete state
    const [suggestions, setSuggestions] = useState<AddressSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null);
    const preventSearchRef = useRef(false);

    // Ref and selection state to control cursor position
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

        // Move cursor to the start of the string
        setAddressSelection({ start: 0, end: 0 });

        Keyboard.dismiss();
    };

    function openGallery() {
        Keyboard.dismiss();
        setGalleryOpen(true);
    }

    function removePhoto(index: number) {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    }

    // ─── Web: file picker ────────────────────────────────────────
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

    const handleSubmit = async () => {
        if (!category || !title || !address) {
            showAlert('Ошибка', 'Заполните обязательные поля');
            return;
        }
        const lat = selectedLocation?.lat ?? (params.lat ? parseFloat(params.lat) : 0);
        const lon = selectedLocation?.lon ?? (params.lon ? parseFloat(params.lon) : 0);

        setIsSubmitting(true);
        try {
            // category is already the rubric name (PK)
            const report = await reportsService.create({
                title,
                description: desc,
                address,
                latitude: lat,
                longitude: lon,
                rubric: category,
            });

            if (photos.length > 0) {
                try {
                    await photosService.upload(report.id, photos);
                } catch (photoErr: any) {
                    const photoMsg =
                        photoErr?.response?.data?.photos?.[0] ||
                        photoErr?.response?.data?.post_id?.[0] ||
                        photoErr?.response?.data?.non_field_errors?.[0] ||
                        photoErr?.response?.data?.detail ||
                        photoErr?.message;
                    showAlert(
                        'Заявка создана',
                        `Заявка создана, но фото не загружены: ${photoMsg}`,
                        () => router.back()
                    );
                    return;
                }
            }

            showAlert('Успех', 'Заявка отправлена на рассмотрение!', () => router.back());
        } catch (e: any) {
            const serverMsg =
                e?.response?.data?.detail ||
                e?.response?.data?.title?.[0] ||
                e?.response?.data?.rubric?.[0] ||
                e?.response?.data?.non_field_errors?.[0] ||
                e?.message;
            showAlert('Ошибка', serverMsg ?? 'Не удалось отправить заявку');
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
                        onPress={() => router.back()}
                        className="p-2 -ml-2 rounded-full"
                    >
                        <X size={24} color={isDarkMode ? '#F3F4F6' : '#111827'} />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg dark:text-gray-100">Новая заявка</Text>
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
                    {/* Step 1: Category */}
                    <Text className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
                        1. Что случилось?
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-6 -mx-5 px-5"
                    >
                        {isLoadingRubrics ? (
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
                                    {rub.photo_url ? (
                                        <Image
                                            source={{ uri: rub.photo_url }}
                                            className="w-10 h-10"
                                            resizeMode="cover"
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
                    {photos.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mb-3"
                            style={{ overflow: 'visible' }}
                            contentContainerStyle={{ paddingTop: 8, paddingRight: 8 }}
                        >
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
                                        onPress={() => removePhoto(i)}
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
                            // Web: file picker immediately
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
                            // Native: open gallery sheet
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
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Submit */}
            <SafeAreaView edges={['bottom']} className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-3">
                <Button
                    title={isSubmitting ? 'Отправка...' : 'Отправить'}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
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
        </View>
    );
}
