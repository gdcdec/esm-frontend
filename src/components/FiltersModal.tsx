import { useThemeStore } from '@/src/store/themeStore';
import { Calendar, ChevronDown, ChevronRight, Home, MapPin, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from 'react-native-date-picker';

export interface ReportFilters {
  rubrics?: string[];
  city?: string;
  state?: string;
  address?: string;
  house_number?: string;
  author_id?: number;
  date_start?: string;
  date_end?: string;
}

interface FiltersModalProps {
  visible: boolean;
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  onClose: () => void;
  availableRubrics?: string[];
  availableAuthors?: { id: number; username: string }[];
}

const RUBRICS = [
  'Дорожные происшествия',
  'Проблемы с ЖКХ', 
  'Благоустройство',
  'Экология',
  'Строительство',
  'Транспорт',
  'Безопасность',
  'Другое'
];

const FilterSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ title, icon, children, isExpanded, onToggle }) => {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);

  return (
    <View className={`mb-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <TouchableOpacity
        onPress={onToggle}
        className={`flex-row items-center justify-between p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
      >
        <View className="flex-row items-center">
          {icon}
          <Text className={`ml-3 font-semibold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </Text>
        </View>
        {isExpanded ? (
          <ChevronDown size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
        ) : (
          <ChevronRight size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
        )}
      </TouchableOpacity>
      {isExpanded && (
        <View className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {children}
        </View>
      )}
    </View>
  );
};

const DateInput: React.FC<{
  value?: string;
  placeholder: string;
  onChange: (value: string) => void;
  mode: 'date' | 'datetime';
}> = ({ value, placeholder, onChange, mode }) => {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const [showPicker, setShowPicker] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  React.useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handlePress = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = mode === 'datetime' ? 'datetime-local' : 'date';
      input.value = value || '';
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        onChange(target.value);
        setInputValue(target.value);
      };
      input.click();
    } else {
      setShowPicker(true);
    }
  };

  const handlePickerChange = (date: Date) => {
    setShowPicker(false);
    if (date) {
      const formatted = mode === 'datetime' 
        ? date.toISOString().slice(0, 16)
        : date.toISOString().slice(0, 10);
      onChange(formatted);
      setInputValue(formatted);
    }
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    onChange(text);
  };

  return (
    <View className="flex-1">
      <View className={`flex-1 flex-row items-center rounded-lg border ${
        isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
      }`}>
        <TextInput
          value={inputValue}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
          className={`flex-1 p-3 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
          style={{
            fontSize: 16,
            minHeight: 48,
          }}
        />
        <TouchableOpacity
          onPress={handlePress}
          className={`p-3 ${
            isDarkMode ? 'border-l border-gray-600' : 'border-l border-gray-200'
          }`}
        >
          <Calendar size={16} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>
      </View>
      
      {showPicker && Platform.OS !== 'web' && (
        <DateTimePicker
          date={value ? new Date(value) : new Date()}
          mode={mode === 'datetime' ? 'datetime' : 'date'}
          onConfirm={handlePickerChange}
          onCancel={() => setShowPicker(false)}
          title={placeholder}
          confirmText="OK"
          cancelText="Отмена"
          theme={isDarkMode ? 'dark' : 'light'}
          locale="ru"
        />
      )}
    </View>
  );
};

const FilterOption: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ label, isSelected, onPress }) => {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center justify-between p-3 mb-2 rounded-lg ${
        isSelected
          ? isDarkMode ? 'bg-blue-900 border-blue-600' : 'bg-blue-50 border-blue-300'
          : isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
      } border`}
    >
      <Text className={`flex-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        {label}
      </Text>
      <View
        className={`w-5 h-5 rounded-full border-2 ${
          isSelected
            ? 'bg-blue-500 border-blue-500'
            : isDarkMode ? 'border-gray-500' : 'border-gray-300'
        }`}
      >
        {isSelected && (
          <View className="w-2 h-2 bg-white rounded-full m-0.5" />
        )}
      </View>
    </TouchableOpacity>
  );
};

