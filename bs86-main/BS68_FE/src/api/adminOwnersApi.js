import axiosClient from './axiosClient';

const adminOwnersApi = {
    getPending: async () => {
        const res = await axiosClient.get('/api/admin/owners/pending');
        return res.data?.data || res.data || [];
    },

    approve: (verificationId) =>
        axiosClient.post(`/api/admin/owners/verifications/${verificationId}/approve`),

    reject: (verificationId, reason) =>
        axiosClient.post(`/api/admin/owners/verifications/${verificationId}/reject`, null, {
            params: { reason }
        })
};

export default adminOwnersApi;
