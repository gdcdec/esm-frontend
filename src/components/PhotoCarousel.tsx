import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Image, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';

const isWeb = Platform.OS === 'web';

export interface Photo {
    id?: number | string;
    photo_url: string;
    caption?: string | null;
}

interface PhotoCarouselProps {
    photos: Photo[];
    isDarkMode: boolean;
    showLabel?: boolean;
    height?: number;
    onPhotoOpenChange?: (isOpen: boolean) => void;
}

export function PhotoCarousel({
    photos,
    isDarkMode,
    showLabel = false,
    height = 224,
    onPhotoOpenChange,
}: PhotoCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

    // Сообщаем родителю о состоянии фото-модалки
    useEffect(() => {
        onPhotoOpenChange?.(!!selectedPhoto);
    }, [selectedPhoto, onPhotoOpenChange]);

    if (!photos || photos.length === 0) {
        return null;
    }

    const goToNext = () => {
        setCurrentIndex((prev) => prev === photos.length - 1 ? 0 : prev + 1);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => prev === 0 ? photos.length - 1 : prev - 1);
    };

    const handlePhotoPress = (photo: Photo) => {
        setSelectedPhoto(photo);
        onPhotoOpenChange?.(true); // Синхронный вызов
    };

    const closeModal = () => {
        setSelectedPhoto(null);
        onPhotoOpenChange?.(false);
    };

    // Обработка ESC для закрытия модального окна
    useEffect(() => {
        if (!isWeb) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedPhoto) {
                e.preventDefault();
                e.stopPropagation();
                closeModal();
            }
        };

        if (selectedPhoto) {
            window.addEventListener('keydown', handleKeyDown, true); // фаза захвата
            return () => window.removeEventListener('keydown', handleKeyDown, true);
        }
    }, [selectedPhoto]);

    // Модальное окно для web (с порталом)
    const webModal = selectedPhoto && isWeb ? createPortal(
        <div
            onClick={closeModal}
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                zIndex: 2147483647,
                cursor: 'pointer',
            }}
        >
            <button
                onClick={(e) => { e.stopPropagation(); closeModal(); }}
                style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    zIndex: 2147483647,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 8,
                }}
            >
                <X size={32} color="white" />
            </button>
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 40,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={selectedPhoto.photo_url}
                    alt="Full size"
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        borderRadius: 8,
                    }}
                />
            </div>
            {selectedPhoto.caption && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        left: 40,
                        right: 40,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 16,
                        borderRadius: 8,
                    }}
                >
                    <p style={{ color: 'white', margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                        {selectedPhoto.caption}
                    </p>
                </div>
            )}
        </div>,
        document.body
    ) : null;

    // Модальное окно для native
    const nativeModal = !isWeb && selectedPhoto ? (
        <Modal
            visible={!!selectedPhoto}
            animationType="fade"
            transparent={true}
            onRequestClose={closeModal}
        >
            <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={closeModal}
            >
                <View className="flex-1 bg-black/95 relative">
                    <TouchableOpacity
                        onPress={closeModal}
                        className="absolute top-12 right-4 p-2 -mr-2 rounded-full bg-white/10 z-50"
                    >
                        <X size={28} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                        style={{ flex: 1 }}
                    >
                        <View className="flex-1 justify-center items-center p-4">
                            <Image
                                source={{ uri: selectedPhoto.photo_url }}
                                className="w-full h-full"
                                resizeMode="contain"
                            />
                        </View>
                    </TouchableOpacity>

                    {selectedPhoto.caption && (
                        <View className="absolute bottom-8 left-4 right-4 bg-black/80 rounded-xl p-4">
                            <Text className="text-white text-sm leading-relaxed">
                                {selectedPhoto.caption}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
    ) : null;

    return (
        <>
            <View className="mb-4">
                {showLabel && (
                    <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Фотографии ({currentIndex + 1}/{photos.length})
                    </Text>
                )}

                <View className="relative">
                    <TouchableOpacity
                        activeOpacity={isWeb ? 1 : 0.8}
                        onPress={() => {
                            if (isWeb) {
                                handlePhotoPress(photos[currentIndex]);
                            } else {
                                goToNext();
                            }
                        }}
                    >
                        <Image
                            source={{ uri: photos[currentIndex].photo_url }}
                            style={{ width: '100%', height }}
                            className="rounded-2xl bg-gray-200 dark:bg-gray-700 overflow-hidden"
                            resizeMode="cover"
                        />

                        {/* Навигационные стрелки (для web) */}
                        {isWeb && photos.length > 1 && (
                            <>
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation?.();
                                        goToPrevious();
                                    }}
                                    style={{
                                        position: 'absolute',
                                        left: 8,
                                        top: '50%',
                                        transform: [{ translateY: -16 }],
                                        width: 36, height: 36,
                                        borderRadius: 18,
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <ChevronLeft size={20} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation?.();
                                        goToNext();
                                    }}
                                    style={{
                                        position: 'absolute',
                                        right: 8,
                                        top: '50%',
                                        transform: [{ translateY: -16 }],
                                        width: 36, height: 36,
                                        borderRadius: 18,
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <ChevronRight size={20} color="white" />
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Счётчик фото */}
                        {photos.length > 1 && (
                            <View className="absolute top-3 right-3 bg-black/60 px-2.5 py-1 rounded-full">
                                <Text className="text-white text-xs font-bold">
                                    {currentIndex + 1}/{photos.length}
                                </Text>
                            </View>
                        )}

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
                    <View className="flex-row justify-center items-center mt-3 gap-2">
                        {photos.map((_, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setCurrentIndex(index)}
                                className={`h-2 rounded-full transition-all duration-200 ${index === currentIndex
                                    ? 'bg-blue-600 dark:bg-blue-400 w-6'
                                    : 'bg-gray-300 dark:bg-gray-600 w-2'
                                    }`}
                            />
                        ))}
                    </View>
                )}
            </View>
            {webModal}
            {nativeModal}
        </>
    );
}
