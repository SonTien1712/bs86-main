export function formatPassMoney(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
        return '--';
    }

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount);
}

export function formatPassDate(value) {
    if (!value) {
        return '--';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(date);
}

export function formatPassDateTime(value) {
    if (!value) {
        return '--';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

export function formatPassTime(value) {
    if (!value) {
        return '--';
    }

    const normalized = String(value);
    return normalized.length >= 5 ? normalized.slice(0, 5) : normalized;
}

export function getPassConversationStatusLabel(status) {
    const normalized = String(status || '').trim().toUpperCase();

    if (normalized === 'OPEN') return 'Đang mở';
    if (normalized === 'CLOSED') return 'Đã đóng';
    if (normalized === 'COMPLETED') return 'Hoàn tất';
    return normalized || 'Không xác định';
}

export function getPassPostStatusLabel(status) {
    const normalized = String(status || '').trim().toUpperCase();

    if (normalized === 'ACTIVE') return 'Đang mở';
    if (normalized === 'CLOSED') return 'Đã đóng';
    if (normalized === 'COMPLETED') return 'Hoàn tất';
    if (normalized === 'CANCELLED') return 'Đã hủy';
    return normalized || 'Không xác định';
}

export function isTransferableTicketStatus(status) {
    return String(status || '').trim().toUpperCase() === 'ISSUED';
}

export function normalizePassConversationMessage(message) {
    return {
        id: message?.id ?? '',
        conversationId:
            message?.conversationId ?? message?.passConversationId ?? message?.conversation?.id ?? '',
        senderUserId: message?.senderUserId ?? message?.senderId ?? '',
        senderFullName: message?.senderFullName || message?.senderName || 'Unknown user',
        content: message?.content || '',
        createdAt: message?.createdAt || '',
        updatedAt: message?.updatedAt || message?.createdAt || ''
    };
}

export function mergePassConversationMessages(currentMessages, incomingMessages) {
    const byId = new Map();

    [...currentMessages, ...incomingMessages]
        .map(normalizePassConversationMessage)
        .forEach((message) => {
            if (!message?.id) {
                return;
            }

            byId.set(message.id, message);
        });

    return Array.from(byId.values()).sort((left, right) => {
        const leftTime = new Date(left.createdAt || left.updatedAt || 0).getTime();
        const rightTime = new Date(right.createdAt || right.updatedAt || 0).getTime();

        if (leftTime !== rightTime) {
            return leftTime - rightTime;
        }

        return Number(left.id || 0) - Number(right.id || 0);
    });
}

export function getApiErrorMessage(error, fallback) {
    const responseData = error?.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
        return responseData;
    }

    const fieldErrors = responseData?.errors;
    if (fieldErrors && typeof fieldErrors === 'object') {
        const collected = Object.values(fieldErrors)
            .filter((value) => typeof value === 'string' && value.trim())
            .join(' ');

        if (collected) {
            return collected;
        }
    }

    return responseData?.message || responseData?.error || error?.message || fallback;
}
