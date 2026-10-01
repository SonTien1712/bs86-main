import axiosClient from './axiosClient';

export const PENDING_PAYMENT_STORAGE_KEY = 'pending-booking-payment';
export const PENDING_PAYMENT_QUEUE_STORAGE_KEY = 'pending-booking-payment-queue';

function normalizeBookingId(bookingId) {
    const normalized = Number(bookingId);
    return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
}

function normalizeTransactionId(transactionId) {
    if (transactionId == null) {
        return '';
    }

    return String(transactionId).trim();
}

function normalizeSearchString(search) {
    if (!search) {
        return '';
    }

    if (typeof search === 'string') {
        return search.startsWith('?') ? search : `?${search}`;
    }

    if (search instanceof URLSearchParams) {
        const serialized = search.toString();
        return serialized ? `?${serialized}` : '';
    }

    return '';
}

export function unwrapApiResponse(response) {
    return response?.data?.data ?? response?.data ?? null;
}

function normalizePendingPaymentItem(payload) {
    const bookingId = normalizeBookingId(payload?.bookingId);

    if (!bookingId) {
        return null;
    }

    return {
        bookingId,
        fieldId: payload?.fieldId ?? null,
        bookingDate: payload?.bookingDate ?? null,
        createdAt: Number(payload?.createdAt) || Date.now()
    };
}

export function hasVnpayParams(search) {
    const normalizedSearch = normalizeSearchString(search);
    if (!normalizedSearch) {
        return false;
    }

    const params = new URLSearchParams(normalizedSearch.slice(1));
    for (const key of params.keys()) {
        if (key.toLowerCase().startsWith('vnp_')) {
            return true;
        }
    }

    return (
        params.has('vnp_TxnRef') ||
        params.has('vnp_ResponseCode') ||
        params.has('vnp_SecureHash')
    );
}

function buildHistoryParams(statusOrOptions) {
    if (!statusOrOptions) {
        return {};
    }

    if (typeof statusOrOptions === 'object' && !Array.isArray(statusOrOptions)) {
        const params = {};
        const normalizedStatus = String(statusOrOptions.status || '').trim().toUpperCase();
        const normalizedPage = Number(statusOrOptions.page);
        const normalizedSize = Number(statusOrOptions.size);

        if (normalizedStatus && normalizedStatus !== 'ALL') {
            params.status = normalizedStatus;
        }

        if (Number.isInteger(normalizedPage) && normalizedPage >= 0) {
            params.page = normalizedPage;
        }

        if (Number.isInteger(normalizedSize) && normalizedSize > 0) {
            params.size = normalizedSize;
        }

        return params;
    }

    const normalizedStatus = String(statusOrOptions).trim().toUpperCase();
    return normalizedStatus && normalizedStatus !== 'ALL' ? { status: normalizedStatus } : {};
}

export async function createVnpayPayment(bookingId) {
    const normalizedBookingId = normalizeBookingId(bookingId);

    if (!normalizedBookingId) {
        throw new Error('Missing booking id for VNPay payment.');
    }

    const response = await axiosClient.post('/api/payments/vnpay/create', {
        bookingId: normalizedBookingId
    });
    const data = unwrapApiResponse(response);

    if (!data?.paymentUrl) {
        throw new Error('Missing VNPay redirect URL.');
    }

    return data;
}

export async function cancelPendingPayment(bookingId) {
    const normalizedBookingId = normalizeBookingId(bookingId);

    if (!normalizedBookingId) {
        throw new Error('Missing booking id for cancellation.');
    }

    const response = await axiosClient.post(`/api/payments/bookings/${normalizedBookingId}/cancel`);
    return unwrapApiResponse(response);
}

export function rememberPendingPayment(payload) {
    if (typeof window === 'undefined') {
        return;
    }

    const bookingId = normalizeBookingId(payload?.bookingId);
    if (!bookingId) {
        return;
    }

    window.sessionStorage.setItem(
        PENDING_PAYMENT_STORAGE_KEY,
        JSON.stringify({
            bookingId,
            fieldId: payload?.fieldId ?? null,
            bookingDate: payload?.bookingDate ?? null,
            createdAt: Date.now()
        })
    );
}

