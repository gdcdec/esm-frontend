import { useThemeStore } from '@/src/store/themeStore';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface CityAlertProps {
  message: string;
  onClose: () => void;
}

export function CityAlert({ message, onClose }: CityAlertProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <View
        style={{
          backgroundColor: isDarkMode ? '#1F2937' : 'white',
          borderRadius: 16,
          padding: 24,
          maxWidth: 400,
          width: '90%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.25,
          shadowRadius: 25,
          elevation: 20,
          borderWidth: isDarkMode ? 1 : 0,
          borderColor: isDarkMode ? '#374151' : 'transparent',
        }}
      >
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: isDarkMode ? '#F9FAFB' : '#111827',
              marginBottom: 8,
            }}
          >
            Внимание
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: isDarkMode ? '#D1D5DB' : '#374151',
              lineHeight: 20,
            }}
          >
            {message}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={{
            backgroundColor: '#3B82F6',
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 24,
            width: '100%',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '500',
            }}
          >
            Понятно
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function CityAlertWeb({ message, onClose }: CityAlertProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);

  return (
    <div
      style={{
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: isDarkMode ? '#1F2937' : 'white',
          borderRadius: 16,
          padding: 24,
          maxWidth: 400,
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: isDarkMode ? '1px solid #374151' : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: isDarkMode ? '#F9FAFB' : '#111827',
              marginBottom: 8,
            }}
          >
            Внимание
          </div>
          <div
            style={{
              fontSize: 14,
              color: isDarkMode ? '#D1D5DB' : '#374151',
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
