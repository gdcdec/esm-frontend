import { Button, Input } from '@/src/components/ui';
import { CATEGORIES } from '@/src/constants/categories';
import { router } from 'expo-router';
import { Camera, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateReportScreen() {
    const [category, setCategory] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [address, setAddress] = useState('');
    const [desc, setDesc] = useState('');

    const handleSubmit = () => {
        if (!category || !title) {
            Alert.alert('Ошибка', 'Заполните обязательные поля');
            return;
        }
        // TODO: API call to create report
        Alert.alert('Успех', 'Заявка отправлена!', [
            { text: 'OK', onPress: () => router.back() },
        ]);
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <SafeAreaView edges={['top']} className="bg-white border-b border-gray-100">
                <View className="flex-row items-center justify-between px-4 py-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 -ml-2 rounded-full"
                    >
                        <X size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg">Новая заявка</Text>
                    <View className="w-8" />
                </View>
            </SafeAreaView>

            {/* Form */}
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    className="flex-1 p-5"
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Step 1: Category */}
                    <Text className="text-sm font-bold text-gray-900 mb-3">
                        1. Что случилось?
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-6 -mx-5 px-5"
                    >
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setCategory(cat.id)}
                                className={`w-20 items-center p-3 rounded-xl border mr-3 ${category === cat.id
                                        ? 'bg-blue-50 border-blue-500'
                                        : 'bg-gray-50 border-transparent'
                                    }`}
                            >
                                <View
                                    className="w-10 h-10 rounded-full items-center justify-center mb-2"
                                    style={{ backgroundColor: cat.color + '30' }}
                                >
                                    <Text className="text-xl">{cat.icon}</Text>
                                </View>
                                <Text
                                    className="text-xs font-medium text-center"
                                    numberOfLines={1}
                                >
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Step 2: Details */}
                    <Text className="text-sm font-bold text-gray-900 mb-3">
                        2. Детали
                    </Text>
                    <Input
                        placeholder="Краткое название"
                        value={title}
                        onChangeText={setTitle}
                    />
                    <Input
                        placeholder="Адрес (например: ул. Ленина, 10)"
                        value={address}
                        onChangeText={setAddress}
                    />
                    <Input
                        placeholder="Подробное описание..."
                        multiline
                        value={desc}
                        onChangeText={setDesc}
                    />

                    {/* Step 3: Photo */}
                    <Text className="text-sm font-bold text-gray-900 mb-3">
                        3. Фотография
                    </Text>
                    <TouchableOpacity className="w-full h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center">
                        <Camera size={32} color="#9CA3AF" />
                        <Text className="text-sm text-gray-400 mt-2">Добавить фото</Text>
                    </TouchableOpacity>

                    <View className="h-20" />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Submit */}
            <SafeAreaView edges={['bottom']} className="border-t border-gray-100 bg-white px-5 py-3">
                <Button title="Отправить" onPress={handleSubmit} />
            </SafeAreaView>
        </View>
    );
}
