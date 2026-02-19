import { Report } from '@/src/types';
import React from 'react';

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

/**
 * Fallback MapView — this file is overridden by:
 *  - MapView.native.tsx on Android/iOS (react-native-maps)
 *  - MapView.web.tsx on Web (react-leaflet)
 *
 * Metro picks the platform-specific file automatically.
 * This base file only exists for TypeScript resolution.
 */
export const AppMapView: React.FC<MapViewProps> = () => {
    return null;
};
