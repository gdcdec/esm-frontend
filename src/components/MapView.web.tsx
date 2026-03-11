import { CATEGORIES } from '@/src/constants/categories';
import { useThemeStore } from '@/src/store/themeStore';
import { Report } from '@/src/types';
import { CityBoundaryData, fetchCityBoundary, GeoCoordinate } from '@/src/utils/fetchCityBoundary';
import { generateCloudyHole } from '@/src/utils/generateCloudyHole';
import { generateCloudyPolygon } from '@/src/utils/generateCloudyPolygon';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Layer, Marker as MapMarker, MapRef, Source } from 'react-map-gl/maplibre';

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
    const mapRef = useRef<MapRef>(null);
    const { isDarkMode, fogOfWar, city } = useThemeStore();
    const [cityBoundary, setCityBoundary] = useState<CityBoundaryData | null>(null);

    const center = initialRegion
        ? { latitude: initialRegion.latitude, longitude: initialRegion.longitude }
        : { latitude: DEFAULT_CENTER[0], longitude: DEFAULT_CENTER[1] };

    // Fetch OSM boundaries of the user's city
    useEffect(() => {
        fetchCityBoundary(city).then(data => {
            if (data && data.coords.length > 0) {
                setCityBoundary(data);
                if (mapRef.current) {
                    mapRef.current.flyTo({ center: [data.center.longitude, data.center.latitude], zoom: DEFAULT_ZOOM, duration: 1500 });
                }
            }
        });
    }, [city]);

    const fogBaseCoords = useMemo(() => {
        const centerLat = cityBoundary?.center?.latitude ?? center.latitude;
        const centerLng = cityBoundary?.center?.longitude ?? center.longitude;
        // MapLibre / GeoJSON uses [lng, lat]
        return [
            [centerLng - 15.0, centerLat + 10.0],
            [centerLng + 15.0, centerLat + 10.0],
            [centerLng + 15.0, centerLat - 10.0],
            [centerLng - 15.0, centerLat - 10.0],
            [centerLng - 15.0, centerLat + 10.0], // Close ring
        ] as [number, number][];
    }, [cityBoundary, center]);

    const holeBoundary = useMemo(() => {
        let polygonCoords: GeoCoordinate[];
        if (!cityBoundary) {
            polygonCoords = generateCloudyHole(
                center.latitude,
                center.longitude,
                0.15,
                40
            );
        } else {
            polygonCoords = generateCloudyPolygon(cityBoundary.coords, 4);
        }

        const hole = polygonCoords.map(pt => [pt.longitude, pt.latitude] as [number, number]);
        if (hole.length > 0) {
            hole.push([...hole[0]]); // GeoJSON requires closed loops
        }
        return hole;
    }, [cityBoundary]);

    const fogGeoJSON = useMemo(() => {
        return {
            type: 'FeatureCollection' as const,
            features: [
                {
                    type: 'Feature' as const,
                    properties: {},
                    geometry: {
                        type: 'Polygon' as const,
                        coordinates: [fogBaseCoords, holeBoundary]
                    }
                }
            ]
        };
    }, [fogBaseCoords, holeBoundary]);

    // Group reports by coordinates for clustering
    const clusters = useMemo(() => {
        const grouped: Record<string, Report[]> = {};
        reports.forEach((r) => {
            if (r.latitude == null || r.longitude == null) return;
            const key = `${r.latitude.toFixed(3)}-${r.longitude.toFixed(3)}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(r);
        });
        return Object.values(grouped);
    }, [reports]);

    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            mapRef.current?.zoomIn({ duration: 300 });
        },
        zoomOut: () => {
            mapRef.current?.zoomOut({ duration: 300 });
        },
        goToLocation: (lat: number, lng: number) => {
            mapRef.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 1500 });
        },
    }));

    const mapStyle = useMemo(() => ({
        version: 8,
        sources: {
            'cartodb-tiles': {
                type: 'raster',
                tiles: ['https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'],
                tileSize: 256,
            }
        },
        layers: [
            {
                id: 'cartodb-layer',
                type: 'raster',
                source: 'cartodb-tiles',
                minzoom: 0,
                maxzoom: 22
            }
        ]
    } as any), []);

    const fogLayerStyle = useMemo((): any => ({
        id: 'fog-layer',
        type: 'fill',
        paint: {
            'fill-color': isDarkMode ? '#111827' : '#6B7280',
            'fill-opacity': 1
        }
    }), [isDarkMode]);

    // Check if the client is a mobile browser to enable touch gestures
    const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(window.navigator.userAgent);

    return (
        <View style={{ width: '100%', height: '100%' }}>
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: center.longitude,
                    latitude: center.latitude,
                    zoom: DEFAULT_ZOOM,
                    pitch: 0,
                    bearing: 0
                }}
                mapStyle={mapStyle}
                style={{ width: '100%', height: '100%' }}
                onClick={(e) => {
                    onMapPress?.({ latitude: e.lngLat.lat, longitude: e.lngLat.lng });
                }}
                interactiveLayerIds={['cartodb-layer']}
                maxZoom={19}
                minZoom={fogOfWar ? 10 : 0}
                maxBounds={fogOfWar ? [
                    [center.longitude - 3.0, center.latitude - 2.0], // SW
                    [center.longitude + 3.0, center.latitude + 2.0]  // NE
                ] : undefined}
                dragRotate={isMobile}
                touchPitch={isMobile}
                touchZoomRotate={isMobile}
                keyboard={isMobile}
            >
                {fogOfWar && (
                    <Source id="fog-source" type="geojson" data={fogGeoJSON}>
                        <Layer {...fogLayerStyle} />
                    </Source>
                )}

                {clusters.map((cluster: Report[], i: number) => {
                    const main = cluster[0];
                    const cat = CATEGORIES.find((c) => c.name === main.rubric_name);
                    const isCluster = cluster.length > 1;
                    const color = cat?.color || '#FF3B30';

                    return (
                        <MapMarker
                            key={`marker-${i}`}
                            longitude={main.longitude}
                            latitude={main.latitude}
                            anchor="bottom"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                                onMarkerPress?.(cluster);
                            }}
                        >
                            {isCluster ? (
                                <div style={{
                                    width: 36, height: 36,
                                    background: '#2563EB',
                                    border: '3px solid white',
                                    borderRadius: '50%',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: 14,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
                                    cursor: 'pointer'
                                }}>
                                    {cluster.length}
                                </div>
                            ) : (
                                <div style={{
                                    width: 30, height: 30,
                                    background: color,
                                    border: '3px solid white',
                                    borderRadius: '50% 50% 50% 0',
                                    transform: 'rotate(-45deg)',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                    cursor: 'pointer',
                                    marginBottom: 10
                                }} />
                            )}
                        </MapMarker>
                    );
                })}

                {selectedCoordinate && (
                    <MapMarker
                        longitude={selectedCoordinate.longitude}
                        latitude={selectedCoordinate.latitude}
                        anchor="bottom"
                    >
                        <div style={{ position: 'relative', marginBottom: 15 }}>
                            <div style={{
                                width: 32, height: 32,
                                background: '#2563EB',
                                border: '3px solid white',
                                borderRadius: '50% 50% 50% 0',
                                transform: 'rotate(-45deg)',
                                boxShadow: '0 2px 8px rgba(37,99,235,0.5)',
                            }} />
                            <div style={{
                                position: 'absolute',
                                top: -4, left: -4,
                                width: 40, height: 40,
                                borderRadius: '50%',
                                background: 'rgba(37,99,235,0.2)',
                                animation: 'pulse 1.5s infinite',
                            }} />
                            <style>{`@keyframes pulse { 0%,100% { transform:scale(1); opacity:1 } 50% { transform:scale(1.4); opacity:0 } }`}</style>
                        </div>
                    </MapMarker>
                )}
            </Map>
        </View>
    );
});
