import { useCityBoundary } from '@/src/hooks/map/useCityBoundary';
import { useFogLayer } from '@/src/hooks/map/useFogLayer';
import { useThemeStore } from '@/src/store/themeStore';
import { MapViewRef, Report } from '@/src/types';
import 'maplibre-gl/dist/maplibre-gl.css';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Map, { MapRef } from 'react-map-gl/maplibre';
import { View } from 'react-native';
import { FogLayer } from './components/FogLayer';
import { ReportMarkers } from './components/ReportMarkers';
import { SelectedMarker } from './components/SelectedMarker';

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

const DEFAULT_CENTER: [number, number] = [53.2, 50.15];
const DEFAULT_ZOOM = 13;

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
} as any;

export const AppMapView = forwardRef<MapViewRef, MapViewProps>(
  ({ reports, selectedCoordinate, onMapPress, onMarkerPress, initialRegion }, ref) => {
    const mapRef = useRef<MapRef>(null);
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const visibilityArea = useThemeStore((s) => s.visibilityArea);
    const city = useThemeStore((s) => s.city);

    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState<string | null>(null);

    const { cityBoundary } = useCityBoundary(city);

    const center = initialRegion
      ? { latitude: initialRegion.latitude, longitude: initialRegion.longitude }
      : { latitude: DEFAULT_CENTER[0], longitude: DEFAULT_CENTER[1] };

    const { fogGeoJSON, fogLayerStyle } = useFogLayer({
      cityBoundary,
      center,
      isDarkMode,
    });

    useImperativeHandle(ref, () => ({
      zoomIn: () => mapRef.current?.zoomIn({ duration: 300 }),
      zoomOut: () => mapRef.current?.zoomOut({ duration: 300 }),
      goToLocation: (lat: number, lng: number) => {
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 1500 });
      },
    }));

    const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(window.navigator.userAgent);

    const handleMapLoad = () => {
      setIsMapLoading(false);
      setMapError(null);
    };

    const handleMapError = () => {
      setIsMapLoading(false);
      setMapError('Не удалось загрузить карту. Проверьте подключение к интернету.');
    };

    // Center map on city when city changes (regardless of visibilityArea setting)
    useEffect(() => {
      if (cityBoundary?.center) {
        mapRef.current?.flyTo({
          center: [cityBoundary.center.longitude, cityBoundary.center.latitude],
          zoom: 13,
          duration: 1000,
        });
      }
    }, [cityBoundary]);

    return (
      <View style={{ width: '100%', height: '100%', position: 'relative' }}>
        {isMapLoading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: isDarkMode ? '#111827' : '#F3F4F6',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}
          >
            <div style={{ color: isDarkMode ? '#FFFFFF' : '#111827', fontSize: 16 }}>Загрузка карты...</div>
          </View>
        )}

        {mapError && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: isDarkMode ? '#111827' : '#F3F4F6',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: 20,
            }}
          >
            <div style={{ color: '#EF4444', fontSize: 16, marginBottom: 16, textAlign: 'center' }}>{mapError}</div>
            <button
              onClick={() => {
                setIsMapLoading(true);
                setMapError(null);
                mapRef.current?.resize();
              }}
              style={{
                backgroundColor: '#3B82F6',
                color: 'white',
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Попробовать снова
            </button>
          </View>
        )}

        <Map
          ref={mapRef}
          initialViewState={{
            longitude: center.longitude,
            latitude: center.latitude,
            zoom: DEFAULT_ZOOM,
            pitch: 0,
            bearing: 0,
          }}
          mapStyle={mapStyle}
          style={{ width: '100%', height: '100%' }}
          onLoad={handleMapLoad}
          onError={handleMapError}
          onClick={(e) => onMapPress?.({ latitude: e.lngLat.lat, longitude: e.lngLat.lng })}
          interactiveLayerIds={['cartodb-layer']}
          maxZoom={19}
          minZoom={visibilityArea ? 10 : 0}
          maxBounds={
            visibilityArea && cityBoundary
              ? [
                  [cityBoundary.center.longitude - 3.0, cityBoundary.center.latitude - 2.0],
                  [cityBoundary.center.longitude + 3.0, cityBoundary.center.latitude + 2.0],
                ]
              : undefined
          }
          dragRotate={isMobile}
          touchPitch={isMobile}
          touchZoomRotate={isMobile}
          keyboard={isMobile}
        >
          {visibilityArea && <FogLayer fogGeoJSON={fogGeoJSON} fogLayerStyle={fogLayerStyle} />}
          <ReportMarkers reports={reports} onMarkerPress={onMarkerPress ?? (() => {})} />
          {selectedCoordinate && (
            <SelectedMarker latitude={selectedCoordinate.latitude} longitude={selectedCoordinate.longitude} />
          )}
        </Map>
      </View>
    );
  }
);

AppMapView.displayName = 'AppMapView';
