import { useRubricsStore } from '@/src/store/rubricsStore';
import { useThemeStore } from '@/src/store/themeStore';
import { MapViewRef, Report } from '@/src/types';
import { CityBoundaryData, fetchCityBoundary } from '@/src/utils/fetchCityBoundary';
import { generateCloudyHole } from '@/src/utils/generateCloudyHole';
import { generateCloudyPolygon } from '@/src/utils/generateCloudyPolygon';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RNMapView, { Marker, Polygon, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';



interface MapViewProps {

    reports: Report[];

    selectedCoordinate?: { latitude: number; longitude: number } | null;

    onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;

    onMarkerPress?: (reports: Report[]) => void;

    initialRegion?: {

        latitude: number;

        longitude: number;

        latitudeDelta: number;

        longitudeDelta: number;

    };

}



const DEFAULT_REGION = {

    latitude: 53.20,

    longitude: 50.15,

    latitudeDelta: 0.05,

    longitudeDelta: 0.05,

};



const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);



const AnimatedFogOverlay = React.memo(function AnimatedFogOverlay({ isDark, cityBoundary }: { isDark: boolean; cityBoundary: CityBoundaryData | null }) {

    const fogBaseCoords = React.useMemo(() => {

        const centerLat = cityBoundary?.center?.latitude ?? DEFAULT_REGION.latitude;

        const centerLng = cityBoundary?.center?.longitude ?? DEFAULT_REGION.longitude;

        // Региональные координаты полигона для предотвращения падений нативной карты

        return [

            { latitude: centerLat + 10.0, longitude: centerLng - 15.0 },

            { latitude: centerLat + 10.0, longitude: centerLng + 15.0 },

            { latitude: centerLat - 10.0, longitude: centerLng + 15.0 },

            { latitude: centerLat - 10.0, longitude: centerLng - 15.0 },

        ];

    }, [cityBoundary]);



    const holeConfig = React.useMemo(() => {

        if (!cityBoundary) {

            // Запасной вариант - круг при ошибке получения границ

            return generateCloudyHole(

                DEFAULT_REGION.latitude,

                DEFAULT_REGION.longitude,

                0.15,

                40

            );

        }



        // Сглаживание границы города алгоритмом Chaikin'a

        return generateCloudyPolygon(cityBoundary.coords, 4);

    }, [cityBoundary]);



    // Цвет тумана

    const fogColorHex = isDark ? '#111827' : '#6B7280';



    return (

        <Polygon

            coordinates={fogBaseCoords}

            holes={[holeConfig]}

            fillColor={fogColorHex}

            strokeColor="transparent"

            strokeWidth={0}

        />

    );

});



