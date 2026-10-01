import { useState } from 'react';
import { authApi } from '../api/authApi';
import {
    clearStoredAuthSession,
    getAuthToken,
    getPostLoginRoute,
    parseAuthFromToken,
    persistAuthSession
} from '../utils/auth';

function normalizeError(error) {
    const responseData = error?.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
        return responseData;
    }

    if (responseData && typeof responseData === 'object') {
        if (typeof responseData.message === 'string' && responseData.message.trim()) {
            return responseData.message;
        }

        const fieldMessages = Object.values(responseData).filter((value) => typeof value === 'string' && value.trim());
        if (fieldMessages.length > 0) {
            return fieldMessages.join(' ');
        }
    }

    const message = error?.message || '';
    if (message.toLowerCase().includes('email not verified')) {
        return 'Email chưa xác thực. Vui lòng xác thực OTP trước khi đăng nhập.';
    }

    return message || 'Request failed';
}

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const register = async (email, password) => {
        setLoading(true);
        setError('');

        try {
            const data = await authApi.register({ email, password });
            return { success: true, data };
        } catch (err) {
            const message = normalizeError(err);
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const verifyRegistration = async (email, otpCode, password) => {
        setLoading(true);
        setError('');

        try {
            const data = await authApi.verifyOTP({ email, otpCode, password });
            return { success: true, data };
        } catch (err) {
            const message = normalizeError(err);
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password, options = {}) => {
        setLoading(true);
        setError('');

        try {
            const data = await authApi.login({ email, password });
            const token = getAuthToken(data);

            if (token) {
                const remember = options.remember ?? true;
                persistAuthSession(data, remember);
                const auth = parseAuthFromToken(token);

                return {
                    success: true,
                    data,
                    token,
                    auth,
                    redirectTo: getPostLoginRoute(auth),
                    requiresSessionSupport: false
                };
            }

            clearStoredAuthSession();

            return {
                success: true,
                data,
                token: '',
                redirectTo: '',
                requiresSessionSupport: true
            };
        } catch (err) {
            const message = normalizeError(err);
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const loginWithGmailAccount = async (idToken) => {
        setLoading(true);
        setError('');

        try {
            const data = await authApi.googleLogin({ idToken });
            const token = getAuthToken(data);

            if (token) {
                persistAuthSession(data, true);
                const auth = parseAuthFromToken(token);

                return {
                    success: true,
                    data,
                    token,
                    auth,
                    redirectTo: getPostLoginRoute(auth),
                    requiresSessionSupport: false
                };
            }

            clearStoredAuthSession();

            return {
                success: true,
                data,
                token: '',
                redirectTo: '',
                requiresSessionSupport: true
            };
        } catch (err) {
            const message = normalizeError(err);
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const requestPasswordReset = async (email) => {
        setLoading(true);
        setError('');

        try {
            const data = await authApi.requestPasswordReset({ email });
            return { success: true, data };
        } catch (err) {
            const message = normalizeError(err);
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const confirmPasswordReset = async (email, otpCode, newPassword) => {
        setLoading(true);
        setError('');

        try {
            const data = await authApi.confirmPasswordReset({
                email,
                otpCode,
                newPassword
            });
            return { success: true, data };
        } catch (err) {
            const message = normalizeError(err);
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        clearStoredAuthSession();
        setError('');
        return { success: true };
    };

    return {
        loading,
        error,
        register,
        verifyRegistration,
        login,
        loginWithGmailAccount,
        requestPasswordReset,
        confirmPasswordReset,
        logout
    };
};
