import { GallerySheet, SelectedPhoto } from '@/src/components/InlineGallery';
import { Button, Input } from '@/src/components/ui';
import { CATEGORIES } from '@/src/constants/categories';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, ImagePlus, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export default function CreateReportScreen() {
    const [category, setCategory] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [address, setAddress] = useState('');
    const [desc, setDesc] = useState('');
    const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
    const [galleryOpen, setGalleryOpen] = useState(false);

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

    const handleSubmit = () => {
        if (!category || !title) {
            Alert.alert('Ошибка', 'Заполните обязательные поля');
            return;
        }
        // TODO: API call to create report + upload photos
        Alert.alert('Успех', 'Заявка отправлена!', [
            { text: 'OK', onPress: () => router.back() },
        ]);
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <SafeAreaView edges={['top']} className="bg-white border-b border-gray-100">
                <View className="flex-row items-center justify-between px-4 py-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 -ml-2 rounded-full"
                    >
                        <X size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg">Новая заявка</Text>
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
                    <Text className="text-sm font-bold text-gray-900 mb-3">
                        1. Что случилось?
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-6 -mx-5 px-5"
                    >
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setCategory(cat.id)}
                                className={`w-20 items-center p-3 rounded-xl border mr-3 ${category === cat.id
                                    ? 'bg-blue-50 border-blue-500'
                                    : 'bg-gray-50 border-transparent'
                                    }`}
                            >
                                <View
                                    className="w-10 h-10 rounded-full items-center justify-center mb-2"
                                    style={{ backgroundColor: cat.color + '30' }}
                                >
                                    <Text className="text-xl">{cat.icon}</Text>
                                </View>
                                <Text
                                    className="text-xs font-medium text-center"
                                    numberOfLines={1}
                                >
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Step 2: Details */}
                    <Text className="text-sm font-bold text-gray-900 mb-3">
                        2. Детали
                    </Text>
                    <Input
                        placeholder="Краткое название"
                        value={title}
                        onChangeText={setTitle}
                    />
                    <Input
                        placeholder="Адрес (например: ул. Ленина, 10)"
                        value={address}
                        onChangeText={setAddress}
                    />
                    <Input
                        placeholder="Подробное описание..."
                        multiline
                        value={desc}
                        onChangeText={setDesc}
                    />

                    {/* Step 3: Photos */}
                    <Text className="text-sm font-bold text-gray-900 mb-3">
                        3. Фотографии{' '}
                        {photos.length > 0 && (
                            <Text className="text-gray-400 font-normal">
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
                                className="w-full h-28 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center"
                            >
                                <ImagePlus size={28} color="#9CA3AF" />
                                <Text className="text-sm text-gray-400 mt-2">Выбрать файл</Text>
                                <Text className="text-xs text-gray-300 mt-1">
                                    JPG, PNG, WebP · до 10 МБ
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            // Native: open gallery sheet
                            <TouchableOpacity
                                onPress={openGallery}
                                className="flex-row items-center justify-center gap-2 py-3 bg-gray-50 rounded-xl"
                            >
                                <Camera size={18} color="#6B7280" />
                                <Text className="text-sm font-medium text-gray-600">
                                    Добавить фото
                                </Text>
                            </TouchableOpacity>
                        )
                    )}

                    <View className="h-20" />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Submit */}
            <SafeAreaView edges={['bottom']} className="border-t border-gray-100 bg-white px-5 py-3">
                <Button title="Отправить" onPress={handleSubmit} />
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
