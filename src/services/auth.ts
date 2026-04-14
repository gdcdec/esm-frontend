import api from './api';

interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    patronymic?: string;
    phone_number?: string;
    city?: string;
}

interface LoginResponse {
    token: string;
    user_id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    patronymic?: string;
    phone_number?: string;
    city?: string;
}

interface RegisterResponse {
    user: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        patronymic: string;
        phone_number: string;
        city: string;
    };
    token: string;
    message: string;
}

interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name: string;
    last_name: string;
    patronymic: string;
    phone_number: string;
    city: string;
}

interface PasswordResetRequestResponse {
    message: string;
    email: string;
}

interface PasswordResetVerifyResponse {
    message: string;
    verified: boolean;
}

interface PasswordResetConfirmResponse {
    message: string;
}

// ── Сервис авторизации ──────────────────────────────────────────

export const authService = {
    /**
     * Авторизация — POST /auth/login/
     * Поле username принимает как логин, так и email
     */
    login: async (username: string, password: string): Promise<LoginResponse> => {
        const { data } = await api.post<LoginResponse>('/auth/login/', {
            username,
            password,
        });
        return data;
    },

    /**
     * Регистрация — POST /auth/register/
     */
    register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
        const { data } = await api.post<RegisterResponse>('/auth/register/', payload);
        return data;
    },

    /**
     * Выход — POST /auth/logout/
     */
    logout: async (): Promise<void> => {
        await api.post('/auth/logout/');
    },

    /**
     * Сброс пароля шаг 1 — POST /auth/password-reset/request/
     * Отправляет код подтверждения на email пользователя
     */
    requestPasswordReset: async (email: string): Promise<PasswordResetRequestResponse> => {
        const { data } = await api.post<PasswordResetRequestResponse>(
            '/auth/password-reset/request/',
            { email }
        );
        return data;
    },

    /**
     * Сброс пароля шаг 2 — POST /auth/password-reset/verify/
     * Проверяет код из email
     */
    verifyResetCode: async (email: string, code: string): Promise<PasswordResetVerifyResponse> => {
        const { data } = await api.post<PasswordResetVerifyResponse>(
            '/auth/password-reset/verify/',
            { email, code }
        );
        return data;
    },

    /**
     * Сброс пароля шаг 3 — POST /auth/password-reset/confirm/
     * Устанавливает новый пароль
     */
    confirmPasswordReset: async (
        email: string,
        code: string,
        new_password: string
    ): Promise<PasswordResetConfirmResponse> => {
        const { data } = await api.post<PasswordResetConfirmResponse>(
            '/auth/password-reset/confirm/',
            { email, code, new_password, confirm_password: new_password }
        );
        return data;
    },

    /**
     * Получение профиля текущего пользователя — GET /users/me/
     */
    getCurrentUser: async (): Promise<User> => {
        const { data } = await api.get<User>('/users/me/');
        return data;
    },

    /**
     * Обновление профиля текущего пользователя — PATCH /users/me/
     */
    updateCurrentUser: async (updates: Partial<User>): Promise<User> => {
        const { data } = await api.patch<User>('/users/me/', updates);
        return data;
    },

};
