import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingApi } from '../../api/bookingApi';
import styles from './BookingHistorySection.module.css';

const STATUS_OPTIONS = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Completed', value: 'COMPLETED' }
];

function formatCurrency(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(value) {
    if (!value) {
        return '--';
    }

    const date = parseDateValue(value);
    if (!date) {
        return String(value);
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

function formatDateTime(value) {
    if (!value) {
        return '--';
    }

    const date = parseDateValue(value);
    if (!date) {
        return String(value);
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function parseDateValue(value) {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const normalized = String(value || '').trim();
    if (!normalized) {
        return null;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        const [year, month, day] = normalized.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatTimeValue(value) {
    const normalized = String(value || '').trim();
    if (!normalized) {
        return '';
    }

    return normalized.length >= 5 ? normalized.slice(0, 5) : normalized;
}

function formatTimeRange(startTime, endTime) {
    return (
        [formatTimeValue(startTime), formatTimeValue(endTime)]
            .filter(Boolean)
            .join(' - ') || '--'
    );
}

function normalizePage(payload) {
    if (!payload || typeof payload !== 'object') {
        return {
            content: [],
            number: 0,
            size: 10,
            totalElements: 0,
            totalPages: 0
        };
    }

    return {
        content: Array.isArray(payload.content) ? payload.content : [],
        number: Number(payload.number ?? 0) || 0,
        size: Number(payload.size ?? 10) || 10,
        totalElements: Number(payload.totalElements ?? 0) || 0,
        totalPages: Number(payload.totalPages ?? 0) || 0
    };
}

function getErrorMessage(error) {
    const status = Number(error?.response?.status || 0);
    if (status === 401 || status === 403) {
        return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
    }

    return (
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        'Không tải được lịch sử đặt sân.'
    );
}

function getStatusClassName(status) {
    switch (String(status || '').toUpperCase()) {
        case 'CONFIRMED':
            return styles.confirmedBadge;
        case 'CANCELLED':
            return styles.cancelledBadge;
        case 'COMPLETED':
            return styles.completedBadge;
        default:
            return styles.pendingBadge;
    }
}

function getPaymentClassName(status) {
    switch (String(status || '').toUpperCase()) {
        case 'PAID':
            return styles.paidBadge;
        case 'FAILED':
        case 'CANCELLED':
        case 'EXPIRED':
            return styles.failedBadge;
        default:
            return styles.processingBadge;
    }
}

export default function BookingHistorySection() {
    const navigate = useNavigate();
    const latestRequestRef = useRef(0);
    const [filter, setFilter] = useState('ALL');
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pageData, setPageData] = useState({
        content: [],
        number: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0
    });

    const loadHistory = async ({
        nextFilter = filter,
        nextPage = page
    } = {}) => {
        const requestId = latestRequestRef.current + 1;
        latestRequestRef.current = requestId;
        setLoading(true);
        setError('');

        try {
            const payload = await bookingApi.getMyBookingHistory({
                status: nextFilter,
                page: nextPage,
                size: 6
            });
            if (latestRequestRef.current !== requestId) {
                return;
            }
            setPageData(normalizePage(payload));
        } catch (fetchError) {
            if (latestRequestRef.current !== requestId) {
                return;
            }
            setPageData(normalizePage(null));
            setError(getErrorMessage(fetchError));
        } finally {
            if (latestRequestRef.current === requestId) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        void loadHistory({ nextFilter: filter, nextPage: page });
    }, [filter, page]);

    const paginationLabel = useMemo(() => {
        if (pageData.totalElements === 0) {
            return 'Chưa có booking nào';
        }

        const from = pageData.number * pageData.size + 1;
        const to = Math.min(
            (pageData.number + 1) * pageData.size,
            pageData.totalElements
        );
        return `Hiển thị ${from}-${to} / ${pageData.totalElements} booking`;
    }, [pageData.number, pageData.size, pageData.totalElements]);

    return (
        <section className={styles.section} id='bookings'>
            <div className={styles.header}>
                <div>
                    <div className={styles.kicker}>Bookings</div>
                    <h2 className={styles.title}>Lịch sử đặt sân</h2>
                    <p className={styles.subtitle}>
                        Danh sách booking của bạn được sắp xếp mới nhất trước,
                        có hỗ trợ lọc theo trạng thái và mở nhanh trang chi tiết
                        booking.
                    </p>
                </div>

                <div className={styles.toolbar}>
                    <label className={styles.filterWrap}>
                        <span>Lọc theo trạng thái</span>
                        <select
                            className={styles.select}
                            onChange={(event) => {
                                setFilter(event.target.value);
                                setPage(0);
                            }}
                            value={filter}
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        className={styles.refreshBtn}
                        onClick={() =>
                            loadHistory({ nextFilter: filter, nextPage: page })
                        }
                        type='button'
                    >
                        Tải lại
                    </button>
                </div>
            </div>

            <div className={styles.sortHint}>Sắp xếp: mới nhất trước</div>

            {loading ? (
                <div className={styles.feedback}>
                    Đang tải lịch sử đặt sân...
                </div>
            ) : null}
            {!loading && error ? (
                <div className={styles.feedbackError}>{error}</div>
            ) : null}

            {!loading && !error && pageData.content.length === 0 ? (
                <div className={styles.emptyState}>
                    <strong>Bạn chưa có booking nào.</strong>
                    <span>
                        Những lần đặt sân tiếp theo sẽ xuất hiện tại đây.
                    </span>
                </div>
            ) : null}

            {!loading && !error && pageData.content.length > 0 ? (
                <>
                    <div className={styles.list}>
                        {pageData.content.map((item) => (
                            <article
                                className={styles.card}
                                key={item.id || item.bookingCode}
                            >
                                <div className={styles.cardHeader}>
                                    <div>
                                        <div className={styles.cardLabel}>
                                            Mã booking
                                        </div>
                                        <div className={styles.cardTitle}>
                                            {item.bookingCode || `#${item.id}`}
                                        </div>
                                        <div className={styles.cardSubtitle}>
                                            {item.fieldName || 'Cụm sân'} - San{' '}
                                            {item.courtNumber || '--'}
                                        </div>
                                    </div>

                                    <div className={styles.statusGroup}>
                                        <span
                                            className={`${styles.badge} ${getStatusClassName(item.bookingStatus)}`}
                                        >
                                            {item.bookingStatus || '--'}
                                        </span>
                                        <span
                                            className={`${styles.badge} ${getPaymentClassName(item.paymentStatus)}`}
                                        >
                                            {item.paymentStatus || '--'}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.grid}>
                                    <div className={styles.meta}>
                                        <span>Loại sân</span>
                                        <strong>
                                            {item.sportType || '--'}
                                        </strong>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>Địa điểm</span>
                                        <strong>{item.location || '--'}</strong>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>Ngày đặt</span>
                                        <strong>
                                            {formatDate(item.bookingDate)}
                                        </strong>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>Khung giờ</span>
                                        <strong>
                                            {formatTimeRange(
                                                item.startTime,
                                                item.endTime
                                            )}
                                        </strong>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>Tổng tiền</span>
                                        <strong>
                                            {formatCurrency(item.totalAmount)}
                                        </strong>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>Thanh toán</span>
                                        <strong>
                                            {item.paymentMethod ||
                                                item.transactionStatus ||
                                                '--'}
                                        </strong>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>Tạo lúc</span>
                                        <strong>
                                            {formatDateTime(item.createdAt)}
                                        </strong>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>Mã tham chiếu</span>
                                        <strong>
                                            {item.paymentReference || '--'}
                                        </strong>
                                    </div>
                                </div>

                                <div className={styles.footer}>
                                    <div className={styles.note}>
                                        {item.note ||
                                            'Nhấn "Xem chi tiết" để mở trang thông tin đầy đủ của booking.'}
                                    </div>

                                    <div className={styles.actions}>
                                        <button
                                            className={styles.secondaryBtn}
                                            onClick={() =>
                                                navigate(`/bookings/${item.id}`)
                                            }
                                            type='button'
                                        >
                                            Xem chi tiết
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className={styles.pagination}>
                        <div className={styles.paginationInfo}>
                            {paginationLabel}
                        </div>

                        <div className={styles.paginationActions}>
                            <button
                                className={styles.pageBtn}
                                disabled={page <= 0}
                                onClick={() =>
                                    setPage((current) =>
                                        Math.max(current - 1, 0)
                                    )
                                }
                                type='button'
                            >
                                Trang trước
                            </button>
                            <span className={styles.pageState}>
                                Trang {pageData.totalPages === 0 ? 0 : page + 1}
                                /{pageData.totalPages || 1}
                            </span>
                            <button
                                className={styles.pageBtn}
                                disabled={
                                    pageData.totalPages === 0 ||
                                    page >= pageData.totalPages - 1
                                }
                                onClick={() =>
                                    setPage((current) => current + 1)
                                }
                                type='button'
                            >
                                Trang sau
                            </button>
                        </div>
                    </div>
                </>
            ) : null}
        </section>
    );
}

