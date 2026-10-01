function trimTrailingSlash(value = '') {
    return String(value).replace(/\/+$/, '');
}

export function getApiBaseUrl() {
    if (import.meta.env.VITE_API_URL) {
        return `${trimTrailingSlash(import.meta.env.VITE_API_URL)}/api`;
    }

    if (import.meta.env.VITE_API_BASE_URL) {
        return trimTrailingSlash(import.meta.env.VITE_API_BASE_URL);
    }

    return 'http://localhost:8080/api';
}

export function getServerOrigin() {
    if (import.meta.env.VITE_API_URL) {
        return trimTrailingSlash(import.meta.env.VITE_API_URL);
    }

    if (import.meta.env.VITE_API_BASE_URL) {
        return trimTrailingSlash(import.meta.env.VITE_API_BASE_URL).replace(/\/api$/, '');
    }

    return 'http://localhost:8080';
}