export const FiltersModal: React.FC<FiltersModalProps> = ({
  visible,
  filters,
  onFiltersChange,
  onClose,
  availableRubrics = RUBRICS,
  availableAuthors = []
}) => {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const [expandedSections, setExpandedSections] = useState({
    rubric: true,
    location: false,
    author: false,
    date: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateFilter = (key: keyof ReportFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Header */}
        <View className={`flex-row items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Фильтры
          </Text>
          <View className="flex-row items-center gap-3">
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters}>
                <Text className="text-blue-500 font-medium">Очистить</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-4">
          {/* Рубрики */}
          <FilterSection
            title="Рубрики"
            icon={<Home size={20} color="#3B82F6" />}
            isExpanded={expandedSections.rubric}
            onToggle={() => toggleSection('rubric')}
          >
            <View className="flex-row flex-wrap gap-2">
              <TouchableOpacity
                onPress={() => updateFilter('rubrics', undefined)}
                className={`px-3 py-2 rounded-full border ${
                  !filters.rubrics || filters.rubrics.length === 0
                    ? isDarkMode ? 'bg-blue-600 border-blue-600' : 'bg-blue-500 border-blue-500'
                    : isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  !filters.rubrics || filters.rubrics.length === 0 ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Все
                </Text>
              </TouchableOpacity>
              {availableRubrics.map((rubric) => (
                <TouchableOpacity
                  key={rubric}
                  onPress={() => {
                    const currentRubrics = filters.rubrics || [];
                    const isSelected = currentRubrics.includes(rubric);
                    const newRubrics = isSelected 
                      ? currentRubrics.filter(r => r !== rubric)
                      : [...currentRubrics, rubric];
                    updateFilter('rubrics', newRubrics);
                  }}
                  className={`px-3 py-2 rounded-full border ${
                    filters.rubrics?.includes(rubric)
                      ? isDarkMode ? 'bg-blue-600 border-blue-600' : 'bg-blue-500 border-blue-500'
                      : isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    filters.rubrics?.includes(rubric) ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {rubric}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FilterSection>

          {/* Местоположение */}
          <FilterSection
            title="Местоположение"
            icon={<MapPin size={20} color="#3B82F6" />}
            isExpanded={expandedSections.location}
            onToggle={() => toggleSection('location')}
          >
            <View className="space-y-3">
              <View>
                <Text className={`mb-2 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Город
                </Text>
                <TextInput
                  value={filters.city || ''}
                  onChangeText={(value) => updateFilter('city', value || undefined)}
                  placeholder="Введите город"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  className={`p-3 rounded-lg border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </View>

              <View>
                <Text className={`mb-2 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Область/регион
                </Text>
                <TextInput
                  value={filters.state || ''}
                  onChangeText={(value) => updateFilter('state', value || undefined)}
                  placeholder="Введите область или регион"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  className={`p-3 rounded-lg border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </View>

              <View>
                <Text className={`mb-2 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Адрес
                </Text>
                <TextInput
                  value={filters.address || ''}
                  onChangeText={(value) => updateFilter('address', value || undefined)}
                  placeholder="Введите адрес (улица, часть адреса)"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  className={`p-3 rounded-lg border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </View>

              <View>
                <Text className={`mb-2 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Номер дома
                </Text>
                <TextInput
                  value={filters.house_number || ''}
                  onChangeText={(value) => updateFilter('house_number', value || undefined)}
                  placeholder="Введите номер дома"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  className={`p-3 rounded-lg border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </View>
            </View>
          </FilterSection>

          {/* Автор */}
          {availableAuthors.length > 0 && (
            <FilterSection
              title="Автор"
              icon={<User size={20} color="#3B82F6" />}
              isExpanded={expandedSections.author}
              onToggle={() => toggleSection('author')}
            >
              <FilterOption
                label="Все авторы"
                isSelected={!filters.author_id}
                onPress={() => updateFilter('author_id', undefined)}
              />
              {availableAuthors.map((author) => (
                <FilterOption
                  key={author.id}
                  label={author.username}
                  isSelected={filters.author_id === author.id}
                  onPress={() => updateFilter('author_id', author.id)}
                />
              ))}
            </FilterSection>
          )}

          {/* Период публикации */}
          <FilterSection
            title="Период публикации"
            icon={<Calendar size={20} color="#3B82F6" />}
            isExpanded={expandedSections.date}
            onToggle={() => toggleSection('date')}
          >
            <View className="space-y-3">
              <View>
                <Text className={`mb-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Начальная дата
                </Text>
                <DateInput
                  value={filters.date_start}
                  placeholder="Выберите начальную дату"
                  onChange={(value) => updateFilter('date_start', value)}
                  mode="date"
                />
              </View>

              <View>
                <Text className={`mb-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Конечная дата
                </Text>
                <DateInput
                  value={filters.date_end}
                  placeholder="Выберите конечную дату"
                  onChange={(value) => updateFilter('date_end', value)}
                  mode="date"
                />
              </View>
            </View>
          </FilterSection>
        </ScrollView>

        {/* Кнопка сохранения */}
        <View className={`p-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <TouchableOpacity
            onPress={onClose}
            className={`w-full py-3 rounded-lg ${
              isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
            }`}
          >
            <Text className="text-white font-semibold text-center">
              Сохранить фильтры
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
