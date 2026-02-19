import { CATEGORIES } from '@/src/constants/categories';
import { Report } from '@/src/types';
import L from 'leaflet';
import React from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';

// Fix leaflet default icons in web bundlers
import 'leaflet/dist/leaflet.css';

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

interface MapViewProps {
    reports: Report[];
    onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
    onMarkerPress?: (reports: Report[]) => void;
    initialRegion?: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    };
}

const DEFAULT_CENTER: [number, number] = [55.7558, 37.6173];
const DEFAULT_ZOOM = 13;

function MapClickHandler({
    onMapPress,
}: {
    onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
}) {
    useMapEvents({
        click(e) {
            onMapPress?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
        },
    });
    return null;
}

export const AppMapView: React.FC<MapViewProps> = ({
    reports,
    onMapPress,
    onMarkerPress,
    initialRegion,
}) => {
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
                <MapClickHandler onMapPress={onMapPress} />

                {clusters.map((cluster, i) => {
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
            </MapContainer>
        </div>
    );
};
