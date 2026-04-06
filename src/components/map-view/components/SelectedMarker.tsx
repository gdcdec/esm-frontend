import React from 'react';
import { Marker } from 'react-map-gl/maplibre';

interface SelectedMarkerProps {
  latitude: number;
  longitude: number;
}

export function SelectedMarker({ latitude, longitude }: SelectedMarkerProps) {
  return (
    <Marker longitude={longitude} latitude={latitude} anchor="bottom">
      <div style={{ position: 'relative', marginBottom: 15 }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: '#2563EB',
            border: '3px solid white',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            boxShadow: '0 2px 8px rgba(37,99,235,0.5)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -4,
            left: -4,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(37,99,235,0.2)',
            animation: 'pulse 1.5s infinite',
          }}
        />
        <style>{`@keyframes pulse { 0%,100% { transform:scale(1); opacity:1 } 50% { transform:scale(1.4); opacity:0 } }`}</style>
      </div>
    </Marker>
  );
}
