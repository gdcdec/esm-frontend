import api from './api';

interface LoginResponse {
    token: string;
    user_id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
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

// ── Auth service ────────────────────────────────────────────────

export const authService = {
    /**
     * Login — POST /auth/login/
     * Username field accepts both username and email
     */
    login: async (username: string, password: string): Promise<LoginResponse> => {
        const { data } = await api.post<LoginResponse>('/auth/login/', {
            username,
            password,
        });
        return data;
    },

    /**
     * Register — POST /auth/register/
     */
    register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
        const { data } = await api.post<RegisterResponse>('/auth/register/', payload);
        return data;
    },

    /**
     * Logout — POST /auth/logout/
     */
    logout: async (): Promise<void> => {
        await api.post('/auth/logout/');
    },

    /**
     * Password reset step 1 — POST /auth/password-reset/request/
     * Sends a confirmation code to the user's email
     */
    requestPasswordReset: async (email: string): Promise<PasswordResetRequestResponse> => {
        const { data } = await api.post<PasswordResetRequestResponse>(
            '/auth/password-reset/request/',
            { email }
        );
        return data;
    },

    /**
     * Password reset step 2 — POST /auth/password-reset/verify/
     * Verifies the code from the email
     */
    verifyResetCode: async (email: string, code: string): Promise<PasswordResetVerifyResponse> => {
        const { data } = await api.post<PasswordResetVerifyResponse>(
            '/auth/password-reset/verify/',
            { email, code }
        );
        return data;
    },

    /**
     * Password reset step 3 — POST /auth/password-reset/confirm/
     * Sets the new password
     */
    confirmPasswordReset: async (
        email: string,
        code: string,
        new_password: string
    ): Promise<PasswordResetConfirmResponse> => {
        const { data } = await api.post<PasswordResetConfirmResponse>(
            '/auth/password-reset/confirm/',
            { email, code, new_password }
        );
        return data;
    },
};
