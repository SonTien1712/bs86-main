const LIST_KEYS = [
    'data',
    'items',
    'content',
    'results',
    'rows',
    'list',
    'pendingFields',
    'pendingOwners',
    'pendingReports',
    'topReportedFields'
];

export function unwrapData(payload) {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return payload.data;
    }

    return payload;
}

export function extractList(payload) {
    const value = unwrapData(payload);

    if (Array.isArray(value)) {
        return value;
    }

    if (!value || typeof value !== 'object') {
        return [];
    }

    for (const key of LIST_KEYS) {
        if (Array.isArray(value[key])) {
            return value[key];
        }
    }

    for (const key of LIST_KEYS) {
        const nested = value[key];

        if (nested && typeof nested === 'object') {
            const nestedList = extractList(nested);

            if (nestedList.length > 0) {
                return nestedList;
            }
        }
    }

    return [];
}

export function extractCount(payload) {
    return extractList(payload).length;
}
