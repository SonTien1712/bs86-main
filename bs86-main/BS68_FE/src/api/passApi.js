import axiosClient from './axiosClient';

function unwrapResponse(response) {
    return response?.data?.data ?? response?.data ?? null;
}

export async function listPassPosts() {
    const response = await axiosClient.get('/api/pass-posts');
    const data = unwrapResponse(response);
    return Array.isArray(data) ? data : [];
}

export async function createPassPost(payload) {
    const response = await axiosClient.post('/api/pass-posts', payload);
    return unwrapResponse(response);
}

export async function contactPassPost(passPostId, payload = {}) {
    const response = await axiosClient.post(`/api/pass-posts/${passPostId}/contact`, payload);
    return unwrapResponse(response);
}

export async function getMyPassConversations() {
    const response = await axiosClient.get('/api/pass-conversations/my');
    const data = unwrapResponse(response);
    return Array.isArray(data) ? data : [];
}

export async function getPassConversation(conversationId) {
    const response = await axiosClient.get(`/api/pass-conversations/${conversationId}`);
    return unwrapResponse(response);
}

export async function sendPassConversationMessage(conversationId, payload) {
    const response = await axiosClient.post(
        `/api/pass-conversations/${conversationId}/messages`,
        payload
    );
    return unwrapResponse(response);
}

export async function closePassConversation(conversationId) {
    const response = await axiosClient.post(`/api/pass-conversations/${conversationId}/close`);
    return unwrapResponse(response);
}

export async function transferPassConversationTicket(conversationId) {
    const response = await axiosClient.post(`/api/pass-conversations/${conversationId}/transfer`);
    return unwrapResponse(response);
}

export const passApi = {
    listPassPosts,
    createPassPost,
    contactPassPost,
    getMyPassConversations,
    getPassConversation,
    sendPassConversationMessage,
    closePassConversation,
    transferPassConversationTicket
};

export default passApi;