export const AppMapView = forwardRef<MapViewRef, MapViewProps>(({

    reports,

    selectedCoordinate,

    onMapPress,

    onMarkerPress,

    initialRegion = DEFAULT_REGION,

}, ref) => {

    const mapRef = useRef<RNMapView>(null);

    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const visibilityArea = useThemeStore((s) => s.visibilityArea);
    const city = useThemeStore((s) => s.city);

    const [cityBoundary, setCityBoundary] = useState<CityBoundaryData | null>(null);

    const [isMapLoading, setIsMapLoading] = useState(true);

    const [mapError, setMapError] = useState<string | null>(null);



        // Загрузка реальных границ города из OSM

    useEffect(() => {

        fetchCityBoundary(city).then(data => {

            if (data && data.coords.length > 0) {

                setCityBoundary(data);

                // Центрирование карты на геометрическом центре полигона

                mapRef.current?.animateToRegion({

                    latitude: data.center.latitude,

                    longitude: data.center.longitude,

                    latitudeDelta: 0.1,

                    longitudeDelta: 0.1

                }, 1000);

            }

        });

    }, [city]);



    useImperativeHandle(ref, () => ({

        zoomIn: async () => {

            const camera = await mapRef.current?.getCamera();

            if (camera && mapRef.current) {

                mapRef.current.animateCamera({

                    ...camera,

                    zoom: (camera.zoom ?? 13) + 1,

                }, { duration: 300 });

            }

        },

        zoomOut: async () => {

            const camera = await mapRef.current?.getCamera();

            if (camera && mapRef.current) {

                mapRef.current.animateCamera({

                    ...camera,

                    zoom: (camera.zoom ?? 13) - 1,

                }, { duration: 300 });

            }

        },

        goToLocation: (lat: number, lng: number) => {

            mapRef.current?.animateToRegion({

                latitude: lat,

                longitude: lng,

                latitudeDelta: 0.01,

                longitudeDelta: 0.01,

            }, 500);

        },

    }));



    // Кластеризация жалоб по координатам

    const clusters = React.useMemo(() => {

        const grouped: Record<string, Report[]> = {};

        reports.forEach((r) => {

            const key = `${r.latitude.toFixed(3)}-${r.longitude.toFixed(3)}`;

            if (!grouped[key]) grouped[key] = [];

            grouped[key].push(r);

        });

        return Object.values(grouped);

    }, [reports]);



    useEffect(() => {

        if (!mapRef.current) return;



        if (visibilityArea) {

            // Вычисление центра города для ограничения камеры

            let centerLat = initialRegion.latitude;

            let centerLng = initialRegion.longitude;



            if (cityBoundary && cityBoundary.coords.length > 0) {

                centerLat = cityBoundary.center.latitude;

                centerLng = cityBoundary.center.longitude;

            }



            mapRef.current.setMapBoundaries(

                { latitude: centerLat + 2.0, longitude: centerLng + 3.0 },
                { latitude: centerLat - 2.0, longitude: centerLng - 3.0 }

            );

        } else {
            (mapRef.current as any)?.setMapBoundaries(null, null);

        }

    }, [visibilityArea, cityBoundary, initialRegion]);



    const handleMapLoad = () => {

        setIsMapLoading(false);

        setMapError(null);

    };



    const handleTileError = () => {

        console.warn('Map tiles failed to load');

        setMapError('Не удалось загрузить карту. Проверьте подключение к интернету.');

        setIsMapLoading(false);

    };



    const handleRetry = () => {

        setIsMapLoading(true);

        setMapError(null);

        // Принудительная перезагрузка карты

        setTimeout(() => {

            setIsMapLoading(false);

        }, 1000);

    };



    return (

        <View style={{ flex: 1, position: 'relative' }}>

            {/* Индикатор загрузки */}

            {isMapLoading && (

                <View style={{

                    position: 'absolute',

                    top: 0,

                    left: 0,

                    right: 0,

                    bottom: 0,

                    backgroundColor: isDarkMode ? '#111827' : '#F3F4F6',

                    justifyContent: 'center',

                    alignItems: 'center',

                    zIndex: 1000

                }}>

                    <ActivityIndicator

                        size="large"

                        color={isDarkMode ? '#FFFFFF' : '#111827'}

                        style={{ marginBottom: 16 }}

                    />

                    <Text style={{

                        color: isDarkMode ? '#FFFFFF' : '#111827',

                        fontSize: 16

                    }}>

                        Загрузка карты...

                    </Text>

                </View>

            )}



            {/* Сообщение об ошибке */}

            {mapError && (

                <View style={{

                    position: 'absolute',

                    top: 0,

                    left: 0,

                    right: 0,

                    bottom: 0,

                    backgroundColor: isDarkMode ? '#111827' : '#F3F4F6',

                    justifyContent: 'center',

                    alignItems: 'center',

                    zIndex: 1000,

                    padding: 20

                }}>

                    <Text style={{

                        color: '#EF4444',

                        fontSize: 16,

                        marginBottom: 16,

                        textAlign: 'center'

                    }}>

                        {mapError}

                    </Text>

                    <TouchableOpacity

                        onPress={handleRetry}

                        style={{

                            backgroundColor: '#3B82F6',

                            paddingHorizontal: 24,

                            paddingVertical: 12,

                            borderRadius: 8

                        }}

                    >

                        <Text style={{

                            color: 'white',

                            fontSize: 14,

                            fontWeight: '600'

                        }}>

                            Попробовать снова

                        </Text>

                    </TouchableOpacity>

                </View>

            )}



            <RNMapView

                ref={mapRef}

                style={StyleSheet.absoluteFillObject}

                provider={PROVIDER_DEFAULT}

                initialRegion={initialRegion}

                minZoomLevel={visibilityArea ? 10 : undefined}

                onMapReady={handleMapLoad}

                onPress={(e) => {

                    if (e.nativeEvent.action !== 'marker-press') {

                        onMapPress?.(e.nativeEvent.coordinate);

                    }

                }}

                showsUserLocation={true}

                showsMyLocationButton={false}

                zoomControlEnabled={false}

            >

                {/* OpenStreetMap через CartoDB CDN */}

                <UrlTile

                    urlTemplate={"https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"}

                    maximumZ={19}

                    flipY={false}

                />



                {visibilityArea && <AnimatedFogOverlay isDark={isDarkMode} cityBoundary={cityBoundary} />}



                {clusters.map((cluster, i) => {

                    const main = cluster[0];

                    const cat = useRubricsStore.getState().getRubric(main.rubric_name);



                    return (

                        <Marker

                            key={`marker-${main.latitude}-${main.longitude}`}

                            coordinate={{ latitude: main.latitude, longitude: main.longitude }}

                            title={cluster.length > 1 ? `${cluster.length} жалоб` : main.title}

                            description={main.address}

                            pinColor={cat?.color || '#FF3B30'}

                            onPress={() => onMarkerPress?.(cluster)}

                            tracksViewChanges={false}

                        />

                    );

                })}



                {/* Selected point marker */}

                {selectedCoordinate && (

                    <Marker

                        key={`selected-${selectedCoordinate.latitude}-${selectedCoordinate.longitude}`}

                        coordinate={selectedCoordinate}

                        pinColor="#2563EB"

                        title="Новая метка"

                        tracksViewChanges={false}

                    />

                )}

            </RNMapView>

        </View>

    );

});

