import { Button } from '@/src/components/ui';
import { useThemeStore } from '@/src/store/themeStore';
import { MapViewRef } from '@/src/types';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface PointCardProps {
  coordinate: { latitude: number; longitude: number };
  address: string | null;
  mapRef: React.RefObject<MapViewRef>;
  onClose: () => void;
  variant?: 'web' | 'mobile' | 'native';
}

export function PointCard({ coordinate, address, onClose, variant = 'web' }: PointCardProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);

  const handleCreateReport = () => {
    router.push({
      pathname: '/(main)/create',
      params: {
        ...(address ? { address } : {}),
        lat: String(coordinate.latitude),
        lon: String(coordinate.longitude),
      },
    });
  };

  if (variant === 'web') {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: 340,
        }}
      >
        <View className={`p-5 rounded-3xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <View className="flex-row justify-between items-start mb-2">
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Новая метка</Text>
              {address && (
                <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={{ marginTop: 4 }}>
                  {address}
                </Text>
              )}
              <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} style={{ fontSize: 11, marginTop: 4 }}>
                {coordinate.latitude.toFixed(6)},{' '}
                {coordinate.longitude.toFixed(6)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <X size={20} color={isDarkMode ? '#D1D5DB' : '#374151'} />
            </TouchableOpacity>
          </View>
          <Button title="Сообщить о проблеме" onPress={handleCreateReport} />
        </View>
      </div>
    );
  }

  if (variant === 'mobile') {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 12,
          right: 12,
          zIndex: 50,
          background: isDarkMode ? '#1F2937' : 'white',
          border: isDarkMode ? '1px solid #374151' : 'none',
          borderRadius: 20,
          boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.15)',
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ flex: 1, marginRight: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: isDarkMode ? '#F9FAFB' : '#111827' }}>Новая метка</div>
            {address && (
              <div style={{ color: isDarkMode ? '#D1D5DB' : '#374151', fontSize: 14, marginTop: 4 }}>
                {address}
              </div>
            )}
            <div style={{ color: isDarkMode ? '#9CA3AF' : '#9CA3AF', fontSize: 11, marginTop: 4 }}>
              {coordinate.latitude.toFixed(6)},{' '}
              {coordinate.longitude.toFixed(6)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: isDarkMode ? '#374151' : '#F3F4F6',
              border: 'none',
              borderRadius: 20,
              width: 36,
              height: 36,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} color={isDarkMode ? '#D1D5DB' : '#374151'} />
          </button>
        </div>
        <Button title="Сообщить о проблеме" onPress={handleCreateReport} />
      </div>
    );
  }

  // нативный вариант
  return (
    <View className="absolute bottom-0 w-full p-4" style={{ zIndex: 30 }}>
      <View className={`p-5 rounded-3xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <View className="flex-row justify-between items-start mb-2">
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Новая метка</Text>
            {address && (
              <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} numberOfLines={2}>
                {address}
              </Text>
            )}
            <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} style={{ fontSize: 11, marginTop: 4 }}>
              {coordinate.latitude.toFixed(6)},{' '}
              {coordinate.longitude.toFixed(6)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
          >
            <X size={20} color={isDarkMode ? '#D1D5DB' : '#374151'} />
          </TouchableOpacity>
        </View>
        <Button title="Сообщить о проблеме" onPress={handleCreateReport} />
      </View>
    </View>
  );
}
