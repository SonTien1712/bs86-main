import axiosClient from './axiosClient';

const adminFieldsApi = {
    getPending: () => axiosClient.get('/api/admin/fields/pending'),

    approve: (fieldId) => axiosClient.post(`/api/admin/fields/${fieldId}/approve`),

    reject: (fieldId, reason) =>
        axiosClient.post(`/api/admin/fields/${fieldId}/reject`, null, {
            params: { reason }
        })
};

export default adminFieldsApi;
