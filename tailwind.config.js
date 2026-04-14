/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
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
                    published: '#34C759',
                    publishedBg: '#DCFCE7',
                    check: '#FF9500',
                    checkBg: '#FFF7ED',
                    draft: '#8E8E93',
                    draftBg: '#F3F4F6',
                    archived: '#8E8E93',
                    archivedBg: '#F3F4F6',
                    banned: '#8E8E93',
                    bannedBg: '#F3F4F6',
                },
            },
            fontFamily: {
                sans: ['Inter', 'System'],
            },
        },
    },
    plugins: [],
};
