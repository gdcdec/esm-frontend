import { MapViewRef } from '@/src/types';
import { useThemeStore } from '@/src/store/themeStore';
import { Plus, Minus, Locate } from 'lucide-react-native';
import React from 'react';

interface ZoomControlsProps {
  mapRef: React.RefObject<MapViewRef | null>;
  onLocate: () => void;
  position?: 'right' | 'left';
}

export function ZoomControls({ mapRef, onLocate, position = 'right' }: ZoomControlsProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);

  const buttonStyle = (color?: string): React.CSSProperties => ({
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
    background: isDarkMode ? '#1F2937' : 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.12)',
  });

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    [position]: 16,
    top: '35%',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  return (
    <div style={containerStyle}>
      <button onClick={() => mapRef.current?.zoomIn()} style={buttonStyle()}>
        <Plus size={22} color={isDarkMode ? '#D1D5DB' : '#374151'} />
      </button>
      <button onClick={() => mapRef.current?.zoomOut()} style={buttonStyle()}>
        <Minus size={22} color={isDarkMode ? '#D1D5DB' : '#374151'} />
      </button>
      <button onClick={onLocate} style={{ ...buttonStyle(), marginTop: 8 }}>
        <Locate size={22} color="#2563EB" />
      </button>
    </div>
  );
}
