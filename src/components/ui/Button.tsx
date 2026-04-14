import { useThemeStore } from '@/src/store/themeStore';
import React from 'react';
import {
    ActivityIndicator,
    Text,
    TouchableOpacity
} from 'react-native';
import { SvgProps } from 'react-native-svg';

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'outline';
    icon?: React.ComponentType<SvgProps>;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({
    onPress,
    title,
    variant = 'primary',
    icon: Icon,
    disabled = false,
    loading = false,
    className = '',
}) => {
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    
    const baseClass = 'py-3 px-5 rounded-xl flex-row items-center justify-center gap-2';

    const variantClasses = {
        primary: 'bg-blue-600 shadow-lg',
        secondary: 'bg-gray-100 dark:bg-gray-800',
        outline: 'border-2 border-blue-600 dark:border-blue-500 bg-transparent',
    };

    const textVariantClasses = {
        primary: 'text-white font-semibold text-base',
        secondary: 'text-gray-900 dark:text-gray-100 font-semibold text-base',
        outline: 'text-blue-600 dark:text-blue-500 font-semibold text-base',
    };

    const disabledClass = disabled ? 'opacity-50' : '';

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            className={`${baseClass} ${variantClasses[variant]} ${disabledClass} ${className}`}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? '#FFFFFF' : isDarkMode ? '#60A5FA' : '#2563EB'}
                    size="small"
                />
            ) : (
                <>
                    {Icon && <Icon width={18} height={18} color={variant === 'primary' ? '#FFFFFF' : isDarkMode ? '#60A5FA' : '#2563EB'} />}
                    <Text className={textVariantClasses[variant]}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};
