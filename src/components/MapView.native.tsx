import { CATEGORIES } from '@/src/constants/categories';
import { Report } from '@/src/types';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import RNMapView, { Marker, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';

export interface MapViewRef {
    zoomIn: () => void;
    zoomOut: () => void;
    goToLocation: (lat: number, lng: number) => void;
}

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

export const AppMapView = forwardRef<MapViewRef, MapViewProps>(({
    reports,
    selectedCoordinate,
    onMapPress,
    onMarkerPress,
    initialRegion = DEFAULT_REGION,
}, ref) => {
    const mapRef = useRef<RNMapView>(null);

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

    // Group reports by coordinates for clustering
    const clusters = React.useMemo(() => {
        const grouped: Record<string, Report[]> = {};
        reports.forEach((r) => {
            const key = `${r.lat.toFixed(3)}-${r.long.toFixed(3)}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(r);
        });
        return Object.values(grouped);
    }, [reports]);

    return (
        <RNMapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_DEFAULT}
            initialRegion={initialRegion}
            onPress={(e) => onMapPress?.(e.nativeEvent.coordinate)}
            showsUserLocation
            showsMyLocationButton={false}
            zoomControlEnabled={false}
        >
            {/* CartoDB CDN tiles (OSM blocks direct access without User-Agent) */}
            <UrlTile
                urlTemplate="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"
                maximumZ={19}
                flipY={false}
            />

            {clusters.map((cluster, i) => {
                const main = cluster[0];
                const cat = CATEGORIES.find((c) => c.id === main.category);

                return (
                    <Marker
                        key={i}
                        coordinate={{ latitude: main.lat, longitude: main.long }}
                        title={cluster.length > 1 ? `${cluster.length} жалоб` : main.title}
                        description={main.address}
                        pinColor={cat?.color || '#FF3B30'}
                        onPress={() => onMarkerPress?.(cluster)}
                    />
                );
            })}

            {/* Selected point marker */}
            {selectedCoordinate && (
                <Marker
                    coordinate={selectedCoordinate}
                    pinColor="#2563EB"
                    title="Новая метка"
                />
            )}
        </RNMapView>
    );
});
