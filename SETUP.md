# SETUP — Мой Донос* (ESM Frontend)

Руководство по установке и запуску фронтенд-части приложения для команды разработки.

## Требования

| Программа | Версия |
|---|---|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| Git | любая |
| Expo Go (мобилка) | Последняя из App Store / Google Play |

> **Опционально для нативной сборки:** Android Studio (Android), Xcode (iOS, только macOS).  
> Для разработки и тестирования достаточно Expo Go.

---

## Быстрый старт

### 1. Клонирование репозитория

```bash
git clone <URL_РЕПОЗИТОРИЯ>
cd esm-frontend
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Запуск

```bash
# Web (в браузере)
npm run web

# Мобилка (сканируй QR в Expo Go)
npm start

# Только Android
npm run android

# Только iOS (macOS)
npm run ios
```

---

## Переменные окружения

Создайте файл `.env` в корне проекта (опционально):

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

По умолчанию API указывает на `http://localhost:8000/api` (Django бэкенд).

---

## Структура проекта

```
esm-frontend/
├── app/                          # Expo Router — файловый роутинг
│   ├── _layout.tsx               # Корневой layout (провайдеры)
│   ├── index.tsx                 # Redirect по состоянию auth
│   ├── (auth)/                   # Группа авторизации
│   │   ├── _layout.tsx
│   │   └── login.tsx             # Экран входа/регистрации
│   └── (main)/                   # Основная группа
│       ├── _layout.tsx
│       ├── map.tsx               # Карта + лента жалоб
│       ├── create.tsx            # Создание новой заявки
│       └── profile.tsx           # Профиль пользователя
│
├── src/
│   ├── components/
│   │   ├── ui/                   # Button, Input, Badge
│   │   ├── ReportCard.tsx        # Карточка жалобы
│   │   ├── MapView.native.tsx    # Карта для Android/iOS (react-native-maps + OSM)
│   │   ├── MapView.web.tsx       # Карта для Web (react-leaflet + OSM)
│   │   └── MapView.tsx           # Re-export (Metro выбирает автоматически)
│   │
│   ├── constants/
│   │   ├── categories.ts         # Категории жалоб
│   │   ├── colors.ts             # Цветовая палитра
│   │   └── mock-data.ts          # Моковые данные
│   │
│   ├── services/
│   │   ├── api.ts                # Axios + JWT interceptors
│   │   ├── auth.ts               # Авторизация (login, register)
│   │   └── reports.ts            # CRUD жалоб
│   │
│   ├── store/
│   │   └── authStore.ts          # Zustand — состояние авторизации
│   │
│   └── types/
│       └── index.ts              # TypeScript интерфейсы
│
├── assets/                       # Изображения, шрифты
├── app.json                      # Expo конфигурация
├── metro.config.js               # Metro + NativeWind
├── tailwind.config.js            # Tailwind конфигурация
├── global.css                    # Tailwind CSS директивы
├── tsconfig.json                 # TypeScript
└── package.json
```

---

## Технологический стек

| Категория | Библиотека |
|---|---|
| Фреймворк | Expo SDK 54, React Native, TypeScript |
| Роутинг | Expo Router (файловый, файлы в `app/`) |
| Состояние (клиент) | Zustand |
| Состояние (сервер) | TanStack Query (React Query) |
| Стилизация | NativeWind v4 (Tailwind CSS) |
| Карты (mobile) | react-native-maps + OpenStreetMap tiles |
| Карты (web) | react-leaflet + Leaflet |
| HTTP | Axios |
| Иконки | lucide-react-native |
| Бэкенд | Django REST Framework + PostgreSQL |

---

## Правила разработки

### Платформо-зависимый код

Для кода, который отличается между Web и Native, используйте расширения файлов:

```
Component.native.tsx  → Android/iOS
Component.web.tsx     → Web
```

Metro/Webpack автоматически подключит нужный файл. **Никогда** не импортируйте `react-leaflet` напрямую в файле без расширения `.web.tsx`.

### Маршрутизация

Файлы в `app/` автоматически становятся роутами:
- `app/(auth)/login.tsx` → `/login`
- `app/(main)/map.tsx` → `/map`
- Группы в скобках `(auth)`, `(main)` не влияют на URL

### Импорты

Используйте алиас `@/`:
```ts
import { Button } from '@/src/components/ui';
import { COLORS } from '@/src/constants/colors';
```

---

## Подключение Django API

1. Запустите Django-сервер:
   ```bash
   cd ../esm-backend
   python manage.py runserver
   ```

2. Установите переменную:
   ```env
   EXPO_PUBLIC_API_URL=http://<IP>:8000/api
   ```

3. При тестировании на физическом устройстве через Expo Go используйте IP вашего компьютера в локальной сети (не `localhost`).

---

## Полезные команды

```bash
npm start          # Запуск Expo dev server
npm run web        # Запуск Web версии
npm run android    # Запуск на Android
npm run ios        # Запуск на iOS
npx tsc --noEmit   # Проверка TypeScript
npx expo lint      # Проверка ESLint
```
