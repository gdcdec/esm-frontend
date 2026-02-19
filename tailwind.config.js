/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,jsx,ts,tsx}',
        './src/**/*.{js,jsx,ts,tsx}',
        './components/**/*.{js,jsx,ts,tsx}',
    ],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#EBF5FF',
                    100: '#DBEAFE',
                    500: '#3B82F6',
                    600: '#2563EB',
                    700: '#1D4ED8',
                },
                status: {
                    solved: '#34C759',
                    progress: '#FF9500',
                    pending: '#8E8E93',
                },
            },
            fontFamily: {
                sans: ['Inter', 'System'],
            },
        },
    },
    plugins: [],
};
