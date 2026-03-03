import { CATEGORIES } from '@/src/constants/categories';
import { useThemeStore } from '@/src/store/themeStore';
import { Report } from '@/src/types';
import { calculateCentroid, fetchCityBoundary, GeoCoordinate } from '@/src/utils/fetchCityBoundary';
import { generateCloudyHole } from '@/src/utils/generateCloudyHole';
import { generateCloudyPolygon } from '@/src/utils/generateCloudyPolygon';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

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

const DEFAULT_CENTER: [number, number] = [53.20, 50.15];
const DEFAULT_ZOOM = 13;

export const AppMapView = forwardRef<MapViewRef, MapViewProps>(({
    reports,
    selectedCoordinate,
    onMapPress,
    onMarkerPress,
    initialRegion,
}, ref) => {
    const [LeafletComponents, setLeafletComponents] = useState<any>(null);
    const mapInstanceRef = useRef<any>(null);
    const { isDarkMode, fogOfWar, city } = useThemeStore();
    const [cloudPhase, setCloudPhase] = useState(0);
    const [cityBoundary, setCityBoundary] = useState<GeoCoordinate[] | null>(null);

    const center: [number, number] = initialRegion
        ? [initialRegion.latitude, initialRegion.longitude]
        : DEFAULT_CENTER;

    // Fetch the real OSM boundaries of the user's city on mount or change
    useEffect(() => {
        fetchCityBoundary(city).then(coords => {
            if (coords && coords.length > 0) {
                setCityBoundary(coords);
                if (mapInstanceRef.current) {
                    const centroid = calculateCentroid(coords);
                    mapInstanceRef.current.flyTo([centroid.latitude, centroid.longitude], DEFAULT_ZOOM);
                }
            }
        });
    }, [city]);

    // Run interval to creep clouds over time at a fast frame rate
    useEffect(() => {
        if (!fogOfWar) return;
        const interval = setInterval(() => {
            setCloudPhase((prev) => prev + 0.05);
        }, 32);
        return () => clearInterval(interval);
    }, [fogOfWar]);

    const fogBaseCoords = React.useMemo(() => {
        const centerLat = cityBoundary?.[0]?.latitude ?? center[0];
        const centerLng = cityBoundary?.[0]?.longitude ?? center[1];
        return [
            [centerLat + 10.0, centerLng - 15.0],
            [centerLat + 10.0, centerLng + 15.0],
            [centerLat - 10.0, centerLng + 15.0],
            [centerLat - 10.0, centerLng - 15.0],
        ] as [number, number][];
    }, [cityBoundary, center]);

    const holeBoundary = React.useMemo(() => {
        if (!cityBoundary) {
            return generateCloudyHole(
                DEFAULT_CENTER[0],
                DEFAULT_CENTER[1],
                0.15,
                cloudPhase,
                40
            ).map(pt => [pt.latitude, pt.longitude]) as [number, number][];
        }

        return generateCloudyPolygon(cityBoundary, cloudPhase, 0.005)
            .map(pt => [pt.latitude, pt.longitude]) as [number, number][];
    }, [cityBoundary, cloudPhase]);

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

    // Expose zoom methods via ref
    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            const map = mapInstanceRef.current;
            if (map) map.setZoom(map.getZoom() + 1);
        },
        zoomOut: () => {
            const map = mapInstanceRef.current;
            if (map) map.setZoom(map.getZoom() - 1);
        },
        goToLocation: (lat: number, lng: number) => {
            const map = mapInstanceRef.current;
            if (map) map.flyTo([lat, lng], 16);
        },
    }));

    // Dynamically import Leaflet only on client side
    useEffect(() => {
        let cancelled = false;

        async function loadLeaflet() {
            const L = await import('leaflet');
            const RL = await import('react-leaflet');

            // Load leaflet CSS
            if (!document.querySelector('link[href*="leaflet.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }

            if (!cancelled) {
                setLeafletComponents({ L: L.default || L, RL });
            }
        }

        loadLeaflet();
        return () => { cancelled = true; };
    }, []);

    if (!LeafletComponents) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB' }}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={{ marginTop: 12, color: '#6B7280' }}>Загрузка карты...</Text>
            </View>
        );
    }

    const { L, RL } = LeafletComponents;
    const { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents, useMap } = RL;

    // Create custom colored marker icons
    const createIcon = (color: string) =>
        new L.DivIcon({
            html: `<div style="
        width: 30px; height: 30px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>`,
            className: '',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30],
        });

    const clusterIcon = (count: number) =>
        new L.DivIcon({
            html: `<div style="
        width: 36px; height: 36px;
        background: #2563EB;
        border: 3px solid white;
        border-radius: 50%;
        color: white;
        font-weight: bold;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(37,99,235,0.4);
      ">${count}</div>`,
            className: '',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
        });

    const selectedPinIcon = new L.DivIcon({
        html: `<div style="position:relative">
            <div style="
                width: 32px; height: 32px;
                background: #2563EB;
                border: 3px solid white;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 2px 8px rgba(37,99,235,0.5);
            "></div>
            <div style="
                position: absolute;
                top: -4px; left: -4px;
                width: 40px; height: 40px;
                border-radius: 50%;
                background: rgba(37,99,235,0.2);
                animation: pulse 1.5s infinite;
            "></div>
            <style>@keyframes pulse { 0%,100% { transform:scale(1); opacity:1 } 50% { transform:scale(1.4); opacity:0 } }</style>
        </div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });

    // Save map instance ref + handle click + set bounds dynamically
    function MapSetup() {
        const map = useMap();
        React.useEffect(() => {
            mapInstanceRef.current = map;
        }, [map]);

        React.useEffect(() => {
            if (fogOfWar) {
                const centerLat = cityBoundary?.[0]?.latitude ?? center[0];
                const centerLng = cityBoundary?.[0]?.longitude ?? center[1];

                map.setMaxBounds([
                    [centerLat - 2.0, centerLng - 3.0],
                    [centerLat + 2.0, centerLng + 3.0]
                ]);
            } else {
                // Free roam using absurdly large bounds to essentially disable it completely in Leaflet
                map.setMaxBounds([
                    [-900, -1800],
                    [900, 1800]
                ]);
            }
        }, [map, fogOfWar, cityBoundary]);

        useMapEvents({
            click(e: any) {
                onMapPress?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
            },
        });
        return null;
    }

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <MapContainer
                center={center}
                zoom={DEFAULT_ZOOM}
                minZoom={fogOfWar ? 10 : 0}
                maxBoundsViscosity={1.0}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url={isDarkMode ? "https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png" : "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"}
                />
                <MapSetup />

                {fogOfWar && (
                    <Polygon
                        key={'fog_overlay'}
                        positions={[fogBaseCoords, holeBoundary]}
                        pathOptions={{
                            color: 'transparent',
                            fillColor: isDarkMode ? '#111827' : '#6B7280',
                            fillOpacity: 1,
                            stroke: false,
                            interactive: false,
                        }}
                    />
                )}

                {clusters.map((cluster: Report[], i: number) => {
                    const main = cluster[0];
                    const cat = CATEGORIES.find((c) => c.name === main.rubric_name);
                    const isCluster = cluster.length > 1;

                    return (
                        <Marker
                            key={i}
                            position={[main.latitude, main.longitude]}
                            icon={isCluster ? clusterIcon(cluster.length) : createIcon(cat?.color || '#FF3B30')}
                            eventHandlers={{
                                click: () => onMarkerPress?.(cluster),
                            }}
                        >
                            <Popup>
                                <div>
                                    <strong>{isCluster ? `${cluster.length} жалоб` : main.title}</strong>
                                    <br />
                                    <span style={{ color: '#666', fontSize: 12 }}>
                                        {main.address || 'Адрес не указан'}
                                    </span>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Selected point marker */}
                {selectedCoordinate && (
                    <Marker
                        position={[selectedCoordinate.latitude, selectedCoordinate.longitude]}
                        icon={selectedPinIcon}
                    />
                )}
            </MapContainer>
        </div>
    );
});
