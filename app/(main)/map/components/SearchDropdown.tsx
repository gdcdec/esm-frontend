import { useThemeStore } from '@/src/store/themeStore';
import { AddressSearchResult } from '@/src/types';
import { Clock, MapPin, Search } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface SearchDropdownProps {
  query: string;
  suggestions: AddressSearchResult[];
  searchHistory: string[];
  isSearching: boolean;
  onSelectSuggestion: (item: AddressSearchResult) => void;
  onSelectHistory: (item: string) => void;
  onClearHistory: () => void;
  onClearQuery: () => void;
  variant?: 'web' | 'mobile';
}

export function SearchDropdown({
  query,
  suggestions,
  searchHistory,
  isSearching,
  onSelectSuggestion,
  onSelectHistory,
  onClearHistory,
  onClearQuery,
  variant = 'web',
}: SearchDropdownProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);

  const formatAddress = (item: AddressSearchResult) => {
    return item.street
      ? `${item.street}${item.house ? ', ' + item.house : ''}${item.city ? ', ' + item.city : ''}`
      : item.display_name;
  };

  if (variant === 'web') {
    return (
      <div
        style={{
          marginTop: 4,
          background: isDarkMode ? '#1F2937' : 'white',
          borderRadius: 14,
          boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.12)',
          border: isDarkMode ? '1px solid #374151' : 'none',
          padding: 12,
          maxHeight: 300,
          overflowY: 'auto' as const,
          scrollbarWidth: isDarkMode ? 'thin' : 'auto',
          scrollbarColor: isDarkMode ? '#4B5563 #1F2937' : 'auto',
        }}
      >
        {query.length >= 3 && (isSearching || suggestions.length > 0) ? (
          <>
            {isSearching ? (
              <Text style={{ textAlign: 'center', padding: 12, color: '#9CA3AF' }}>Поиск...</Text>
            ) : (
              suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectSuggestion(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: idx < suggestions.length - 1 ? '1px solid #F3F4F6' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left' as const,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <MapPin size={16} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
                  </div>
                  <span style={{ fontSize: 14, color: isDarkMode ? '#D1D5DB' : '#374151', flex: 1 }}>
                    {formatAddress(item)}
                  </span>
                </button>
              ))
            )}
          </>
        ) : !query && searchHistory.length > 0 ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: isDarkMode ? '#F9FAFB' : '#111827' }}>История</span>
              <button
                onClick={onClearHistory}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9CA3AF' }}
              >
                Очистить
              </button>
            </div>
            {searchHistory.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectHistory(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: idx < searchHistory.length - 1 ? '1px solid #F3F4F6' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Search size={16} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
                </div>
                <span style={{ fontSize: 14, color: isDarkMode ? '#D1D5DB' : '#374151', flex: 1 }}>{item}</span>
                <Clock size={14} color={isDarkMode ? '#6B7280' : '#D1D5DB'} />
              </button>
            ))}
          </>
        ) : null}
      </div>
    );
  }

  // мобильный вариант
  return (
    <>
      {query.length >= 3 && (isSearching || suggestions.length > 0) ? (
        <View className="mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
          {isSearching ? (
            <Text className="text-center py-4 text-gray-500">Поиск...</Text>
          ) : (
            suggestions.map((item, idx) => {
              const shortAddress = formatAddress(item);
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => onSelectSuggestion(item)}
                  className={`flex-row items-center px-4 py-3 ${idx < suggestions.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
                >
                  <MapPin size={16} color={isDarkMode ? '#9CA3AF' : '#6B7280'} style={{ marginRight: 12 }} />
                  <Text className="flex-1 text-gray-900 dark:text-gray-100" numberOfLines={2}>
                    {shortAddress}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      ) : !query && searchHistory.length > 0 ? (
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="font-bold text-gray-900 dark:text-gray-100 text-sm">История поиска</Text>
            <TouchableOpacity onPress={onClearHistory}>
              <Text className="text-xs text-gray-400 dark:text-gray-500">Очистить</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {searchHistory.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg flex-row items-center gap-1.5"
                onPress={() => onSelectHistory(item)}
              >
                <Clock size={12} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
                <Text className="text-sm text-gray-700 dark:text-gray-300">{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
}
