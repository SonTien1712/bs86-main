import axiosClient from './axiosClient';

function unwrapResponse(response) {
    return response?.data?.data ?? response?.data;
}

export async function getMyTickets() {
    const response = await axiosClient.get('/api/tickets/my');
    const data = unwrapResponse(response);
    return Array.isArray(data) ? data : [];
}

export async function getTicketDetail(ticketId) {
    const response = await axiosClient.get(`/api/tickets/${ticketId}`);
    return unwrapResponse(response);
}

export const bookingApi = {
    getMyBookingHistory(params = {}) {
        return axiosClient
            .get('/api/bookings/my-history', {
                params: {
                    status: params.status,
                    page: params.page ?? 0,
                    size: params.size ?? 10
                }
            })
            .then(unwrapResponse);
    },

    getFieldCourts(fieldId) {
        return axiosClient
            .get(`/api/public/fields/${fieldId}/courts`)
            .then(unwrapResponse)
            .then((data) => (Array.isArray(data) ? data : []));
    },

    getCourtSlots(courtId, date) {
        return axiosClient
            .get(`/api/courts/${courtId}/slots`, { params: { date } })
            .then(unwrapResponse)
            .then((data) => (Array.isArray(data) ? data : []));
    },

    getBooking(bookingId) {
        return axiosClient.get(`/api/bookings/${bookingId}`).then(unwrapResponse);
    },

    // Prefer /api/orders if backend supports it
    createOrder(body) {
        return axiosClient.post('/api/bookings', body).then((r) => r.data);
    },

    // Optional fallback if runtime uses /api/bookings instead
    createBooking(body) {
        return axiosClient.post('/api/bookings', body).then((r) => r.data);
    },

    getMyTickets
    ,
    getTicketDetail
};
