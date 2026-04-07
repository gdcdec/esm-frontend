/**
 * Централизованное отображение статусов жалоб
 */

import { ReportStatus } from '@/src/types';

export interface StatusConfig {
    label: string;
    bg: string;
    text: string;
}

export const STATUS_CONFIG: Record<ReportStatus, StatusConfig> = {
    draft: {
        label: 'Черновик',
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-600 dark:text-gray-300',
    },
    published: {
        label: 'Опубликован',
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
    },
    check: {
        label: 'На рассмотрении',
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-300',
    },
    archived: {
        label: 'В архиве',
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-300',
    },
    banned: {
        label: 'Забанен',
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
    },
};

/**
 * Получение конфигурации статуса по значению
 * Поддерживает коды (например, 'published') и названия (например, 'Опубликован')
 * Возвращает значение по умолчанию (check) при некорректном статусе
 */
export function getStatusConfig(status: string | undefined | null): StatusConfig {
    const rawStatus = (status || '').toString().toLowerCase().trim();

    // Поиск по коду (draft, published и т.д.)
    if (STATUS_CONFIG[rawStatus as ReportStatus]) {
        return STATUS_CONFIG[rawStatus as ReportStatus];
    }

    // Сопоставление названий с кодами (когда API возвращает названия)
    const displayToCode: Record<string, ReportStatus> = {
        'черновик': 'draft',
        'опубликован': 'published',
        'в архиве': 'archived',
        'на рассмотрении': 'check',
        'забанен': 'banned',
    };

    const code = displayToCode[rawStatus];
    if (code && STATUS_CONFIG[code]) {
        return STATUS_CONFIG[code];
    }

    return STATUS_CONFIG.check;
}
