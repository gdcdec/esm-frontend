import { Source, Layer } from 'react-map-gl/maplibre';
import React from 'react';

interface FogLayerProps {
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

export function FogLayer({ fogGeoJSON, fogLayerStyle }: FogLayerProps) {
  return (
    <Source id="fog-source" type="geojson" data={fogGeoJSON}>
      <Layer {...fogLayerStyle} />
    </Source>
  );
}
