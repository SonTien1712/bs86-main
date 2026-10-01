import { useEffect, useMemo, useState } from 'react';
import { getMyTransactionHistory } from '../../api/paymentApi';
import { formatAmount, formatDateTime, getErrorMessage } from '../../pages/public/payment/paymentResultUtils';
import TransactionDetailModal from './TransactionDetailModal';
import styles from './TransactionHistorySection.module.css';

const STATUS_OPTIONS = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Thành công', value: 'SUCCESS' },
    { label: 'Thất bại', value: 'FAILED' },
    { label: 'Đã hủy', value: 'CANCELLED' },
    { label: 'Hết hạn', value: 'EXPIRED' },
    { label: 'Đang chờ', value: 'PENDING' }
];

function extractTransactions(payload) {
    if (!payload || typeof payload !== 'object') {
        return [];
    }

    const candidates = [
        payload.items,
        payload.content,
        payload.data,
        payload.transactions,
        payload.records,
        payload.list
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }
    }

    return [];
}

function normalizeTransaction(item) {
    const booking = item?.booking || item?.bookingInfo || {};
    const transactionStatus = item?.status || item?.transactionStatus || item?.paymentStatus || '';
    const paymentStatus = item?.paymentStatus || transactionStatus || '';
    const bookingStatus = item?.bookingStatus || booking?.status || '';
    const bookingId = item?.bookingId ?? booking?.id ?? booking?.bookingId ?? '';
    const transactionId = item?.transactionId ?? item?.id ?? item?.orderCode ?? '';

    return {
        raw: item,
        transactionId: String(transactionId || '').trim(),
        id: item?.id ?? item?.transactionId ?? transactionId ?? '',
        orderCode: item?.orderCode ?? item?.vnp_TxnRef ?? item?.transactionCode ?? '',
        bookingId,
        amount: item?.amount ?? item?.totalAmount ?? item?.paymentAmount ?? 0,
        paymentMethod: item?.paymentMethod ?? '',
        paymentStatus,
        transactionStatus,
        bookingStatus,
        createdAt: item?.createdAt || item?.created_at || item?.transactionDate || '',
        paidAt: item?.paidAt || item?.paid_at || item?.successAt || '',
        gatewayTransactionId: item?.gatewayTransactionId || '',
        gatewayOrderCode: item?.gatewayOrderCode || '',
        failReason: item?.failReason || item?.message || item?.reason || '',
        note: item?.note || item?.description || ''
    };
}

function sortNewestFirst(a, b) {
    const left = new Date(a.paidAt || a.createdAt || 0).getTime();
    const right = new Date(b.paidAt || b.createdAt || 0).getTime();
    return right - left;
}

function normalizeFilterValue(value) {
    return String(value || '').trim().toUpperCase();
}

function statusLabel(value) {
    const normalized = normalizeFilterValue(value);

    if (normalized === 'SUCCESS') return 'Thành công';
    if (normalized === 'FAILED') return 'Thất bại';
    if (normalized === 'CANCELLED') return 'Đã hủy';
    if (normalized === 'EXPIRED') return 'Hết hạn';
    if (normalized === 'PENDING') return 'Đang chờ';
    if (normalized === 'PAID') return 'Đã thanh toán';
    if (normalized === 'CONFIRMED') return 'Đã xác nhận';

    return value ? String(value) : '--';
}

