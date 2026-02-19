import React from 'react';
import { Text, TextInput, View } from 'react-native';

interface InputProps {
    placeholder?: string;
    value?: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    multiline?: boolean;
    label?: string;
    className?: string;
}

export const Input: React.FC<InputProps> = ({
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    multiline = false,
    label,
    className = '',
}) => {
    return (
        <View className={`mb-3 ${className}`}>
            {label && (
                <Text className="text-sm font-bold text-gray-900 mb-2">{label}</Text>
            )}
            <TextInput
                className={`w-full bg-gray-50 p-4 rounded-xl text-base border border-transparent text-gray-900 ${multiline ? 'min-h-[100px]' : ''
                    }`}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
            />
        </View>
    );
};
