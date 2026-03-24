import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import { router } from 'expo-router';
import { Bell, CheckSquare, ChevronRight, CloudFog, HelpCircle, Info, MapPin, Moon, Shield, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { Modal, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const user = useAuthStore((s) => s.user);
    const { isDarkMode, setDarkMode, fogOfWar, setFogOfWar, city, setCity } = useThemeStore();
    const { setColorScheme } = useColorScheme();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [showCityModal, setShowCityModal] = useState(false);
    const [citySearchQuery, setCitySearchQuery] = useState('');
    
    const CITIES = ['Самара', 'Москва', 'Санкт-Петербург', 'Владивосток', 'Казань', 'Екатеринбург', 'Нижний Новгород', 'Новосибирск'];

    const filteredCities = CITIES.filter(c => c.toLowerCase().includes(citySearchQuery.toLowerCase()));

    const handleToggleDarkMode = (value: boolean) => {
        setDarkMode(value);
        setColorScheme(value ? 'dark' : 'light');
    };

    const handleAbout = () => {
        router.push('/(main)/about');
    };

    const handleChangeCity = () => {
        setShowCityModal(true);
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <SafeAreaView edges={['top']} className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800">
                <View className="flex-row items-center justify-between px-4 py-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 -ml-2 rounded-full"
                    >
                        <X size={24} color={isDarkMode ? "#F9FAFB" : "#111827"} />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg dark:text-gray-100">Настройки</Text>
                    <View className="w-8" />
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1">
                <View className="w-full max-w-md self-center">
                    {/* Section: Account */}
                    <View className="mt-4 mb-1 px-6">
                        <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            Аккаунт
                        </Text>
                    </View>
                    <View className="bg-white dark:bg-gray-800 px-6 py-1 border-y border-gray-100 dark:border-gray-800 rounded-2xl mb-6">
                        <TouchableOpacity onPress={handleChangeCity} className="flex-row items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700">
                            <View className="flex-row items-center">
                                <View className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
                                    <MapPin size={16} color="#2563EB" />
                                </View>
                                <Text className="text-sm text-gray-900 dark:text-gray-100">Мой город</Text>
                            </View>
                            <View className="flex-row items-center">
                                <Text className="text-xs text-gray-500 dark:text-gray-400 mr-2">{city}</Text>
                                <ChevronRight size={18} color="#9CA3AF" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity className="flex-row items-center justify-between py-3">
                            <View className="flex-row items-center">
                                <View className="w-7 h-7 rounded-full bg-green-50 dark:bg-green-900/30 items-center justify-center mr-3">
                                    <Shield size={16} color="#10B981" />
                                </View>
                                <Text className="text-sm text-gray-900 dark:text-gray-100">Безопасность</Text>
                            </View>
                            <ChevronRight size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* Section: Preferences */}
                    <View className="mt-6 mb-1 px-6">
                        <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            Приложение
                        </Text>
                    </View>
                    <View className="bg-white dark:bg-gray-800 px-6 py-1 border-y border-gray-100 dark:border-gray-800 rounded-2xl mb-6">
                        <View className="flex-row items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700">
                            <View className="flex-row items-center">
                                <View className="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-900/30 items-center justify-center mr-3">
                                    <Bell size={16} color="#8B5CF6" />
                                </View>
                                <Text className="text-sm text-gray-900 dark:text-gray-100">Уведомления</Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: isDarkMode ? '#374151' : '#E5E7EB', true: '#BFDBFE' }}
                                thumbColor={notificationsEnabled ? '#2563EB' : isDarkMode ? '#9CA3AF' : '#F9FAFB'}
                            />
                        </View>

                        <View className="flex-row items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700">
                            <View className="flex-row items-center">
                                <View className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mr-3">
                                    <Moon size={16} color={isDarkMode ? "#D1D5DB" : "#4B5563"} />
                                </View>
                                <Text className="text-sm text-gray-900 dark:text-gray-100">Тёмная тема</Text>
                            </View>
                            <Switch
                                value={isDarkMode}
                                onValueChange={handleToggleDarkMode}
                                trackColor={{ false: isDarkMode ? '#374151' : '#E5E7EB', true: '#BFDBFE' }}
                                thumbColor={isDarkMode ? '#2563EB' : '#F9FAFB'}
                            />
                        </View>

                        <View className="flex-row items-center justify-between py-3">
                            <View className="flex-row items-center">
                                <View className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 items-center justify-center mr-3">
                                    <CloudFog size={16} color="#6366F1" />
                                </View>
                                <Text className="text-sm text-gray-900 dark:text-gray-100">Туман войны</Text>
                            </View>
                            <Switch
                                value={fogOfWar}
                                onValueChange={setFogOfWar}
                                trackColor={{ false: isDarkMode ? '#374151' : '#E5E7EB', true: '#C7D2FE' }}
                                thumbColor={fogOfWar ? '#4F46E5' : isDarkMode ? '#9CA3AF' : '#F9FAFB'}
                            />
                        </View>
                    </View>

                    {/* Section: About & Support */}
                    <View className="mt-6 mb-1 px-6">
                        <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            Поддержка
                        </Text>
                    </View>
                    <View className="bg-white dark:bg-gray-800 px-6 py-1 border-y border-gray-100 dark:border-gray-800 rounded-2xl mb-6">
                        <TouchableOpacity className="flex-row items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700">
                            <View className="flex-row items-center">
                                <View className="w-7 h-7 rounded-full bg-yellow-50 dark:bg-yellow-900/30 items-center justify-center mr-3">
                                    <HelpCircle size={16} color="#F59E0B" />
                                </View>
                                <Text className="text-sm text-gray-900 dark:text-gray-100">Справка и FAQ</Text>
                            </View>
                            <ChevronRight size={18} color="#9CA3AF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center justify-between py-3"
                            onPress={handleAbout}
                        >
                            <View className="flex-row items-center">
                                <View className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-900/30 items-center justify-center mr-3">
                                    <Info size={16} color="#F43F5E" />
                                </View>
                                <Text className="text-sm text-gray-900 dark:text-gray-100">О программе</Text>
                            </View>
                            <ChevronRight size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* City Input Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showCityModal}
                onRequestClose={() => setShowCityModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-4">
                    <View className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-xl leading-relaxed">
                        <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Мой город</Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">Выберите город проживания</Text>

                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100 mb-4"
                            placeholder="Поиск города..."
                            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                            value={citySearchQuery}
                            onChangeText={setCitySearchQuery}
                        />

                        <ScrollView style={{ maxHeight: 250 }} className="mb-4 rounded-xl bg-gray-50 dark:bg-gray-900">
                            {filteredCities.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    onPress={() => {
                                        setCity(c);
                                        setShowCityModal(false);
                                        setCitySearchQuery('');
                                    }}
                                    className={`p-4 border-b border-gray-200 dark:border-gray-800 flex-row justify-between items-center ${city === c ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}
                                >
                                    <Text className={`text-base ${city === c ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {c}
                                    </Text>
                                    {city === c && <CheckSquare size={20} color={isDarkMode ? '#60A5FA' : '#2563EB'} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View className="flex-row justify-end gap-3">
                            <TouchableOpacity
                                onPress={() => setShowCityModal(false)}
                                className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 w-full"
                            >
                                <Text className="text-gray-700 dark:text-gray-300 font-semibold text-center">Отмена</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
