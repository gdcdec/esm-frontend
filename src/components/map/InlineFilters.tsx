import { ReportFilters } from '@/src/components/FiltersModal';
import { useThemeStore } from '@/src/store/themeStore';
import { ChevronDown, Clock, User } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface InlineFiltersState {
    searchQuery: string;
    filters: ReportFilters;
    setFilters: React.Dispatch<React.SetStateAction<ReportFilters>>;
    showMine: boolean;
    setShowMine: React.Dispatch<React.SetStateAction<boolean>>;
    rubrics: string[];
}

interface InlineFiltersProps {
    state: InlineFiltersState;
    isDarkMode: boolean;
}

export function InlineFilters({
    state,
    isDarkMode
}: InlineFiltersProps) {
    const visibilityArea = useThemeStore((s) => s.visibilityArea);
    const city = useThemeStore((s) => s.city);
    const [openDropdown, setOpenDropdown] = useState<'rubrics' | 'ordering' | null>(null);

    const sortings = useMemo(() => [
        { label: 'Сначала новые', value: '-created_at' },
        { label: 'Сначала старые', value: 'created_at' },
    ], []);

    const currentSorting = useMemo(() =>
        sortings.find(s => s.value === (state.filters.ordering || '-created_at')) || sortings[0],
        [state.filters.ordering, sortings]
    );

    const selectedRubricsCount = useMemo(() =>
        state.filters.rubrics?.length || 0,
        [state.filters.rubrics]
    );

    const rubricsLabel = useMemo(() =>
        selectedRubricsCount === 0
            ? 'Все рубрики'
            : `Рубрики: ${selectedRubricsCount}`,
        [selectedRubricsCount]
    );

    const hasActiveFilters = useMemo(() => {
        if (state.showMine) return true;
        return Object.keys(state.filters).some(key => {
            const val = state.filters[key as keyof typeof state.filters];
            if (val === undefined) return false;
            if (key === 'ordering' && val === '-created_at') return false;
            if (key === 'city' && visibilityArea && val === city) return false;
            return true;
        });
    }, [state.filters, state.showMine, visibilityArea, city]);

    return (
        <View className="bg-white dark:bg-[#1f2937] z-50">
            <View className="px-4 pt-4 pb-1 flex-row items-center justify-between">
                <Text className="font-bold text-gray-900 dark:text-slate-50 text-lg tracking-tight">
                    {state.searchQuery
                        ? 'Результаты поиска'
                        : visibilityArea && city
                            ? `Лента: ${city}`
                            : 'Лента происшествий'
                    }
                </Text>
                {hasActiveFilters && (
                    <TouchableOpacity
                        onPress={() => {
                            const newFilters = visibilityArea && city ? { city } : {};
                            state.setFilters(newFilters);
                            state.setShowMine(false);
                        }}
                        className="bg-blue-500/10 dark:bg-blue-500/20 px-3 py-1.5 rounded-full"
                    >
                        <Text className="text-blue-500 font-semibold text-xs transition-all">Сбросить</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View className="relative">
                <View className="flex-row flex-wrap px-4 py-3 items-center">
                    {/* My Reports Toggle */}
                    <TouchableOpacity
                        onPress={() => state.setShowMine(!state.showMine)}
                        className={`px-3 py-2 mr-2 mb-2 rounded-xl border flex-row items-center gap-2 ${state.showMine
                            ? 'bg-blue-500/10 border-blue-500/30'
                            : 'bg-gray-100/50 dark:bg-slate-800/40 border-gray-200/50 dark:border-slate-700/50'
                            }`}
                    >
                        <User size={14} color={state.showMine ? '#3B82F6' : (isDarkMode ? '#94A3B8' : '#6B7280')} />
                        <Text className={`text-[11px] font-medium ${state.showMine ? 'text-blue-500' : 'text-gray-500 dark:text-slate-400'}`}>
                            Мои
                        </Text>
                    </TouchableOpacity>

                    {/* Rubrics Dropdown Trigger */}
                    <TouchableOpacity
                        onPress={() => setOpenDropdown(openDropdown === 'rubrics' ? null : 'rubrics')}
                        className={`px-3 py-2 mr-2 mb-2 rounded-xl border flex-row items-center gap-2 ${selectedRubricsCount > 0
                            ? 'bg-blue-500/10 border-blue-500/30'
                            : 'bg-gray-100/50 dark:bg-slate-800/40 border-gray-200/50 dark:border-slate-700/50'
                            }`}
                    >
                        <Text className={`text-[11px] font-medium flex-1 ${selectedRubricsCount > 0 ? 'text-blue-500' : 'text-gray-500 dark:text-slate-400'}`}>
                            {rubricsLabel}
                        </Text>
                        <ChevronDown size={14} color={selectedRubricsCount > 0 ? '#3B82F6' : (isDarkMode ? '#94A3B8' : '#6B7280')} />
                    </TouchableOpacity>

                    {/* Sorting Dropdown Trigger */}
                    <TouchableOpacity
                        onPress={() => setOpenDropdown(openDropdown === 'ordering' ? null : 'ordering')}
                        className="px-3 py-2 mr-2 mb-2 rounded-xl border border-gray-200/50 dark:border-slate-700/50 bg-gray-100/50 dark:bg-slate-800/40 flex-row items-center gap-2"
                    >
                        <Clock size={14} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
                        <Text className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                            {currentSorting.label}
                        </Text>
                        <ChevronDown size={14} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
                    </TouchableOpacity>
                </View>

                {/* Dropdown Menus */}
                {openDropdown === 'rubrics' && (
                    <View
                        className="absolute left-4 top-20 bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl z-[100] w-80 py-2 overflow-hidden"
                        style={{ elevation: 25 }}
                    >
                        <ScrollView style={{ maxHeight: 350 }}>
                            <TouchableOpacity
                                className={`px-5 py-3 border-b border-gray-50 dark:border-slate-800 ${!selectedRubricsCount ? 'bg-blue-500/5' : ''}`}
                                onPress={() => {
                                    state.setFilters({ ...state.filters, rubrics: undefined });
                                    setOpenDropdown(null);
                                }}
                            >
                                <Text className={`text-sm ${!selectedRubricsCount ? 'text-blue-500 font-bold' : 'text-gray-700 dark:text-slate-200'}`}>
                                    Все рубрики
                                </Text>
                            </TouchableOpacity>
                            {state.rubrics.map((rubric) => {
                                const isActive = state.filters.rubrics?.includes(rubric);
                                return (
                                    <TouchableOpacity
                                        key={rubric}
                                        className={`px-5 py-3 flex-row items-center justify-between ${isActive ? 'bg-blue-500/5' : ''}`}
                                        onPress={() => {
                                            const current = state.filters.rubrics || [];
                                            const newArr = isActive
                                                ? current.filter(r => r !== rubric)
                                                : [...current, rubric];
                                            state.setFilters({ ...state.filters, rubrics: newArr.length > 0 ? newArr : undefined });
                                        }}
                                    >
                                        <Text className={`text-sm flex-1 ${isActive ? 'text-blue-500 font-bold' : 'text-gray-700 dark:text-slate-200'}`}>
                                            {rubric}
                                        </Text>
                                        {isActive && <View className="w-2 h-2 rounded-full bg-blue-500" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {openDropdown === 'ordering' && (
                    <View
                        className="absolute right-4 top-20 bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl z-[100] w-56 py-2 overflow-hidden"
                        style={{ elevation: 25 }}
                    >
                        {sortings.map((s) => (
                            <TouchableOpacity
                                key={s.label}
                                className={`px-5 py-3 ${state.filters.ordering === s.value ? 'bg-blue-500/5' : ''}`}
                                onPress={() => {
                                    state.setFilters({ ...state.filters, ordering: s.value });
                                    setOpenDropdown(null);
                                }}
                            >
                                <Text className={`text-sm ${state.filters.ordering === s.value ? 'text-blue-500 font-bold' : 'text-gray-700 dark:text-slate-200'}`}>
                                    {s.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}
