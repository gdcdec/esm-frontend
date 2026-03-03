import { CATEGORIES } from '@/src/constants/categories';
import { useThemeStore } from '@/src/store/themeStore';
import { Report } from '@/src/types';
import { calculateCentroid, fetchCityBoundary, GeoCoordinate } from '@/src/utils/fetchCityBoundary';
import { generateCloudyHole } from '@/src/utils/generateCloudyHole';
import { generateCloudyPolygon } from '@/src/utils/generateCloudyPolygon';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import RNMapView, { Marker, Polygon, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';

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

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

function AnimatedFogOverlay({ isDark, cityBoundary }: { isDark: boolean; cityBoundary: GeoCoordinate[] | null }) {
    const [cloudPhase, setCloudPhase] = useState(0);

    const fogBaseCoords = React.useMemo(() => {
        const centerLat = cityBoundary?.[0]?.latitude ?? DEFAULT_REGION.latitude;
        const centerLng = cityBoundary?.[0]?.longitude ?? DEFAULT_REGION.longitude;
        // Regional polygon coords to avoid native map crashes, large enough to cover the camera bounds
        return [
            { latitude: centerLat + 10.0, longitude: centerLng - 15.0 },
            { latitude: centerLat + 10.0, longitude: centerLng + 15.0 },
            { latitude: centerLat - 10.0, longitude: centerLng + 15.0 },
            { latitude: centerLat - 10.0, longitude: centerLng - 15.0 },
        ];
    }, [cityBoundary]);

    // Shape animation (creeping cloudy edges) - Fast & smooth frame interval
    useEffect(() => {
        const interval = setInterval(() => {
            // Animate phase endlessly to shift the sine-wave clouds
            setCloudPhase((prev) => prev + 0.05); // Smaller step, faster interval
        }, 32); // 30 FPS approx
        return () => clearInterval(interval);
    }, []);

    // Generate fluffy polygon applying to the REAL city string bounds or fallback if fetch fails
    const holeConfig = React.useMemo(() => {
        if (!cityBoundary) {
            // Fallback to CCW circle if nominatim fails
            return generateCloudyHole(
                DEFAULT_REGION.latitude,
                DEFAULT_REGION.longitude,
                0.15,
                cloudPhase,
                40
            );
        }

        // Pass the OSM boundary array through the noise generator
        return generateCloudyPolygon(cityBoundary, cloudPhase, 0.005);
    }, [cityBoundary, cloudPhase]);

    // Solid fog colors
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
}

export const AppMapView = forwardRef<MapViewRef, MapViewProps>(({
    reports,
    selectedCoordinate,
    onMapPress,
    onMarkerPress,
    initialRegion = DEFAULT_REGION,
}, ref) => {
    const mapRef = useRef<RNMapView>(null);
    const { isDarkMode, fogOfWar, city } = useThemeStore();
    const [cityBoundary, setCityBoundary] = useState<GeoCoordinate[] | null>(null);

    // Fetch the real OSM boundaries of the user's city dynamically
    useEffect(() => {
        fetchCityBoundary(city).then(coords => {
            if (coords && coords.length > 0) {
                setCityBoundary(coords);
                // Center map to the true centroid of the new polygon
                const centroid = calculateCentroid(coords);

                mapRef.current?.animateToRegion({
                    latitude: centroid.latitude,
                    longitude: centroid.longitude,
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

    // Group reports by coordinates for clustering
    const clusters = React.useMemo(() => {
        const grouped: Record<string, Report[]> = {};
        reports.forEach((r) => {
            const key = `${r.latitude.toFixed(3)}-${r.longitude.toFixed(3)}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(r);
        });
        return Object.values(grouped);
    }, [reports]);

    // Lock camera bounds so user cannot pan outside the Fog polygon natively
    // We update this via ref whenever the configuration changes.
    useEffect(() => {
        if (!mapRef.current) return;

        if (fogOfWar) {
            // Calculate the true geometric centroid of the city to apply accurate camera bounds
            let centerLat = initialRegion.latitude;
            let centerLng = initialRegion.longitude;

            if (cityBoundary && cityBoundary.length > 0) {
                const centroid = calculateCentroid(cityBoundary);
                centerLat = centroid.latitude;
                centerLng = centroid.longitude;
            }

            mapRef.current.setMapBoundaries(
                { latitude: centerLat + 2.0, longitude: centerLng + 3.0 }, // NorthEast
                { latitude: centerLat - 2.0, longitude: centerLng - 3.0 }  // SouthWest
            );
        } else {
            // Unlock bounding box completely if fog is disabled
            // Passing null allows the native map engine to clear constraints completely without math freeze
            // @ts-ignore
            mapRef.current.setMapBoundaries(null, null);
        }
    }, [fogOfWar, cityBoundary, initialRegion]);

    return (
        <RNMapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_DEFAULT}
            initialRegion={initialRegion}
            minZoomLevel={fogOfWar ? 10 : undefined}
            onPress={(e) => {
                if (e.nativeEvent.action !== 'marker-press') {
                    onMapPress?.(e.nativeEvent.coordinate);
                }
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            zoomControlEnabled={false}
        >
            {/* OpenStreetMap tiles via CartoDB CDN (avoids OSM 403 block) почему-то меня блокирует osm заменил https://tile.openstreetmap.org/{z}/{x}/{y}.png на это, надо думать*/}
            <UrlTile
                urlTemplate={isDarkMode ? "https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png" : "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"}
                maximumZ={19}
                flipY={false}
            />

            {fogOfWar && <AnimatedFogOverlay isDark={isDarkMode} cityBoundary={cityBoundary} />}

            {clusters.map((cluster, i) => {
                const main = cluster[0];
                const cat = CATEGORIES.find((c) => c.name === main.rubric_name);

                return (
                    <Marker
                        key={i}
                        coordinate={{ latitude: main.latitude, longitude: main.longitude }}
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
