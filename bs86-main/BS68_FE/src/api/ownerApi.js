import axiosClient from './axiosClient';

function unwrapResponse(response) {
    return response?.data?.data ?? response?.data;
}

export const ownerApi = {
    addField(body) {
        return axiosClient.post('/api/owner/fields', body).then(unwrapResponse);
    },

    addCourts(fieldId, from, to) {
        return axiosClient
            .post(`/api/owner/fields/${fieldId}/courts`, { from, to })
            .then(unwrapResponse);
    },

    getFieldCourts(fieldId) {
        return axiosClient
            .get(`/api/owner/fields/${fieldId}/courts`)
            .then(unwrapResponse)
            .then((data) => (Array.isArray(data) ? data : []));
    },

    addPriceTemplate(fieldId, courtId, body) {
        return axiosClient
            .post(`/api/owner/fields/${fieldId}/courts/${courtId}/template`, body)
            .then(unwrapResponse);
    },

    generateSlots(courtId, date) {
        return axiosClient
            .post(`/api/owner/courts/${courtId}/generate-slots?date=${date}`)
            .then(unwrapResponse);
    },

    blockSlots(courtId, slotIds) {
        return axiosClient
            .post(`/api/owner/courts/${courtId}/slots/block`, { slotIds })
            .then(unwrapResponse);
    },

    createOwnerBooking(courtId, body) {
        return axiosClient
            .post(`/api/owner/courts/${courtId}/bookings`, body)
            .then(unwrapResponse);
    },

    updateCourtStatus(courtId, status) {
        return axiosClient
            .patch(`/api/owner/courts/${courtId}/status`, { status })
            .then(unwrapResponse);
    },

    overridePrice(courtId, body) {
        return axiosClient
            .post(`/api/owner/courts/${courtId}/slots/override-price`, body)
            .then(unwrapResponse);
    },

    getCourtSlots(courtId, date) {
        return axiosClient
            .get(`/api/courts/${courtId}/slots`, { params: { date } })
            .then(unwrapResponse)
            .then((data) => (Array.isArray(data) ? data : []));
    },

    getVerificationStatus() {
        return axiosClient
            .get('/api/owner/verifications/status')
            .then(unwrapResponse);
    },

    submitVerification(body) {
        return axiosClient
            .post('/api/owner/verifications', body)
            .then(unwrapResponse);
    },

    uploadMedia(file, ownerType, ownerId, mediaType) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('ownerType', ownerType);
        formData.append('ownerId', ownerId);
        formData.append('type', mediaType);

        return axiosClient
            .post('/api/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            .then(unwrapResponse);
    },

    getMyFields() {
        return axiosClient.get('/api/owner/fields').then(unwrapResponse);
    },

    getMyFieldDetail(fieldId) {
        return axiosClient
            .get(`/api/owner/fields/${fieldId}`)
            .then(unwrapResponse);
    },

    getFinanceSummary() {
        return axiosClient
            .get('/api/owner/finance/summary')
            .then(unwrapResponse);
    },

    getPayoutRequests(params = {}) {
        return axiosClient
            .get('/api/owner/finance/payout-requests', { params })
            .then(unwrapResponse);
    },

    createPayoutRequest(body) {
        return axiosClient
            .post('/api/owner/finance/payout-requests', body)
            .then(unwrapResponse);
    },

    updatePayoutAccount(body) {
        return axiosClient
            .put('/api/owner/finance/payout-account', body)
            .then(unwrapResponse);
    },

    updateField(fieldId, body) {
        return axiosClient
            .put(`/api/owner/fields/${fieldId}`, body)
            .then(unwrapResponse);
    },

    updateFieldDetail(fieldId, body) {
        return axiosClient
            .put(`/api/owner/fields/${fieldId}/detail`, body)
            .then(unwrapResponse);
    },

    deleteField(fieldId) {
        return axiosClient
            .delete(`/api/owner/fields/${fieldId}`)
            .then(unwrapResponse);
    },

    checkInTicket(body) {
        return axiosClient
            .post('/api/owner/check-in', body)
            .then(unwrapResponse);
    },

    getCheckInHistory() {
        return axiosClient
            .get('/api/owner/check-in-history')
            .then(unwrapResponse)
            .then((data) => (Array.isArray(data) ? data : []));
    }
};
