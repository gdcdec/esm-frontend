import { useFogLayer } from '@/src/hooks/map/useFogLayer';
import { useRubricsStore } from '@/src/store/rubricsStore';
import { useThemeStore } from '@/src/store/themeStore';
import { MapViewRef, Report } from '@/src/types';
import { CityBoundaryData, fetchCityBoundary } from '@/src/utils/fetchCityBoundary';
import MapLibreGL from '@maplibre/maplibre-react-native';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
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

const mapStyle = "https://api.maptiler.com/maps/019d8dc2-4ad4-79d7-a0b4-f4aebd8c2037/style.json?key=l3jbXX46p28c4ZuP3QGb";

const INITIAL_CAMERA_SETTINGS = {
    centerCoordinate: [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude] as [number, number],
    zoomLevel: 13,
};

const AppMapViewInner = forwardRef<MapViewRef, MapViewProps>(({
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

    const onMapPressRef = useRef(onMapPress);
    const onMarkerPressRef = useRef(onMarkerPress);
    useEffect(() => {
        onMapPressRef.current = onMapPress;
        onMarkerPressRef.current = onMarkerPress;
    });

    // Загрузка реальных границ города из OSM
    useEffect(() => {
        if (city) {
            fetchCityBoundary(city).then(data => {
                if (data && data.coords.length > 0) {
                    setCityBoundary(data);
                    setFlyTarget({ center: [data.center.longitude, data.center.latitude], zoom: 11, duration: 1000 });
                    currentZoomRef.current = 11;
                }
            });
        }
    }, [city]);

    const currentZoomRef = useRef(13);
    const flyTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const [flyTarget, setFlyTarget] = useState<{
        center: [number, number];
        zoom: number;
        duration: number;
    } | null>(null);

    useEffect(() => {
        if (flyTarget) {
            if (flyTimeoutRef.current) clearTimeout(flyTimeoutRef.current);
            flyTimeoutRef.current = setTimeout(() => setFlyTarget(null), flyTarget.duration + 200);
        }
        return () => {
            if (flyTimeoutRef.current) clearTimeout(flyTimeoutRef.current);
        };
    }, [flyTarget]);

    const center = initialRegion
        ? { latitude: initialRegion.latitude, longitude: initialRegion.longitude }
        : DEFAULT_CENTER;

    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            const newZoom = Math.min(currentZoomRef.current + 1, 22);
            cameraRef.current?.setCamera({
                zoomLevel: newZoom,
                animationDuration: 300,
                animationMode: 'easeTo',
            });
            currentZoomRef.current = newZoom;
        },
        zoomOut: () => {
            const minZoom = visibilityArea ? 10 : 0;
            const newZoom = Math.max(currentZoomRef.current - 1, minZoom);
            cameraRef.current?.setCamera({
                zoomLevel: newZoom,
                animationDuration: 300,
                animationMode: 'easeTo',
            });
            currentZoomRef.current = newZoom;
        },
        goToLocation: (lat: number, lng: number) => {
            setFlyTarget({ center: [lng, lat], zoom: 16, duration: 1000 });
            currentZoomRef.current = 16;
        },
    }), [visibilityArea]);

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

    const margins = useMemo(() => ({ x: 16, y: Math.max(insets.top, 16) + 16 }), [insets.top]);

    const handleRegionDidChange = useCallback((feature: any) => {
        const zoom = feature?.properties?.zoomLevel;
        if (typeof zoom === 'number') {
            currentZoomRef.current = zoom;
        }
    }, []);

    const handlePress = useCallback((feature: any) => {
        const coords = (feature.geometry as any).coordinates as number[];
        onMapPressRef.current?.({ latitude: coords[1], longitude: coords[0] });
    }, []);

    const handleMarkerSelected = useCallback((cluster: Report[]) => {
        onMarkerPressRef.current?.(cluster);
    }, []);



    return (
        <View
            style={{ flex: 1, position: 'relative' }}
            onTouchStart={() => { if (flyTarget) setFlyTarget(null); }}
        >
            <MapLibreGL.MapView
                key={visibilityArea ? 'bounded' : 'unbounded'}
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                mapStyle={mapStyle}
                logoEnabled={false}
                attributionEnabled={false}
                compassEnabled={true}
                compassViewPosition={1}
                compassViewMargins={margins}
                onRegionDidChange={handleRegionDidChange}
                onPress={handlePress}
            >
                <MapLibreGL.Camera
                    ref={cameraRef}
                    defaultSettings={INITIAL_CAMERA_SETTINGS}
                    centerCoordinate={flyTarget?.center}
                    zoomLevel={flyTarget?.zoom}
                    animationDuration={flyTarget?.duration}
                    animationMode={flyTarget ? 'easeTo' : undefined}
                    maxBounds={maxBounds}
                    minZoomLevel={visibilityArea ? 10 : 0}
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
                            onSelected={() => handleMarkerSelected(cluster)}
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

export const AppMapView = React.memo(AppMapViewInner, (prev, next) => {
    return (
        prev.reports === next.reports &&
        prev.selectedCoordinate === next.selectedCoordinate &&
        prev.initialRegion === next.initialRegion
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
