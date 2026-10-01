import axiosClient from './axiosClient';

function unwrapResponse(response) {
    return response?.data?.data ?? response.data;
}

export const groupApi = {
    createGroup(payload) {
        return axiosClient.post('/api/groups', payload).then(unwrapResponse);
    },

    getMyGroups() {
        return axiosClient.get('/api/groups/my').then(unwrapResponse);
    },

    getGroupDetail(groupId) {
        return axiosClient.get(`/api/groups/${groupId}`).then(unwrapResponse);
    },

    updateGroup(groupId, payload) {
        return axiosClient.put(`/api/groups/${groupId}`, payload).then(unwrapResponse);
    },

    disbandGroup(groupId) {
        return axiosClient.post(`/api/groups/${groupId}/disband`).then((r) => r.data);
    },

    generateInvite(groupId, payload = {}) {
        return axiosClient.post(`/api/groups/${groupId}/invites`, payload).then(unwrapResponse);
    },

    validateInvite(code) {
        return axiosClient.get(`/api/groups/invites/${code}`).then(unwrapResponse);
    },

    joinGroupByCode(code) {
        return axiosClient.post(`/api/groups/invites/${code}/join`).then(unwrapResponse);
    },

    getGroupMembers(groupId) {
        return axiosClient.get(`/api/groups/${groupId}/members`).then(unwrapResponse);
    },

    leaveGroup(groupId) {
        return axiosClient.post(`/api/groups/${groupId}/leave`).then((r) => r.data);
    },

    removeMember(groupId, memberUserId) {
        return axiosClient
            .post(`/api/groups/${groupId}/members/${memberUserId}/remove`)
            .then((r) => r.data);
    },

    transferLeader(groupId, payload) {
        return axiosClient
            .post(`/api/groups/${groupId}/transfer-leader`, payload)
            .then((r) => r.data);
    },

    getGroupMessages(groupId, params = {}) {
        return axiosClient
            .get(`/api/groups/${groupId}/messages`, { params })
            .then(unwrapResponse);
    },

    sendGroupMessage(groupId, payload) {
        return axiosClient
            .post(`/api/groups/${groupId}/messages`, payload)
            .then(unwrapResponse);
    }
};
