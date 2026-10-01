import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bookingApi } from '../../../api/bookingApi';
import {
    cancelPendingPayment,
    clearPendingPayment,
    clearPendingPaymentQueue,
    createVnpayPayment,
    getPendingPayment,
    rememberPendingPayment
} from '../../../api/paymentApi';
import { parseAuthFromToken } from '../../../utils/auth';
import styles from './BookingDetailPage.module.css';

function formatCurrency(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDateTime(date, startTime, endTime) {
    if (!date) {
        return '--';
    }

    const [year, month, day] = String(date).split('-');
    const dateLabel = [day, month, year].filter(Boolean).join('/');
    const timeLabel = [startTime, endTime].filter(Boolean).join(' - ');
    return [dateLabel, timeLabel].filter(Boolean).join(' | ');
}

function formatTimestamp(value) {
    if (!value) {
        return '--';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));
}

function isRepayable(booking) {
    const paymentStatus = String(booking?.paymentStatus || '').toUpperCase();
    const bookingStatus = String(booking?.bookingStatus || '').toUpperCase();

    return (
        bookingStatus === 'PENDING' &&
        ['PENDING', 'FAILED'].includes(paymentStatus)
    );
}

function getErrorMessage(error, fallback) {
    const responseData = error?.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
        return responseData;
    }

    return responseData?.message || responseData?.error || error?.message || fallback;
}

