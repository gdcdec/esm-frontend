import { useThemeStore } from '@/src/store/themeStore';
import { router } from 'expo-router';
import { ChevronLeft, Github, Globe, Mail, Map, Shield } from 'lucide-react-native';
import React from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
    const { isDarkMode } = useThemeStore();

    const handleOpenLicense = async () => {
        try {
            await Linking.openURL('https://github.com/maplibre/maplibre-gl-js/blob/main/LICENSE.txt');
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось открыть ссылку на лицензию');
        }
    };

    const handleOpenWebsite = async () => {
        try {
            await Linking.openURL('https://maplibre.org/');
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось открыть веб-сайт');
        }
    };

    const handleContactEmail = async () => {
        try {
            await Linking.openURL('mailto:support@mojdones.app');
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось открыть почтовое приложение');
        }
    };

    const handleOpenFrontendRepo = async () => {
        try {
            await Linking.openURL('https://github.com/gdcdec/esm-frontend');
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось открыть репозиторий фронтенда');
        }
    };

    const handleOpenBackendRepo = async () => {
        try {
            await Linking.openURL('https://github.com/gdcdec/esm-backend');
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось открыть репозиторий бекенда');
        }
    };

    const InfoSection = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
        <View className="mb-6">
            <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
                    <Icon size={18} color="#2563EB" />
                </View>
                <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</Text>
            </View>
            <View className="ml-11">
                {children}
            </View>
        </View>
    );

    const LinkButton = ({ title, onPress, icon: Icon }: { title: string; onPress: () => void; icon: any }) => (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center justify-between py-3 px-4 bg-white dark:bg-gray-800 rounded-xl mb-2 border border-gray-100 dark:border-gray-700"
        >
            <View className="flex-row items-center">
                <Icon size={16} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                <Text className="ml-3 text-sm text-gray-900 dark:text-gray-100">{title}</Text>
            </View>
            <ChevronLeft size={16} color={isDarkMode ? "#9CA3AF" : "#6B7280"} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <SafeAreaView edges={['top']} className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800">
                <View className="flex-row items-center justify-between px-4 py-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 -ml-2 rounded-full"
                    >
                        <ChevronLeft size={24} color={isDarkMode ? "#F9FAFB" : "#111827"} />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg dark:text-gray-100">О программе</Text>
                    <View className="w-8" />
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1 px-6">
                <View className="w-full max-w-md self-center py-6">
                    
                    {/* App Info */}
                    <InfoSection title="Мой Донос" icon={Shield}>
                        <Text className="text-sm text-gray-600 dark:text-gray-400 leading-6 mb-3">
                            Версия 1.0.0
                        </Text>
                        <Text className="text-sm text-gray-700 dark:text-gray-300 leading-6">
                            Платформа для гражданского участия в улучшении городской среды. 
                            Сообщайте о проблемах и помогайте сделать наш город лучше.
                        </Text>
                    </InfoSection>

                    {/* Maps */}
                    <InfoSection title="Карты" icon={Map}>
                        <LinkButton
                            title="Лицензия MapLibre GL"
                            onPress={handleOpenLicense}
                            icon={Shield}
                        />
                        
                        <LinkButton
                            title="Официальный сайт MapLibre"
                            onPress={handleOpenWebsite}
                            icon={Globe}
                        />
                    </InfoSection>

                    {/* Contact */}
                    <InfoSection title="Контакты" icon={Mail}>
                        
                        <LinkButton
                            title="support@mojdones.app"
                            onPress={handleContactEmail}
                            icon={Mail}
                        />
                    </InfoSection>

                    {/* GitHub */}
                    <InfoSection title="Разработка" icon={Github}>
                        
                        <LinkButton
                            title="Frontend"
                            onPress={handleOpenFrontendRepo}
                            icon={Github}
                        />
                        
                        <LinkButton
                            title="Backend"
                            onPress={handleOpenBackendRepo}
                            icon={Github}
                        />

                    </InfoSection>

                    {/* Footer */}
                    <View className="mt-8 mb-6">
                        <Text className="text-center text-xs text-gray-500 dark:text-gray-400">
                            С заботой о городе{'\n'}
                            © 2026 Мой Донос
                        </Text>
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}