export default function TransactionHistorySection({ maxItems = null }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [selectedTransactionId, setSelectedTransactionId] = useState('');
    const [totalElements, setTotalElements] = useState(0);

    const loadHistory = async (nextFilter = filter) => {
        setLoading(true);
        setError('');

        try {
            const payload = await getMyTransactionHistory(nextFilter);
            const pageData = payload && typeof payload === 'object' ? payload : {};
            const content = extractTransactions(pageData);
            const normalized = content.map(normalizeTransaction).sort(sortNewestFirst);
            setHistory(normalized);
            setTotalElements(
                Number(pageData?.totalElements ?? pageData?.total_elements ?? normalized.length) || 0
            );
        } catch (fetchError) {
            setHistory([]);
            setTotalElements(0);
            setError(getErrorMessage(fetchError, 'Không tải được lịch sử giao dịch'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadHistory(filter);
    }, [filter]);

    const selectedItem = useMemo(
        () =>
            history.find(
                (item) =>
                    String(item.id) === String(selectedTransactionId) ||
                    item.transactionId === selectedTransactionId ||
                    item.orderCode === selectedTransactionId
            ) || null,
        [history, selectedTransactionId]
    );

    const visibleHistory = useMemo(() => {
        if (!Number.isInteger(maxItems) || maxItems <= 0) {
            return history;
        }

        return history.slice(0, maxItems);
    }, [history, maxItems]);

    const isLimited = Number.isInteger(maxItems) && maxItems > 0 && history.length > maxItems;

    return (
        <section className={styles.section} id='transactions'>
            <div className={styles.header}>
                <div>
                    <div className={styles.kicker}>Thanh toán</div>
                    <h2 className={styles.title}>Lịch sử giao dịch</h2>
                    <p className={styles.subtitle}>
                        {isLimited
                            ? `Đang hiển thị ${visibleHistory.length} giao dịch gần nhất${
                                  totalElements > 0 ? ` trên tổng ${totalElements} giao dịch` : ''
                              }.`
                            : `Các giao dịch mới nhất được hiển thị trước${
                                  totalElements > 0 ? ` (${totalElements} giao dịch)` : ''
                              }.`}
                    </p>
                </div>

                <div className={styles.toolbar}>
                    <label className={styles.filterWrap}>
                        <span>Lọc theo trạng thái</span>
                        <select
                            className={styles.select}
                            onChange={(event) => setFilter(event.target.value)}
                            value={filter}
                        >
                            {STATUS_OPTIONS.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button className={styles.refreshBtn} onClick={() => loadHistory(filter)} type='button'>
                        Làm mới
                    </button>
                </div>
            </div>

            {loading ? <div className={styles.feedback}>Đang tải lịch sử giao dịch...</div> : null}
            {!loading && error ? <div className={styles.feedbackError}>{error}</div> : null}

            {!loading && !error && history.length === 0 ? (
                <div className={styles.emptyState}>
                    <strong>Chưa có giao dịch nào.</strong>
                    <span>Các thanh toán thành công hoặc đang chờ sẽ hiển thị tại đây.</span>
                </div>
            ) : null}

            {!loading && !error && visibleHistory.length > 0 ? (
                <div className={styles.list}>
                    {visibleHistory.map((item) => {
                        const transactionKey = item.orderCode || item.transactionId || item.id || '';
                        return (
                            <button
                                className={styles.card}
                                key={transactionKey || `${item.bookingId}-${item.createdAt}`}
                                onClick={() => setSelectedTransactionId(String(item.id || item.transactionId || item.orderCode))}
                                type='button'
                            >
                                <div className={styles.cardHeader}>
                                    <div>
                                        <div className={styles.cardLabel}>Giao dịch</div>
                                        <div className={styles.cardTitle}>
                                            {transactionKey || '--'}
                                        </div>
                                    </div>
                                    <div className={styles.statusGroup}>
                                        <span className={`${styles.pill} ${styles.paymentPill}`}>
                                            {statusLabel(item.transactionStatus)}
                                        </span>
                                        <span className={`${styles.pill} ${styles.bookingPill}`}>
                                            {statusLabel(item.bookingStatus)}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.grid}>
                                    <div className={styles.meta}>
                                        <span>Mã đặt sân</span>
                                        <strong>{item.bookingId || '--'}</strong>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>Số tiền</span>
                                        <strong>{formatAmount(item.amount)}</strong>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>Phương thức</span>
                                        <strong>{item.paymentMethod || '--'}</strong>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>Trạng thái</span>
                                        <strong>{statusLabel(item.transactionStatus)}</strong>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>Thời gian tạo</span>
                                        <strong>{formatDateTime(item.createdAt)}</strong>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>Thời gian thanh toán</span>
                                        <strong>{formatDateTime(item.paidAt)}</strong>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>Mã đơn cổng thanh toán</span>
                                        <strong>{item.gatewayOrderCode || item.orderCode || '--'}</strong>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>Mã giao dịch cổng</span>
                                        <strong>{item.gatewayTransactionId || '--'}</strong>
                                    </div>
                                </div>

                                <div className={styles.noteRow}>
                                    <div className={styles.note}>
                                        {item.failReason || item.note || 'Bấm để xem chi tiết giao dịch.'}
                                    </div>
                                    <span className={styles.clickHint}>Xem chi tiết</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : null}

            <TransactionDetailModal
                open={Boolean(selectedItem)}
                onClose={() => setSelectedTransactionId('')}
                transactionId={selectedItem?.id || selectedItem?.transactionId || selectedItem?.orderCode}
            />
        </section>
    );
}
