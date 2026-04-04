import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';

const isWeb = Platform.OS === 'web';

export interface Photo {
    id?: number | string;
    photo_url: string;
    caption?: string | null;
}

export function PhotoCarousel({ photos, isDarkMode }: { photos: Photo[], isDarkMode: boolean }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

    if (!photos || photos.length === 0) {
        return null;
    }

    const goToNext = () => {
        setCurrentIndex((prev) => prev === photos.length - 1 ? 0 : prev + 1);
    };

    const handlePhotoPress = (photo: Photo) => {
        setSelectedPhoto(photo);
    };

    const closeModal = () => {
        setSelectedPhoto(null);
    };

    // Обработка ESC для закрытия модального окна
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedPhoto) {
                closeModal();
            }
        };

        if (selectedPhoto) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [selectedPhoto]);

    // Модальное окно для полного просмотра фото (с порталом)
    const photoModal = selectedPhoto && isWeb ? createPortal(
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
        </div>,
        document.body
    ) : null;

    return (
        <>
            <View className="mb-4">
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
                            className="w-full h-56 rounded-2xl bg-gray-200 dark:bg-gray-700"
                            resizeMode="cover"
                        />

                        {/* Навигационные стрелки (для web) */}
                        {isWeb && photos.length > 1 && (
                            <>
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation?.();
                                        setCurrentIndex((prev) => prev === 0 ? photos.length - 1 : prev - 1);
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
                                        setCurrentIndex((prev) => prev === photos.length - 1 ? 0 : prev + 1);
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
                            <View
                                key={index}
                                className={`w-2 h-2 rounded-full ${index === currentIndex
                                    ? 'bg-blue-600 dark:bg-blue-400 w-6'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            />
                        ))}
                    </View>
                )}
            </View>
            {photoModal}
        </>
    );
}
