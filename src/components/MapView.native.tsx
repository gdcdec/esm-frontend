import { useFogLayer } from '@/src/hooks/map/useFogLayer';
import { useRubricsStore } from '@/src/store/rubricsStore';
import { useThemeStore } from '@/src/store/themeStore';
import { MapViewRef, Report } from '@/src/types';
import { CityBoundaryData, fetchCityBoundary } from '@/src/utils/fetchCityBoundary';
import MapLibreGL from '@maplibre/maplibre-react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

MapLibreGL.setAccessToken(null);

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

const DEFAULT_CENTER = {
    latitude: 53.20,
    longitude: 50.15,
};

const mapStyle = {
    version: 8,
    sources: {
        'cartodb-tiles': {
            type: 'raster',
            tiles: ['https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
        },
    },
    layers: [
        {
            id: 'cartodb-layer',
            type: 'raster',
            source: 'cartodb-tiles',
            minzoom: 0,
            maxzoom: 22,
        },
    ],
};

export const AppMapView = forwardRef<MapViewRef, MapViewProps>(({
    reports,
    selectedCoordinate,
    onMapPress,
    onMarkerPress,
    initialRegion,
}, ref) => {
    const cameraRef = useRef<React.ElementRef<typeof MapLibreGL.Camera>>(null);
    const mapRef = useRef<React.ElementRef<typeof MapLibreGL.MapView>>(null);
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const visibilityArea = useThemeStore((s) => s.visibilityArea);
    const city = useThemeStore((s) => s.city);
    const insets = useSafeAreaInsets();

    const [cityBoundary, setCityBoundary] = useState<CityBoundaryData | null>(null);

    // Загрузка реальных границ города из OSM
    useEffect(() => {
        if (city) {
            fetchCityBoundary(city).then(data => {
                if (data && data.coords.length > 0) {
                    setCityBoundary(data);
                    cameraRef.current?.setCamera({
                        centerCoordinate: [data.center.longitude, data.center.latitude],
                        zoomLevel: 11,
                        animationDuration: 1000,
                    });
                }
            });
        }
    }, [city]);

    useImperativeHandle(ref, () => ({
        zoomIn: async () => {
            const currentZoom = await mapRef.current?.getZoom();
            if (currentZoom !== undefined) {
                cameraRef.current?.setCamera({
                    zoomLevel: Math.min(currentZoom + 1, 22),
                    animationDuration: 300,
                });
            }
        },
        zoomOut: async () => {
            const currentZoom = await mapRef.current?.getZoom();
            if (currentZoom !== undefined) {
                cameraRef.current?.setCamera({
                    zoomLevel: Math.max(currentZoom - 1, 0),
                    animationDuration: 300,
                });
            }
        },
        goToLocation: (lat: number, lng: number) => {
            cameraRef.current?.setCamera({
                centerCoordinate: [lng, lat],
                zoomLevel: 16,
                animationDuration: 1000,
            });
        },
    }));

    // Кластеризация жалоб по координатам
    const clusters = useMemo(() => {
        const grouped: Record<string, Report[]> = {};
        reports.forEach((r) => {
            const key = `${r.latitude.toFixed(3)}-${r.longitude.toFixed(3)}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(r);
        });
        return Object.values(grouped);
    }, [reports]);

    const center = initialRegion
        ? { latitude: initialRegion.latitude, longitude: initialRegion.longitude }
        : DEFAULT_CENTER;

    const { fogGeoJSON, fogLayerStyle } = useFogLayer({
        cityBoundary,
        center,
        isDarkMode,
    });

    const maxBounds = useMemo(() => {
        if (visibilityArea && cityBoundary) {
            return {
                sw: [cityBoundary.center.longitude - 3.0, cityBoundary.center.latitude - 2.0],
                ne: [cityBoundary.center.longitude + 3.0, cityBoundary.center.latitude + 2.0],
            };
        }
        return undefined;
    }, [visibilityArea, cityBoundary]);

    return (
        <View style={{ flex: 1, position: 'relative' }}>
            <MapLibreGL.MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                mapStyle={JSON.stringify(mapStyle)}
                logoEnabled={false}
                attributionEnabled={false}
                compassEnabled={true}
                compassViewPosition={2}
                compassViewMargins={{ x: 16, y: Math.max(insets.top, 16) + 16 }}
                onPress={(feature) => {
                    const coords = (feature.geometry as any).coordinates as number[];
                    onMapPress?.({ latitude: coords[1], longitude: coords[0] });
                }}
            >
                <MapLibreGL.Camera
                    ref={cameraRef}
                    defaultSettings={{
                        centerCoordinate: [center.longitude, center.latitude],
                        zoomLevel: 13,
                    }}
                    maxBounds={maxBounds}
                    minZoomLevel={visibilityArea ? 10 : undefined}
                />

                <MapLibreGL.UserLocation showsUserHeadingIndicator />

                {visibilityArea && (
                    <MapLibreGL.ShapeSource id="fog-source" shape={fogGeoJSON as any}>
                        <MapLibreGL.FillLayer
                            id="fog-layer"
                            style={{
                                fillColor: isDarkMode ? '#111827' : '#6B7280',
                                fillOpacity: 1
                            }}
                        />
                    </MapLibreGL.ShapeSource>
                )}

                {clusters.map((cluster) => {
                    const main = cluster[0];
                    const cat = useRubricsStore.getState().getRubric(main.rubric_name);
                    const color = cat?.color || '#FF3B30';
                    const isMulti = cluster.length > 1;

                    return (
                        <MapLibreGL.PointAnnotation
                            key={`marker-${main.latitude}-${main.longitude}`}
                            id={`marker-${main.latitude}-${main.longitude}`}
                            coordinate={[main.longitude, main.latitude]}
                            onSelected={() => onMarkerPress?.(cluster)}
                        >
                            <View style={[styles.markerContainer, { backgroundColor: color }]}>
                                {isMulti && (
                                    <Text style={styles.markerText}>
                                        {cluster.length}
                                    </Text>
                                )}
                            </View>
                        </MapLibreGL.PointAnnotation>
                    );
                })}

                {selectedCoordinate && (
                    <MapLibreGL.PointAnnotation
                        key={`selected-${selectedCoordinate.latitude}-${selectedCoordinate.longitude}`}
                        id="selected"
                        coordinate={[selectedCoordinate.longitude, selectedCoordinate.latitude]}
                    >
                        <View style={styles.selectedMarker} />
                    </MapLibreGL.PointAnnotation>
                )}
            </MapLibreGL.MapView>
        </View>
    );
});

AppMapView.displayName = 'AppMapView';

const styles = StyleSheet.create({
    markerContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    markerText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    selectedMarker: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#2563EB',
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
});
