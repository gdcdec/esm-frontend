import { CityBoundaryData, GeoCoordinate } from '@/src/utils/fetchCityBoundary';
import { generateCloudyHole } from '@/src/utils/generateCloudyHole';
import { generateCloudyPolygon } from '@/src/utils/generateCloudyPolygon';
import { useMemo } from 'react';

interface FogLayerData {
  fogGeoJSON: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      properties: Record<string, unknown>;
      geometry: {
        type: 'Polygon';
        coordinates: number[][][];
      };
    }>;
  };
  fogLayerStyle: {
    id: string;
    type: 'fill';
    paint: {
      'fill-color': string;
      'fill-opacity': number;
    };
  };
}

interface UseFogLayerProps {
  cityBoundary: CityBoundaryData | null;
  center: { latitude: number; longitude: number };
  isDarkMode: boolean;
}

export function useFogLayer({ cityBoundary, center, isDarkMode }: UseFogLayerProps): FogLayerData {
  const fogBaseCoords = useMemo(() => {
    const centerLat = cityBoundary?.center?.latitude ?? center.latitude;
    const centerLng = cityBoundary?.center?.longitude ?? center.longitude;

    return [
      [centerLng - 15.0, centerLat + 10.0],
      [centerLng + 15.0, centerLat + 10.0],
      [centerLng + 15.0, centerLat - 10.0],
      [centerLng - 15.0, centerLat - 10.0],
      [centerLng - 15.0, centerLat + 10.0],
    ] as [number, number][];
  }, [cityBoundary, center]);

  const holeBoundary = useMemo(() => {
    let polygonCoords: GeoCoordinate[];
    if (!cityBoundary) {
      polygonCoords = generateCloudyHole(center.latitude, center.longitude, 0.15, 40);
    } else {
      polygonCoords = generateCloudyPolygon(cityBoundary.coords, 4);
    }

    const hole = polygonCoords.map((pt) => [pt.longitude, pt.latitude] as [number, number]);
    if (hole.length > 0) {
      hole.push([...hole[0]]);
    }
    return hole;
  }, [cityBoundary, center]);

  const fogGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'Polygon' as const,
            coordinates: [fogBaseCoords, holeBoundary],
          },
        },
      ],
    };
  }, [fogBaseCoords, holeBoundary]);

  const fogLayerStyle = useMemo(
    () => ({
      id: 'fog-layer',
      type: 'fill' as const,
      paint: {
        'fill-color': isDarkMode ? '#111827' : '#6B7280',
        'fill-opacity': 1,
      },
    }),
    [isDarkMode]
  );

  return { fogGeoJSON, fogLayerStyle };
}
