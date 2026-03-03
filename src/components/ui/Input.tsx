import { X } from 'lucide-react-native';
import React, { forwardRef } from 'react';
import { Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    className?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({
    label,
    className = '',
    multiline,
    value,
    onChangeText,
    ...props
}, ref) => {
    const showClearBtn = !multiline && value && value.length > 0 && onChangeText;

    return (
        <View className={`mb-3 ${className}`}>
            {label && (
                <Text className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">{label}</Text>
            )}
            <View className="relative justify-center">
                <TextInput
                    ref={ref}
                    className={`w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-base border border-transparent dark:border-gray-700 text-gray-900 dark:text-gray-100 ${multiline ? 'min-h-[100px]' : showClearBtn ? 'pr-12' : ''
                        }`}
                    placeholderTextColor="#9CA3AF"
                    multiline={multiline}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    value={value}
                    onChangeText={onChangeText}
                    {...props}
                />

                {showClearBtn && (
                    <TouchableOpacity
                        onPress={() => onChangeText('')}
                        className="absolute right-0 top-0 bottom-0 justify-center px-4"
                    >
                        <View className="bg-gray-200 dark:bg-gray-700 rounded-full p-1 opacity-70">
                            <X size={14} color="#4B5563" />
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
});
