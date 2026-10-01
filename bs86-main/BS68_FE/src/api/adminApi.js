import axiosClient from './axiosClient';

function unwrapResponse(response) {
    return response?.data;
}

export const adminApi = {
    getPendingOwners() {
        return axiosClient
            .get('/api/admin/owners/pending')
            .then(unwrapResponse);
    },

    getManagedOwners() {
        return axiosClient
            .get('/api/admin/owners/managed')
            .then(unwrapResponse);
    },

    approveOwner(verificationId) {
        return axiosClient
            .post(`/api/admin/owners/verifications/${verificationId}/approve`)
            .then(unwrapResponse);
    },

    rejectOwner(verificationId, reason) {
        return axiosClient
            .post(
                `/api/admin/owners/verifications/${verificationId}/reject`,
                null,
                {
                    params: { reason }
                }
            )
            .then(unwrapResponse);
    },

    blockOwner(userId, reason) {
        return axiosClient
            .post(`/api/admin/owners/${userId}/lock`, null, {
                params: { reason }
            })
            .then(unwrapResponse);
    },

    activateOwner(userId, reason) {
        return axiosClient
            .post(`/api/admin/owners/${userId}/unlock`, null, {
                params: reason ? { reason } : {}
            })
            .then(unwrapResponse);
    },

    getPendingFields() {
        return axiosClient
            .get('/api/admin/fields/pending')
            .then(unwrapResponse);
    },

    approveField(fieldId) {
        return axiosClient
            .post(`/api/admin/fields/${fieldId}/approve`)
            .then(unwrapResponse);
    },

    rejectField(fieldId, reason) {
        return axiosClient
            .post(`/api/admin/fields/${fieldId}/reject`, null, {
                params: { reason }
            })
            .then(unwrapResponse);
    },

    getPendingReports() {
        return axiosClient
            .get('/api/admin/reports/pending')
            .then(unwrapResponse);
    },

    resolveReport(reportId, status) {
        return axiosClient.post(
            `/api/admin/reports/${reportId}/resolve`,
            null,
            {
                params: { status }
            }
        );
    },

    getTopReportedFields() {
        return axiosClient
            .get('/api/admin/reports/top-fields')
            .then(unwrapResponse);
    },

    getDashboard() {
        return axiosClient.get('/api/admin/dashboard').then(unwrapResponse);
    },

    getFinanceSummary() {
        return axiosClient
            .get('/api/admin/finance/summary')
            .then(unwrapResponse);
    },

    getFinanceSettings() {
        return axiosClient
            .get('/api/admin/finance/settings')
            .then(unwrapResponse);
    },

    updateFinanceSettings(body) {
        return axiosClient
            .put('/api/admin/finance/settings', body)
            .then(unwrapResponse);
    },

    getPayoutRequests(params = {}) {
        return axiosClient
            .get('/api/admin/finance/payout-requests', { params })
            .then(unwrapResponse);
    },

    getPayoutRequestDetail(requestId) {
        return axiosClient
            .get(`/api/admin/finance/payout-requests/${requestId}`)
            .then(unwrapResponse);
    },

    approvePayoutRequest(requestId, body = {}) {
        return axiosClient
            .post(
                `/api/admin/finance/payout-requests/${requestId}/approve`,
                body
            )
            .then(unwrapResponse);
    },

    rejectPayoutRequest(requestId, body = {}) {
        return axiosClient
            .post(
                `/api/admin/finance/payout-requests/${requestId}/reject`,
                body
            )
            .then(unwrapResponse);
    },
    getLogs(params) {
        return axiosClient
            .get('/api/admin/logs', { params })
            .then(unwrapResponse);
    },

    getLogStats() {
        return axiosClient.get('/api/admin/logs/stats').then(unwrapResponse);
    },
    searchLogs(params) {
        return axiosClient
            .get('/api/admin/logs/search', { params })
            .then(unwrapResponse);
    }
};
