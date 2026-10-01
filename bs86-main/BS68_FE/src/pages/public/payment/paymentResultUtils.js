export function formatAmount(amount) {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
        return '--';
    }

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(value);
}

export function formatDateTime(value) {
    if (!value) {
        return '--';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
}

export function getErrorMessage(error, fallback) {
    const responseData = error?.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
        return responseData;
    }

    return (
        responseData?.message ||
        responseData?.error ||
        error?.message ||
        fallback
    );
}

export function normalizeStatus(value) {
    return String(value || '')
        .trim()
        .toUpperCase();
}

export function getPaymentStatus(data) {
    return (
        data?.paymentStatus ||
        data?.transactionStatus ||
        data?.status ||
        data?.paymentResult ||
        ''
    );
}

export function isSuccessPaymentResult(data) {
    const status = normalizeStatus(getPaymentStatus(data));
    const bookingStatus = normalizeStatus(data?.bookingStatus);

    return (
        data?.paid === true ||
        status === 'SUCCESS' ||
        status === 'PAID' ||
        bookingStatus === 'CONFIRMED'
    );
}

export function isFailurePaymentResult(data) {
    const status = normalizeStatus(getPaymentStatus(data));
    const bookingStatus = normalizeStatus(data?.bookingStatus);

    return (
        data?.paid === false ||
        status === 'FAILED' ||
        status === 'CANCELLED' ||
        status === 'EXPIRED' ||
        bookingStatus === 'CANCELLED' ||
        bookingStatus === 'EXPIRED'
    );
}

export function getResultMessage(data, fallback = '') {
    return (
        data?.message ||
        data?.failReason ||
        data?.reason ||
        data?.description ||
        fallback
    );
}

export function getBookingReturnTarget(data, fallback = '/home') {
    const bookingPath = data?.bookingUrl || data?.bookingPath;
    if (bookingPath) {
        return bookingPath;
    }

    const fieldId = Number(data?.fieldId);
    if (Number.isInteger(fieldId) && fieldId > 0) {
        return `/booking/${fieldId}`;
    }

    const bookingId = Number(data?.bookingId);
    if (Number.isInteger(bookingId) && bookingId > 0) {
        return `/bookings/${bookingId}`;
    }

    const callbackTarget = data?.returnUrl || data?.redirectUrl;
    if (
        callbackTarget &&
        typeof callbackTarget === 'string' &&
        !callbackTarget.includes('/payment-result')
    ) {
        return callbackTarget;
    }

    return (
        callbackTarget ||
        fallback
    );
}

export function getTransactionLabel(data) {
    return getPaymentStatus(data) || '--';
}
