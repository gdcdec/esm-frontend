import { CATEGORIES } from '@/src/constants/categories';
import { Report } from '@/src/types';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

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

export const AppMapView: React.FC<MapViewProps> = ({
    reports,
    selectedCoordinate,
    onMapPress,
    onMarkerPress,
    initialRegion,
}) => {
    const [LeafletComponents, setLeafletComponents] = useState<any>(null);

    const center: [number, number] = initialRegion
        ? [initialRegion.latitude, initialRegion.longitude]
        : DEFAULT_CENTER;

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

    // Dynamically import Leaflet only on client side (avoid "window is not defined")
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
    const { MapContainer, TileLayer, Marker, Popup, useMapEvents } = RL;

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

    // Click handler component
    function MapClickHandler() {
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
                style={{ width: '100%', height: '100%' }}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler />

                {clusters.map((cluster: Report[], i: number) => {
                    const main = cluster[0];
                    const cat = CATEGORIES.find((c) => c.id === main.category);
                    const isCluster = cluster.length > 1;

                    return (
                        <Marker
                            key={i}
                            position={[main.lat, main.long]}
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
};