export default function BookingDetailPage() {
    const navigate = useNavigate();
    const { bookingId } = useParams();
    const auth = parseAuthFromToken();
    const normalizedBookingId = useMemo(() => {
        const value = Number(bookingId);
        return Number.isInteger(value) && value > 0 ? value : null;
    }, [bookingId]);
    const [state, setState] = useState({
        loading: true,
        submitting: false,
        error: '',
        data: null
    });
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let active = true;

        async function loadBooking() {
            setState((current) => ({ ...current, loading: true, error: '' }));

            try {
                const data = await bookingApi.getBooking(bookingId);

                if (!active) {
                    return;
                }

                setState({
                    loading: false,
                    submitting: false,
                    error: '',
                    data
                });
            } catch (error) {
                if (!active) {
                    return;
                }

                setState({
                    loading: false,
                    submitting: false,
                    error: error?.response?.data?.message || error?.message || 'Không tải được booking.',
                    data: null
                });
            }
        }

        void loadBooking();
        return () => {
            active = false;
        };
    }, [bookingId, refreshKey]);

    useEffect(() => {
        let active = true;

        async function releaseAbandonedPendingPayment() {
            const pendingPayment = getPendingPayment();

            if (!pendingPayment?.bookingId || pendingPayment.bookingId !== normalizedBookingId) {
                return;
            }

            try {
                await cancelPendingPayment(pendingPayment.bookingId);
            } catch (error) {
                const message = getErrorMessage(
                    error,
                    'Không thể hủy phiên thanh toán đang treo.'
                );
                const normalizedMessage = String(message).toLowerCase();

                if (
                    !normalizedMessage.includes('already paid') &&
                    !normalizedMessage.includes('booking not found')
                ) {
                    setState((current) => ({
                        ...current,
                        error: message
                    }));
                }
            } finally {
                clearPendingPayment();
                if (active) {
                    setRefreshKey((value) => value + 1);
                }
            }
        }

        const handlePageShow = () => {
            void releaseAbandonedPendingPayment();
        };

        window.addEventListener('pageshow', handlePageShow);
        void releaseAbandonedPendingPayment();

        return () => {
            active = false;
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, [normalizedBookingId]);

    const canRepay = useMemo(() => {
        return auth.isAuthenticated && !auth.rawIsOwner && !auth.isAdmin && isRepayable(state.data);
    }, [auth.isAdmin, auth.isAuthenticated, auth.rawIsOwner, state.data]);

    const handleRepay = async () => {
        if (!state.data?.id) {
            return;
        }

        setState((current) => ({ ...current, submitting: true, error: '' }));

        try {
            clearPendingPaymentQueue();
            rememberPendingPayment({
                bookingId: state.data.id,
                fieldId: state.data.fieldId ?? null,
                bookingDate: state.data.bookingDate ?? null
            });
            const payment = await createVnpayPayment(state.data.id);
            if (payment?.paymentUrl) {
                window.location.assign(payment.paymentUrl);
                return;
            }
            throw new Error('Không nhận được link thanh toán.');
        } catch (error) {
            clearPendingPayment();
            setState((current) => ({
                ...current,
                submitting: false,
                error: getErrorMessage(error, 'Không tạo được phiên thanh toán.')
            }));
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <div>
                    <div className={styles.kicker}>Booking workspace</div>
                    <h1 className={styles.title}>Booking detail</h1>
                    <p className={styles.subtitle}>
                        Theo dõi trạng thái đặt sân, thanh toán và mở lại phiên thanh toán nếu cần.
                    </p>
                </div>

                <button className={styles.backBtn} onClick={() => navigate(-1)} type='button'>
                    Quay lại
                </button>
            </div>

            {state.loading ? <div className={styles.feedback}>Đang tải booking...</div> : null}
            {!state.loading && state.error ? <div className={styles.error}>{state.error}</div> : null}

            {!state.loading && state.data ? (
                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div>
                            <div className={styles.bookingId}>{state.data.bookingCode || `Booking #${state.data.id}`}</div>
                            <div className={styles.bookingName}>
                                {state.data.fieldName || 'Cụm sân'} - S?n {state.data.courtNumber || '--'}
                            </div>
                            <div className={styles.bookingSubline}>
                                {(state.data.sportType || '--')} | {state.data.location || '--'}
                            </div>
                        </div>

                        <div className={styles.statusStack}>
                            <span className={styles.primaryPill}>{state.data.bookingStatus || '--'}</span>
                            <span className={styles.secondaryPill}>{state.data.paymentStatus || '--'}</span>
                        </div>
                    </div>

                    <div className={styles.grid}>
                        <div className={styles.metaCard}>
                            <span>Khung giờ</span>
                            <strong>
                                {formatDateTime(
                                    state.data.bookingDate,
                                    state.data.startTime,
                                    state.data.endTime
                                )}
                            </strong>
                        </div>
                        <div className={styles.metaCard}>
                            <span>Tổng tiền</span>
                            <strong>{formatCurrency(state.data.totalAmount)}</strong>
                        </div>
                        <div className={styles.metaCard}>
                            <span>Payment reference</span>
                            <strong>{state.data.paymentReference || '--'}</strong>
                        </div>
                        <div className={styles.metaCard}>
                            <span>Phương thức thanh toán</span>
                            <strong>{state.data.paymentMethod || '--'}</strong>
                        </div>
                        <div className={styles.metaCard}>
                            <span>Transaction status</span>
                            <strong>{state.data.transactionStatus || '--'}</strong>
                        </div>
                        <div className={styles.metaCard}>
                            <span>Hết hạn giữ chỗ</span>
                            <strong>{state.data.expiresAt || '--'}</strong>
                        </div>
                        <div className={styles.metaCard}>
                            <span>Địa điểm</span>
                            <strong>{state.data.location || '--'}</strong>
                        </div>
                        <div className={styles.metaCard}>
                            <span>Tạo booking lúc</span>
                            <strong>{formatTimestamp(state.data.createdAt)}</strong>
                        </div>
                        <div className={styles.metaCard}>
                            <span>Thanh toán lúc</span>
                            <strong>{formatTimestamp(state.data.paidAt)}</strong>
                        </div>
                    </div>

                    <div className={styles.notePanel}>
                        <span>Ghi chú</span>
                        <strong>{state.data.note || 'Chưa có ghi chú bổ sung cho booking này.'}</strong>
                    </div>

                    <div className={styles.actionRow}>
                        {canRepay ? (
                            <button
                                className={styles.primaryAction}
                                disabled={state.submitting}
                                onClick={handleRepay}
                                type='button'
                            >
                                {state.submitting ? 'Đang tạo link thanh toán...' : 'Thanh toán lại'}
                            </button>
                        ) : null}

                        <button className={styles.secondaryAction} onClick={() => navigate('/account')} type='button'>
                            Về tài khoản
                        </button>
                    </div>
                </section>
            ) : null}
        </div>
    );
}

