const AUTH_STORAGE_KEY = 'auth';
const DEFAULT_GUEST_AUTH = {
    token: '',
    id: null,
    payload: null,
    email: 'Người dùng',
    roles: [],
    isAuthenticated: false,
    isAdmin: false,
    isOwner: false,
    rawIsOwner: false,
    status: null
};

function buildGuestAuth(overrides = {}) {
    return {
        ...DEFAULT_GUEST_AUTH,
        ...overrides
    };
}

function readStorage(storage, key) {
    try {
        return storage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(storage, key, value) {
    try {
        storage.setItem(key, value);
    } catch {
        // Ignore storage write failures.
    }
}

function removeStorage(storage, key) {
    try {
        storage.removeItem(key);
    } catch {
        // Ignore storage cleanup failures.
    }
}

function getStoredAuthSnapshot() {
    const raw =
        readStorage(localStorage, AUTH_STORAGE_KEY) ||
        readStorage(sessionStorage, AUTH_STORAGE_KEY);

    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

export function normalizeUserId(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const normalized = Number(value);
    return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
}

export function getAuthToken(result) {
    return (
        result?.data?.token ||
        result?.data?.authToken ||
        result?.token ||
        result?.authToken ||
        result?.accessToken ||
        result?.jwt ||
        ''
    );
}

export function getStoredToken() {
    const storedAuth = getStoredAuthSnapshot();

    return (
        readStorage(localStorage, 'token') ||
        readStorage(sessionStorage, 'token') ||
        storedAuth?.token ||
        ''
    );
}

function normalizeRoleValue(role) {
    return typeof role === 'string'
        ? role
        : (role?.authority ?? role?.name ?? '');
}

function decodeJwtPayload(token) {
    const payloadBase64Url = token.split('.')[1];
    if (!payloadBase64Url) {
        throw new Error('Invalid JWT payload.');
    }

    let base64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
    const missingPadding = base64.length % 4;
    if (missingPadding) {
        base64 += '='.repeat(4 - missingPadding);
    }

    return JSON.parse(atob(base64));
}

function isExpiredPayload(payload) {
    const expiration = Number(payload?.exp);

    if (!Number.isFinite(expiration) || expiration <= 0) {
        return false;
    }

    return Date.now() >= expiration * 1000;
}

function buildStoredAuth(result, token = getAuthToken(result)) {
    const responseId = normalizeUserId(result?.id ?? result?.data?.id);
    let payload = null;

    if (token) {
        try {
            payload = decodeJwtPayload(token);
        } catch {
            payload = null;
        }
    }

    return {
        token,
        id: responseId ?? normalizeUserId(payload?.id),
        payload
    };
}

export function persistAuthSession(result, remember = true) {
    const storedAuth = buildStoredAuth(result);
    const targetStorage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;

    if (!storedAuth.token) {
        return storedAuth;
    }

    writeStorage(targetStorage, 'token', storedAuth.token);
    writeStorage(targetStorage, AUTH_STORAGE_KEY, JSON.stringify(storedAuth));

    removeStorage(otherStorage, 'token');
    removeStorage(otherStorage, AUTH_STORAGE_KEY);
    removeStorage(localStorage, 'userId');
    removeStorage(sessionStorage, 'userId');

    return storedAuth;
}

export function clearStoredAuthSession() {
    removeStorage(localStorage, 'token');
    removeStorage(sessionStorage, 'token');
    removeStorage(localStorage, AUTH_STORAGE_KEY);
    removeStorage(sessionStorage, AUTH_STORAGE_KEY);
    removeStorage(localStorage, 'userId');
    removeStorage(sessionStorage, 'userId');
}

export function parseAuthFromToken(token = getStoredToken()) {
    const storedAuth = getStoredAuthSnapshot();
    const resolvedToken = token || storedAuth?.token || '';

    if (!resolvedToken) {
        return buildGuestAuth();
    }

    try {
        const payload = decodeJwtPayload(resolvedToken);
        if (isExpiredPayload(payload)) {
            clearStoredAuthSession();
            return buildGuestAuth();
        }

        const rolesField =
            payload.roles || payload.authorities || payload.role || [];
        const roles = Array.isArray(rolesField) ? rolesField : [rolesField];
        const normalizedRoles = roles.map(normalizeRoleValue);
        const rawIsOwner = normalizedRoles.some((role) =>
            role.toUpperCase().includes('OWNER')
        );
        const isAdmin = normalizedRoles.some((role) =>
            role.toUpperCase().includes('ADMIN')
        );

        return {
            token: resolvedToken,
            id: normalizeUserId(storedAuth?.id) ?? normalizeUserId(payload?.id),
            payload,
            email: payload.sub || payload.email || DEFAULT_GUEST_AUTH.email,
            roles: normalizedRoles,
            isAuthenticated: true,
            isAdmin,
            isOwner: rawIsOwner,
            rawIsOwner,
            status: payload?.status || null
        };
    } catch {
        clearStoredAuthSession();
        return buildGuestAuth({
            id: normalizeUserId(storedAuth?.id)
        });
    }
}

export function getCurrentUserId(auth = parseAuthFromToken()) {
    return normalizeUserId(auth?.id) ?? normalizeUserId(auth?.payload?.id);
}

export function getPostLoginRoute(auth = parseAuthFromToken()) {
    if (auth.isAdmin) return '/admin';
    if (auth.rawIsOwner) return '/account';
    if (auth.isAuthenticated) return '/userprofile';
    return '/auth';
}

export function getAccountLandingRoute(auth = parseAuthFromToken()) {
    if (auth.isAdmin) return '/admin';
    if (!auth.isAuthenticated) return '/auth';
    if (auth.rawIsOwner) return '/account';
    if (auth.isAuthenticated) return '/userprofile';
    return '/auth';
}

