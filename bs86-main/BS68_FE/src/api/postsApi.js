import axiosClient from './axiosClient';

export const postsApi = {
    // Public: lấy tất cả bài ACTIVE
    getFeed() {
        return axiosClient.get('/api/posts').then(r => r.data);
    },

    // Owner: lấy bài của mình
    getMyPosts() {
        return axiosClient.get('/api/posts/my').then(r => r.data);
    },

    // Owner: đăng bài sân trống
    createPost(body) {
        return axiosClient.post('/api/posts', body).then(r => r.data);
    },

    // Public: lấy slot còn trống theo fieldId
    getAvailableSlots(fieldId) {
        return axiosClient.get(`/api/fields/${fieldId}/available-slots`).then(r => r.data);
    },
};