function writePendingPaymentQueue(items) {
    if (typeof window === 'undefined') {
        return;
    }

    if (!Array.isArray(items) || items.length === 0) {
        clearPendingPaymentQueue();
        return;
    }

    window.sessionStorage.setItem(
        PENDING_PAYMENT_QUEUE_STORAGE_KEY,
        JSON.stringify(items)
    );
}

export function rememberPendingPaymentQueue(payloads) {
    if (typeof window === 'undefined') {
        return;
    }

    const items = (Array.isArray(payloads) ? payloads : [])
        .map(normalizePendingPaymentItem)
        .filter(Boolean);

    writePendingPaymentQueue(items);
}

export function getPendingPayment() {
    if (typeof window === 'undefined') {
        return null;
    }

    const rawValue = window.sessionStorage.getItem(PENDING_PAYMENT_STORAGE_KEY);
    if (!rawValue) {
        return null;
    }

    try {
        const parsed = JSON.parse(rawValue);
        const bookingId = normalizeBookingId(parsed?.bookingId);
        if (!bookingId) {
            clearPendingPayment();
            return null;
        }

        return {
            bookingId,
            fieldId: parsed?.fieldId ?? null,
            bookingDate: parsed?.bookingDate ?? null,
            createdAt: Number(parsed?.createdAt) || null
        };
    } catch (error) {
        clearPendingPayment();
        return null;
    }
}

export function getPendingPaymentQueue() {
    if (typeof window === 'undefined') {
        return [];
    }

    const rawValue = window.sessionStorage.getItem(PENDING_PAYMENT_QUEUE_STORAGE_KEY);
    if (!rawValue) {
        return [];
    }

    try {
        const parsed = JSON.parse(rawValue);
        const items = (Array.isArray(parsed) ? parsed : [])
            .map(normalizePendingPaymentItem)
            .filter(Boolean);

        if (items.length === 0) {
            clearPendingPaymentQueue();
        }

        return items;
    } catch (error) {
        clearPendingPaymentQueue();
        return [];
    }
}

export function consumePendingPaymentQueue(bookingId = null) {
    const queue = getPendingPaymentQueue();

    if (queue.length === 0) {
        return {
            current: null,
            next: null,
            remainingCount: 0
        };
    }

    const normalizedBookingId = normalizeBookingId(bookingId);
    let currentIndex = normalizedBookingId
        ? queue.findIndex((item) => item.bookingId === normalizedBookingId)
        : 0;

    if (currentIndex < 0) {
        currentIndex = 0;
    }

    const current = queue[currentIndex] || null;
    const remaining = queue.filter((_, index) => index !== currentIndex);

    writePendingPaymentQueue(remaining);

    return {
        current,
        next: remaining[0] || null,
        remainingCount: remaining.length
    };
}

export function clearPendingPayment() {
    if (typeof window === 'undefined') {
        return;
    }

    window.sessionStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
}

export function clearPendingPaymentQueue() {
    if (typeof window === 'undefined') {
        return;
    }

    window.sessionStorage.removeItem(PENDING_PAYMENT_QUEUE_STORAGE_KEY);
}

export async function verifyVnpayReturn(search) {
    const normalizedSearch = normalizeSearchString(search);

    if (!normalizedSearch) {
        throw new Error('Missing VNPay return parameters.');
    }

    const response = await axiosClient.get(`/api/payments/vnpay/return${normalizedSearch}`);
    return unwrapApiResponse(response);
}

export async function getMyTransactionHistory(statusOrOptions) {
    const params = buildHistoryParams(statusOrOptions);
    const response = await axiosClient.get('/api/transactions/my-history', { params });
    return unwrapApiResponse(response);
}

export async function getTransactionDetail(transactionId) {
    const normalizedTransactionId = normalizeTransactionId(transactionId);

    if (!normalizedTransactionId) {
        throw new Error('Missing transaction id.');
    }

    const response = await axiosClient.get(`/api/transactions/${normalizedTransactionId}`);
    return unwrapApiResponse(response);
}
