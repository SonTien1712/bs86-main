import axios from 'axios';
import {
    clearStoredAuthSession,
    getStoredToken,
    parseAuthFromToken
} from '../utils/auth';
import { getServerOrigin } from '../config/runtime';

const SESSION_EXPIRED_MESSAGE =
    'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';

function redirectToAuth() {
    if (typeof window === 'undefined') {
        return;
    }

    const { pathname, search, hash } = window.location;
    const nextPath = `${pathname}${search}${hash}`;

    try {
        if (pathname !== '/auth') {
            window.sessionStorage.setItem('spa-redirect-path', nextPath);
        }
    } catch {
        // Ignore storage failures during forced redirect.
    }

    if (pathname !== '/auth') {
        window.location.replace('/auth');
    }
}

const axiosClient = axios.create({
    baseURL: getServerOrigin(),
    headers: {
        'Content-Type': 'application/json'
    }
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = getStoredToken();

        if (!token) {
            return config;
        }

        const auth = parseAuthFromToken(token);
        if (!auth.isAuthenticated) {
            clearStoredAuthSession();
            redirectToAuth();
            return Promise.reject(new Error(SESSION_EXPIRED_MESSAGE));
        }

        config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            clearStoredAuthSession();
            redirectToAuth();
        }

        return Promise.reject(error);
    }
);

export default axiosClient;

