export function getApiErrorMessage(error, fallback = 'Request failed') {
    const responseData = error?.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
        return responseData;
    }

    if (responseData && typeof responseData === 'object') {
        if (typeof responseData.message === 'string' && responseData.message.trim()) {
            return responseData.message;
        }

        const fieldMessages = Object.values(responseData).filter(
            (value) => typeof value === 'string' && value.trim()
        );
        if (fieldMessages.length > 0) {
            return fieldMessages.join(' ');
        }
    }

    return error?.message || fallback;
}
