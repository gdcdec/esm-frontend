import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Camera, Check } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    BackHandler,
    Dimensions,
    Image,
    PanResponder,
    Platform,
    Text,
    TouchableOpacity,
    View,
    type FlatList as FlatListType,
} from 'react-native';

const COLUMNS = 3;
const GAP = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - GAP * (COLUMNS + 1)) / COLUMNS);
const PAGE_SIZE = 30;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface SelectedPhoto {
    uri: string;
    name: string;
    type: string;
}

interface GallerySheetProps {
    visible: boolean;
    selected: SelectedPhoto[];
    maxPhotos: number;
    onSelectionChange: (photos: SelectedPhoto[]) => void;
    onClose: () => void;
}

export function GallerySheet({
    visible,
    selected,
    maxPhotos,
    onSelectionChange,
    onClose,
}: GallerySheetProps) {
    const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);
    const [currentDate, setCurrentDate] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const flatListRef = useRef<FlatListType>(null);
    const prevIds = useRef<Set<string>>(new Set());

    const snapPoints = useMemo(() => ['45%', '90%'], []);
    const selectedUris = useMemo(() => new Set(selected.map((p) => p.uri)), [selected]);

    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.snapToIndex(0);
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
            }, 100);
        } else {
            bottomSheetRef.current?.close();
        }
    }, [visible]);

    // ─── Кнопка "Назад"  ─────────────────────────────────────
    useEffect(() => {
        if (!visible) return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            bottomSheetRef.current?.close();
            return true;
        });
        return () => sub.remove();
    }, [visible]);

    const sheetIndexRef = useRef(-1);

    const handleSheetChanges = useCallback((index: number) => {
        sheetIndexRef.current = index;
        setIsExpanded(index === 1);
        if (index === -1) {
            onClose();
        }
    }, [onClose]);

    // ─── Загрузка фото ───────────────────────────────────────────────
    useEffect(() => {
        if (Platform.OS === 'web' || !visible) return;
        if (assets.length > 0) return;
        (async () => {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            setHasPermission(status === 'granted');
            if (status === 'granted') loadMore();
        })();
    }, [visible]);

    async function loadMore() {
        if (!hasMore) return;
        const page = await MediaLibrary.getAssetsAsync({
            first: PAGE_SIZE,
            after: endCursor,
            mediaType: MediaLibrary.MediaType.photo,
            sortBy: [MediaLibrary.SortBy.creationTime],
        });
        setAssets((prev) => {
            const unique = page.assets.filter((a) => !prevIds.current.has(a.id));
            prevIds.current = new Set([...prevIds.current, ...unique.map((a) => a.id)]);
            return [...prev, ...unique];
        });
        setEndCursor(page.endCursor);
        setHasMore(page.hasNextPage);
    }

    // ─── Действия ────────────────────────────────────────────────────
    async function toggleAsset(asset: MediaLibrary.Asset) {
        if (selectedUris.has(asset.uri)) {
            onSelectionChange(selected.filter((p) => p.uri !== asset.uri));
        } else {
            if (selected.length >= maxPhotos) {
                Alert.alert('Максимум', `Можно выбрать до ${maxPhotos} фото`);
                return;
            }
            // Проверка размера файла
            try {
                const info = await MediaLibrary.getAssetInfoAsync(asset.id);
                const size = (info as any).fileSize ?? 0;
                if (size > MAX_FILE_SIZE) {
                    Alert.alert('Ошибка', 'Файл слишком большой (макс. 10 МБ)');
                    return;
                }
            } catch (error) {
                console.warn('Failed to get asset info:', error);
                // Продолжаем без проверки размера если не удалось получить информацию
            }
            onSelectionChange([
                ...selected,
                {
                    uri: asset.uri,
                    name: asset.filename ?? `photo_${Date.now()}.jpg`,
                    type: `image/${(asset.filename?.split('.').pop() ?? 'jpeg').toLowerCase()}`,
                },
            ]);
        }
    }

    async function openCamera() {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Ошибка', 'Нет доступа к камере');
        if (selected.length >= maxPhotos) {
            Alert.alert('Максимум', `Можно выбрать до ${maxPhotos} фото`);
            return;
        }

        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
        if (!result.canceled && result.assets?.[0]) {
            const a = result.assets[0];
            if ((a.fileSize ?? 0) > MAX_FILE_SIZE) {
                Alert.alert('Ошибка', 'Файл слишком большой (макс. 10 МБ)');
                return;
            }
            onSelectionChange([...selected, {
                uri: a.uri,
                name: a.fileName ?? `camera_${Date.now()}.jpg`,
                type: a.mimeType ?? 'image/jpeg',
            }]);
        }
    }

    // ─── Рендер ──────────────────────────────────────────────────────
    const renderItem = useCallback(({ item }: { item: 'camera' | MediaLibrary.Asset }) => {
        if (item === 'camera') {
            return (
                <TouchableOpacity
                    onPress={openCamera}
                    style={{
                        width: CELL_SIZE, height: CELL_SIZE, margin: GAP / 2,
                        backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <Camera size={28} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 11, marginTop: 4, fontWeight: '500' }}>Камера</Text>
                </TouchableOpacity>
            );
        }
        const isSelected = selectedUris.has(item.uri);
        const selIdx = selected.findIndex((p) => p.uri === item.uri);

        return (
            <TouchableOpacity onPress={() => toggleAsset(item)} activeOpacity={0.7} style={{ width: CELL_SIZE, height: CELL_SIZE, margin: GAP / 2 }}>
                <Image source={{ uri: item.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                {isSelected ? (
                    <View style={{
                        position: 'absolute', inset: 0, backgroundColor: 'rgba(59,130,246,0.3)',
                        borderWidth: 2, borderColor: '#3B82F6', alignItems: 'flex-end', padding: 4
                    }}>
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{selIdx + 1}</Text>
                        </View>
                    </View>
                ) : (
                    <View style={{
                        position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11,
                        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(0,0,0,0.2)'
                    }} />
                )}
            </TouchableOpacity>
        );
    }, [selected, selectedUris]);

    const MONTHS_RU = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    ];

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        const firstAsset = viewableItems.find(
            (v: any) => v.item !== 'camera' && v.item?.creationTime
        );
        if (firstAsset) {
            const d = new Date(firstAsset.item.creationTime);
            const label = `${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`;
            setCurrentDate(label);
        }
    }).current;

    // ─── Кастомный скроллбар ──────────────────────────────────────
    const TRACK_HEIGHT = 200;
    const THUMB_H = 40;
    const scrollInfo = useRef({ contentH: 1, containerH: 0, scrollY: 0 });
    const thumbY = useRef(new Animated.Value(0)).current;
    const dateLabelOpacity = useRef(new Animated.Value(0)).current;
    const isDraggingRef = useRef(false);
    const thumbStartY = useRef(0);

    function updateThumbFromScroll(y: number) {
        const { contentH, containerH } = scrollInfo.current;
        const maxScroll = Math.max(contentH - containerH, 1);
        const pct = Math.min(y / maxScroll, 1);
        thumbY.setValue(pct * (TRACK_HEIGHT - THUMB_H));
    }

    const scrubPan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                isDraggingRef.current = true;
                // Сохраняем текущую позицию ползунка
                (thumbY as any)._value !== undefined
                    ? (thumbStartY.current = (thumbY as any)._value)
                    : (thumbStartY.current = 0);
                dateLabelOpacity.setValue(1);
            },
            onPanResponderMove: (_, g) => {
                const { contentH, containerH } = scrollInfo.current;
                const maxScroll = Math.max(contentH - containerH, 1);
                const newY = Math.max(0, Math.min(thumbStartY.current + g.dy, TRACK_HEIGHT - THUMB_H));
                const pct = newY / (TRACK_HEIGHT - THUMB_H);
                thumbY.setValue(newY);
                flatListRef.current?.scrollToOffset({
                    offset: pct * maxScroll,
                    animated: false,
                });
            },
            onPanResponderRelease: () => {
                isDraggingRef.current = false;
                Animated.timing(dateLabelOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            },
        })
    ).current;



    const data: ('camera' | MediaLibrary.Asset)[] = ['camera', ...assets];

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={visible ? 0 : -1}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            enablePanDownToClose={true}
            onChange={handleSheetChanges}
            backgroundStyle={{ backgroundColor: '#111', borderRadius: 24 }}
            handleIndicatorStyle={{
                backgroundColor: '#555',
                width: 36,
                height: 4,
            }}
            handleStyle={{
                backgroundColor: '#111',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingVertical: 10,
            }}
        >
            {/* Шапка шторки */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingTop: 4,
                paddingBottom: 12,
                backgroundColor: '#111',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
            }}>
                <Text style={{ color: '#999', fontSize: 14 }}>
                    {hasPermission === false ? 'Нет доступа' : `Выбрано: ${selected.length}/${maxPhotos}`}
                </Text>
                <TouchableOpacity
                    onPress={() => bottomSheetRef.current?.close()}
                    style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20
                    }}
                >
                    <Check size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Добавить</Text>
                </TouchableOpacity>
            </View>

            {/* Контент списка */}
            {hasPermission === false ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#777' }}>Нужен доступ к фото</Text>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {/* Плавающая метка даты + скроллбар (только в развёрнутом режиме) */}
                    {isExpanded && (
                        <>
                            <Animated.View
                                pointerEvents="none"
                                style={{
                                    position: 'absolute', right: 28, zIndex: 11,
                                    backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 12,
                                    paddingVertical: 6, borderRadius: 14,
                                    opacity: dateLabelOpacity,
                                    transform: [{ translateY: thumbY }],
                                }}
                            >
                                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                                    {currentDate}
                                </Text>
                            </Animated.View>

                            <View
                                style={{
                                    position: 'absolute', right: 4, top: 8,
                                    width: 20, height: TRACK_HEIGHT,
                                    zIndex: 10, justifyContent: 'flex-start',
                                }}
                            >
                                <View style={{
                                    position: 'absolute', left: 8, top: 0, bottom: 0,
                                    width: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2,
                                }} />
                                <Animated.View
                                    {...scrubPan.panHandlers}
                                    style={{
                                        position: 'absolute', left: 2, width: 16, height: THUMB_H,
                                        backgroundColor: 'rgba(100,100,100,0.8)', borderRadius: 8,
                                        transform: [{ translateY: thumbY }],
                                    }}
                                />
                            </View>
                        </>
                    )}

                    <BottomSheetFlatList
                        ref={flatListRef as any}
                        data={data}
                        renderItem={renderItem}
                        keyExtractor={(item: 'camera' | MediaLibrary.Asset) => item === 'camera' ? 'camera' : item.id}
                        numColumns={COLUMNS}
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.5}
                        showsVerticalScrollIndicator={false}
                        viewabilityConfig={viewabilityConfig}
                        onViewableItemsChanged={onViewableItemsChanged}
                        onScroll={(e: any) => {
                            const y = e.nativeEvent.contentOffset.y;
                            const cH = e.nativeEvent.contentSize.height;
                            const lH = e.nativeEvent.layoutMeasurement.height;
                            scrollInfo.current = { contentH: cH, containerH: lH, scrollY: y };
                            if (!isDraggingRef.current) updateThumbFromScroll(y);
                        }}
                        scrollEventThrottle={16}
                        contentContainerStyle={{
                            padding: GAP / 2,
                            paddingBottom: Platform.OS === 'ios' ? 60 : 40
                        }}
                    />
                </View>
            )}
        </BottomSheet>
    );
}