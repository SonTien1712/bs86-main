import axiosClient from './axiosClient';

function unwrap(r) {
    return r?.data?.data ?? r?.data;
}

export const withdrawalApi = {
    // ── Owner / Merchant ─────────────────────────────────────────────────────

    /** Lấy số dư ví */
    getBalance() {
        return axiosClient.get('/api/owner/withdrawals/balance').then(unwrap);
    },

    /** Danh sách yêu cầu rút tiền */
    getHistory() {
        return axiosClient.get('/api/owner/withdrawals/history').then(unwrap);
    },

    /** Gửi yêu cầu rút tiền */
    requestWithdrawal(payload) {
        // payload: { bankAccountId, amount }
        return axiosClient.post('/api/owner/withdrawals/request', payload).then(unwrap);
    },

    /** Danh sách tài khoản ngân hàng */
    getBankAccounts() {
        return axiosClient.get('/api/owner/withdrawals/bank-accounts').then(unwrap);
    },

    /** Thêm tài khoản ngân hàng */
    addBankAccount(payload) {
        // payload: { bankName, accountNumber, accountHolderName, isDefault }
        return axiosClient.post('/api/owner/withdrawals/bank-accounts', payload).then(unwrap);
    },

    // ── Admin ─────────────────────────────────────────────────────────────────

    /** Danh sách yêu cầu rút tiền chờ duyệt */
    getPendingWithdrawals() {
        return axiosClient.get('/api/admin/withdrawals/pending').then(unwrap);
    },

    /** Duyệt yêu cầu */
    approveWithdrawal(id, adminPassword) {
        return axiosClient
            .post(`/api/admin/withdrawals/${id}/approve`, { adminPassword })
            .then(unwrap);
    },

    /** Từ chối yêu cầu */
    rejectWithdrawal(id, adminPassword, note) {
        return axiosClient
            .post(`/api/admin/withdrawals/${id}/reject`, { adminPassword, note })
            .then(unwrap);
    }
};
