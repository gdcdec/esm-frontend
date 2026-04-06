import { Input } from '@/src/components/ui';
import { useThemeStore } from '@/src/store/themeStore';
import { AddressSearchResult } from '@/src/types';
import { Loader2, MapPin } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface AddressInputProps {
  address: string;
  onChangeAddress: (text: string) => void;
  suggestions: AddressSearchResult[];
  isSearching: boolean;
  onSelectSuggestion: (item: AddressSearchResult) => void;
  inputRef?: React.RefObject<TextInput>;
}

export function AddressInput({
  address,
  onChangeAddress,
  suggestions,
  isSearching,
  onSelectSuggestion,
  inputRef,
}: AddressInputProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const [selection, setSelection] = React.useState<{ start: number; end: number } | undefined>(undefined);

  const handleSelect = (item: AddressSearchResult) => {
    onSelectSuggestion(item);
    setSelection({ start: 0, end: 0 });
    Keyboard.dismiss();
  };

  return (
    <View className="z-10 relative">
      <Input
        ref={inputRef}
        placeholder="Адрес (например: ул. Ленина, 10)"
        value={address}
        selection={selection}
        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
        onChangeText={onChangeAddress}
      />
      {(suggestions.length > 0 || isSearching) && (
        <View
          className="absolute top-[52px] left-0 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 p-2"
          style={{
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          {isSearching ? (
            <View className="p-4 items-center">
              <Loader2 size={24} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
            </View>
          ) : (
            suggestions.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSelect(item)}
                className={`flex-row items-center p-3 ${
                  index < suggestions.length - 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''
                }`}
              >
                <MapPin size={16} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} style={{ marginRight: 12 }} />
                <Text className="flex-1 text-sm text-gray-700 dark:text-gray-300" numberOfLines={2}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
}
