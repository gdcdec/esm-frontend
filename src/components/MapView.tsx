import { MapViewRef, Report } from '@/src/types';
import { forwardRef } from 'react';

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

/**
 * Fallback MapView — overridden by platform-specific files:
 *  - MapView.native.tsx (react-native-maps)
 *  - MapView.web.tsx (react-leaflet)
 */
export const AppMapView = forwardRef<MapViewRef, MapViewProps>(() => {
    return null;
});
