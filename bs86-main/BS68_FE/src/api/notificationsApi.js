import axiosClient from './axiosClient';

function unwrapResponse(response) {
    return response?.data?.data ?? response?.data ?? null;
}

export const notificationsApi = {
    getNotifications(params = {}) {
        return axiosClient.get('/api/notifications', { params }).then(unwrapResponse);
    },

    getUnreadCount() {
        return axiosClient.get('/api/notifications/unread-count').then(unwrapResponse);
    },

    markAsRead(id) {
        return axiosClient.patch(`/api/notifications/${id}/read`).then(unwrapResponse);
    },

    markAllAsRead() {
        return axiosClient.patch('/api/notifications/read-all').then(unwrapResponse);
    }
};
