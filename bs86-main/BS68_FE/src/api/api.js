// tạm thời call api booking
import { getApiBaseUrl } from '../config/runtime';

const API_BASE_URL = getApiBaseUrl();

// Helper xử lý response
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    let errorDetails = null;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      errorDetails = errorData.errors; // validation errors (field -> message)
    } catch (e) {
      // Không parse được JSON, giữ nguyên message mặc định
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    error.errors = errorDetails;
    throw error;
  }
  // Nếu status 204 No Content, không có body
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    return handleResponse(response);
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ===============================
// 2. API Courts
// ===============================
export const courtAPI = {
  /**
   * Lấy danh sách tất cả sân
   * GET /api/courts
   */
  getAllCourts: () => fetchAPI('/courts'),

  /**
   * Lấy chi tiết một sân theo ID
   * GET /api/courts/{id}
   */
  getCourtDetails: (courtId) => fetchAPI(`/courts/${courtId}`),

  /**
   * Lấy danh sách sân còn slot trống theo ngày
   * GET /api/courts/available?date=YYYY-MM-DD
   */
  getAvailableCourts: (date) => fetchAPI(`/courts/available?date=${date}`),

  /**
   * Lấy lịch trình (các slot) của một sân trong một ngày
   * GET /api/courts/{id}/schedule?date=YYYY-MM-DD
   */
  getCourtSchedule: (courtId, date) => fetchAPI(`/courts/${courtId}/schedule?date=${date}`),
};

// ===============================
// 3. API Time Slots (các khung giờ mặc định)
// ===============================
export const timeSlotAPI = {
  /**
   * Lấy danh sách tất cả các khung giờ (mỗi khung 30 phút)
   * GET /api/time-slots
   */
  getAllTimeSlots: () => fetchAPI('/time-slots'),
};

// ===============================
// 4. API Bookings
// ===============================
export const bookingAPI = {
  /**
   * Tạo booking mới
   * POST /api/bookings
   * Body: { courtId, customerId, bookingDate, startTimes: ["HH:MM", ...] }
   */
  createBooking: (bookingData) =>
    fetchAPI('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),

  /**
   * Lấy thông tin booking theo ID
   * GET /api/bookings/{id}
   */
  getBookingDetails: (bookingId) => fetchAPI(`/bookings/${bookingId}`),

  /**
   * Cập nhật trạng thái booking (PENDING, CONFIRMED, CANCELLED, COMPLETED)
   * PUT /api/bookings/{id}?status=xxx
   */
  updateBookingStatus: (bookingId, status) =>
    fetchAPI(`/bookings/${bookingId}?status=${status}`, {
      method: 'PUT',
    }),

  /**
   * Hủy booking (xóa mềm)
   * DELETE /api/bookings/{id}
   */
  cancelBooking: (bookingId) =>
    fetchAPI(`/bookings/${bookingId}`, {
      method: 'DELETE',
    }),
};

// ===============================
// 5. API Payments
// ===============================
export const paymentAPI = {
  /**
   * Tạo thanh toán mới
   * POST /api/payments
   * Body: { bookingId, paymentMethod (MOMO, VNPAY, ...) }
   */
  processPayment: (paymentData) =>
    fetchAPI('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),

  /**
   * Lấy thông tin thanh toán theo ID
   * GET /api/payments/{id}
   */
  getPaymentDetails: (paymentId) => fetchAPI(`/payments/${paymentId}`),
};

// ===============================
// 6. Utility (nếu cần)
// ===============================
export default {
  courtAPI,
  timeSlotAPI,
  bookingAPI,
  paymentAPI,
};
