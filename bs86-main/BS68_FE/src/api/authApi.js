import { getApiBaseUrl } from '../config/runtime';

const BASE_URL = getApiBaseUrl();

async function handleResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
        const error = new Error(data?.message || 'Request failed');
        error.status = response.status;
        error.errors = data?.errors;
        throw error;
    }

    return data;
}

function toPayload(payloadOrEmail, password) {
    if (typeof payloadOrEmail === 'object' && payloadOrEmail !== null) {
        return payloadOrEmail;
    }

    if (typeof payloadOrEmail === 'string') {
        return password === undefined
            ? { email: payloadOrEmail }
            : { email: payloadOrEmail, password };
    }

    return {};
}

async function post(endpoint, payload) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    return handleResponse(response);
}

function normalizeLoginResult(result) {
    const token =
        result?.data?.token ||
        result?.data?.authToken ||
        result?.token ||
        result?.authToken ||
        result?.accessToken ||
        result?.jwt ||
        '';

    if (!token) {
        return result;
    }

    const data = typeof result?.data === 'object' && result.data !== null ? result.data : {};

    return {
        ...result,
        data: {
            ...data,
            token
        }
    };
}

export async function register(payloadOrEmail, password) {
    return post('/auth/register', toPayload(payloadOrEmail, password));
}

export const registerUser = register;
export const sendOTP = register;

export async function resendOTP(payloadOrEmail, password) {
    return post('/auth/register', toPayload(payloadOrEmail, password));
}

export async function verifyOTP(emailOrPayload, otpCode, password) {
    const payload =
        typeof emailOrPayload === 'object' && emailOrPayload !== null
            ? emailOrPayload
            : {
                  email: emailOrPayload,
                  otpCode,
                  ...(password !== undefined ? { password } : {})
              };

    return post('/auth/verify', payload);
}

export async function login(payloadOrEmail, password) {
    const result = await post('/auth/login', toPayload(payloadOrEmail, password));
    return normalizeLoginResult(result);
}

export const loginUser = login;

export async function googleLogin(idTokenOrPayload) {
    const payload =
        typeof idTokenOrPayload === 'object' && idTokenOrPayload !== null
            ? idTokenOrPayload
            : { idToken: idTokenOrPayload };

    const result = await post('/auth/google', payload);
    return normalizeLoginResult(result);
}

export const loginWithGmail = googleLogin;

export async function requestPasswordReset(emailOrPayload) {
    const payload =
        typeof emailOrPayload === 'object' && emailOrPayload !== null
            ? emailOrPayload
            : { email: emailOrPayload };

    return post('/auth/reset/request', payload);
}

export async function confirmPasswordReset(emailOrPayload, otpCode, newPassword) {
    const payload =
        typeof emailOrPayload === 'object' && emailOrPayload !== null
            ? emailOrPayload
            : { email: emailOrPayload, otpCode, newPassword };

    return post('/auth/reset/confirm', payload);
}

export async function registerCustomer(customerData) {
    return post('/auth/register/customer', customerData);
}

export async function registerOwner(ownerData) {
    return post('/auth/register/owner', ownerData);
}

export async function checkEmail(email) {
    const response = await fetch(`${BASE_URL}/auth/check-email?email=${encodeURIComponent(email)}`);
    return handleResponse(response);
}

export const authApi = {
    register,
    resendOTP,
    verifyOTP,
    login,
    googleLogin,
    requestPasswordReset,
    confirmPasswordReset,
    registerCustomer,
    registerOwner,
    checkEmail,
};

export default authApi;
