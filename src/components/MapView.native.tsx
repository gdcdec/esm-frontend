import { CATEGORIES } from '@/src/constants/categories';
import { Report } from '@/src/types';
import React from 'react';
import { StyleSheet } from 'react-native';
import RNMapView, { Marker, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';

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

const DEFAULT_REGION = {
    latitude: 55.7558,
    longitude: 37.6173,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

export const AppMapView: React.FC<MapViewProps> = ({
    reports,
    onMapPress,
    onMarkerPress,
    initialRegion = DEFAULT_REGION,
}) => {
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
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_DEFAULT}
            initialRegion={initialRegion}
            onPress={(e) => onMapPress?.(e.nativeEvent.coordinate)}
            showsUserLocation
            showsMyLocationButton={false}
        >
            {/* OpenStreetMap tiles */}
            <UrlTile
                urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
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
        </RNMapView>
    );
};
