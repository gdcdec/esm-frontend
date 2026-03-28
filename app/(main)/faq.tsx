import { useThemeStore } from '@/src/store/themeStore';
import { router } from 'expo-router';
import { ChevronDown, ChevronLeft, ChevronUp, HelpCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FAQ_ITEMS = [
    {
        question: 'Что такое «Мой Донос»?',
        answer: 'Это интерактивная платформа для активных граждан. С её помощью вы можете быстро сообщать о городских проблемах (ямы на дорогах, неубранный мусор, неработающее освещение) и контролировать их решение соответствующими службами.',
    },
    {
        question: 'Как правильно создать обращение?',
        answer: 'Перейдите к созданию заявки, выберите точное место на карте, где обнаружена проблема. Затем укажите подходящую рубрику (например, «Дороги» или «Мусор»), добавьте чёткое фото проблемы и напишите короткое, но понятное описание. Чем точнее данные, тем быстрее решится вопрос.',
    },
    {
        question: 'Что происходит после публикации заявки?',
        answer: 'Сначала заявка проходит первичную модерацию. Если всё корректно, она публикуется на платформе и направляется ответственным ведомствам. Вы будете получать уведомления при смене статуса вашей заявки (например, «В работе» или «Решено»).',
    },
    {
        question: 'Почему мою заявку могли отклонить?',
        answer: 'Заявку могут отклонить («Заблокировано»), если: \n• В тексте используется ненормативная лексика или оскорбления.\n• Прикреплены фото, не относящиеся к проблеме.\n• Проблема находится на частной территории и не относится к ведению городских служб.\n• Дублирование уже существующей проблемы.',
    },
    {
        question: 'Сколько времени занимает решение проблемы?',
        answer: 'Регламентные сроки зависят от категории проблемы. Простые задачи, вроде вывоза мусора или замены лампочки, обычно решаются за 3-8 рабочих дней. Инфраструктурные проблемы (капитальный ремонт ям и теплотрасс) могут занять больше времени.',
    },
    {
        question: 'Могу ли я поддержать чужую заявку?',
        answer: 'Да! В Ленте происшествий вы можете просматривать заявки других пользователей. Если вы столкнулись с той же проблемой, вы можете поддержать её или оставить комментарий (в скором времени). Это покажет властям масштаб проблемы.',
    },
    {
        question: 'Что делает фильтр "Область видимости"?',
        answer: 'Этот фильтр в настройках позволяет ограничить ленту происшествий вашим городом. Если он включен, сервер будет показывать заявки и разрешать подачу новых только в пределах городской черты выбранного вами города.',
    }
];

const FaqItem = ({ question, answer, isDarkMode }: { question: string, answer: string, isDarkMode: boolean }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <View className="bg-white dark:bg-gray-800 rounded-xl mb-3 overflow-hidden border border-gray-100 dark:border-gray-700">
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpanded(!expanded)}
                className="flex-row items-center justify-between p-4"
            >
                <Text className="flex-1 font-semibold text-gray-900 dark:text-gray-100 text-sm mr-2 leading-5">
                    {question}
                </Text>
                {expanded ? (
                    <ChevronUp size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                ) : (
                    <ChevronDown size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                )}
            </TouchableOpacity>

            {expanded && (
                <View className="px-4 pb-4 pt-1 border-t border-gray-50 dark:border-gray-700/50">
                    <Text className="text-sm text-gray-600 dark:text-gray-300 leading-6">
                        {answer}
                    </Text>
                </View>
            )}
        </View>
    );
};

export default function FaqScreen() {
    const { isDarkMode } = useThemeStore();

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
                    <Text className="font-bold text-lg dark:text-gray-100">Справка и FAQ</Text>
                    <View className="w-8" />
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1 px-4">
                <View className="w-full max-w-md self-center py-6">

                    {/* Header Icon */}
                    <View className="items-center mb-6">
                        <View className="w-16 h-16 rounded-full bg-yellow-50 dark:bg-yellow-900/30 items-center justify-center mb-3">
                            <HelpCircle size={32} color="#F59E0B" />
                        </View>
                        <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
                            Частые вопросы
                        </Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 px-4 leading-5">
                            Здесь собраны ответы на самые популярные вопросы о работе платформы.
                        </Text>
                    </View>

                    {/* FAQ List */}
                    <View className="mb-8">
                        {FAQ_ITEMS.map((item, index) => (
                            <FaqItem
                                key={index}
                                question={item.question}
                                answer={item.answer}
                                isDarkMode={isDarkMode}
                            />
                        ))}
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}
