import { useThemeStore } from '@/src/store/themeStore';
import { useAuthStore } from '@/src/store/authStore';
import { router } from 'expo-router';
import React from 'react';

interface ProfileButtonProps {
  size?: number;
}

export function ProfileButton({ size = 44 }: ProfileButtonProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const user = useAuthStore((s) => s.user);

  const buttonStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
    background: isDarkMode ? '#1F2937' : 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: isDarkMode ? '#FFFFFF' : '#111827',
    boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.12)',
  };

  return (
    <button onClick={() => router.push('/(main)/profile')} style={buttonStyle}>
      {user?.username?.charAt(0)?.toUpperCase() ?? '?'}
    </button>
  );
}
