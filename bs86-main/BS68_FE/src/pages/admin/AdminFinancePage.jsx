import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { getApiErrorMessage } from '../../utils/apiError';
import styles from './AdminFinancePage.module.css';

const INIT_SETTINGS = {
    platformCommissionRate: '',
    minimumPayoutAmount: ''
};

function formatCurrency(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatPercent(value) {
    const amount = Number(value || 0);
    return `${(amount * 100).toFixed(1)}%`;
}

function getStatusClass(status) {
    switch (String(status || '').toUpperCase()) {
        case 'APPROVED':
            return styles.approved;
        case 'REJECTED':
            return styles.rejected;
        default:
            return styles.pending;
    }
}

export default function AdminFinancePage() {
    const [summary, setSummary] = useState(null);
    const [settings, setSettings] = useState(INIT_SETTINGS);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [filter, setFilter] = useState('PENDING');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const loadData = async (status = filter) => {
        setLoading(true);
        setError('');

        try {
            const [summaryResponse, settingsResponse, requestsResponse] = await Promise.all([
                adminApi.getFinanceSummary(),
                adminApi.getFinanceSettings(),
                adminApi.getPayoutRequests({
                    status: status || undefined,
                    size: 20
                })
            ]);

            setSummary(summaryResponse?.data || summaryResponse);
            const settingsData = settingsResponse?.data || settingsResponse;
            setSettings({
                platformCommissionRate: Number(settingsData?.platformCommissionRate || 0) * 100,
                minimumPayoutAmount: settingsData?.minimumPayoutAmount || ''
            });
            const requestItems = Array.isArray(requestsResponse?.data?.content)
                ? requestsResponse.data.content
                : Array.isArray(requestsResponse?.content)
                  ? requestsResponse.content
                  : [];
            setRequests(requestItems);
            setSelectedRequest((current) =>
                current ? requestItems.find((item) => item.id === current.id) || current : current
            );
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, 'Không tải được dữ liệu tài chính admin.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(filter);

        const syncLatest = () => {
            if (document.visibilityState === 'visible') {
                loadData(filter);
            }
        };

        const intervalId = window.setInterval(syncLatest, 15000);
        window.addEventListener('focus', syncLatest);
        document.addEventListener('visibilitychange', syncLatest);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('focus', syncLatest);
            document.removeEventListener('visibilitychange', syncLatest);
        };
    }, [filter]);

    const loadRequestDetail = async (requestId) => {
        setDetailLoading(true);
        setError('');

        try {
            const detailResponse = await adminApi.getPayoutRequestDetail(requestId);
            setSelectedRequest(detailResponse?.data || detailResponse);
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, 'Không tải được chi tiết yêu cầu rút tiền.'));
        } finally {
            setDetailLoading(false);
        }
    };

    const handleSaveSettings = async (event) => {
        event.preventDefault();
        setSavingSettings(true);
        setError('');
        setSuccess('');

        try {
            await adminApi.updateFinanceSettings({
                platformCommissionRate: Number(settings.platformCommissionRate || 0) / 100,
                minimumPayoutAmount: Number(settings.minimumPayoutAmount || 0)
            });
            setSuccess('Đã cập nhật tỉ lệ ăn chia và ngưỡng rút tiền.');
            await loadData(filter);
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, 'Không thể cập nhật cài đặt tài chính.'));
        } finally {
            setSavingSettings(false);
        }
    };

    const handleReview = async (requestId, action) => {
        const note = window.prompt(
            action === 'approve'
                ? 'Nhập ghi chú duyệt chuyển khoản'
                : 'Nhập lý do từ chối'
        );

        if (note === null) {
            return;
        }
        if (action === 'reject' && !String(note).trim()) {
            setError('Vui lòng nhập lý do từ chối.');
            setSuccess('');
            return;
        }

        setProcessingId(requestId);
        setError('');
        setSuccess('');

        try {
            if (action === 'approve') {
                await adminApi.approvePayoutRequest(requestId, { note });
                setSuccess('Đã duyệt yêu cầu rút tiền.');
            } else {
                await adminApi.rejectPayoutRequest(requestId, { note });
                setSuccess('Đã từ chối yêu cầu rút tiền.');
            }
            await loadData(filter);
            if (selectedRequest?.id === requestId) {
                await loadRequestDetail(requestId);
            }
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, 'Không thể xử lý yêu cầu rút tiền.'));
        } finally {
            setProcessingId(null);
        }
    };

    const cards = [
        {
            label: 'Tiền giữ hộ admin',
            value: formatCurrency(summary?.platformEscrowBalance),
            caption: 'Tổng tiền đã thu từ khách và chưa đối soát xong'
        },
        {
            label: 'Doanh thu nền tảng',
            value: formatCurrency(summary?.platformRevenue),
            caption: 'Phần hoa hồng admin được nhận'
        },
        {
            label: 'Tiền phải trả chủ sân',
            value: formatCurrency(summary?.merchantPayableBalance),
            caption: 'Tổng số dư chờ chuyển khoản'
        },
        {
            label: 'Yêu cầu chờ duyệt',
            value: `${summary?.pendingPayoutRequests || 0}`,
            caption: `${formatCurrency(summary?.pendingPayoutRequestAmount)} đang chờ admin xử lý`
        }
    ];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <div className={styles.eyebrow}>Finance Control</div>
                    <h2>Quản lý dòng tiền và rút tiền</h2>
                    <p>
                        Admin theo dõi tiền giữ hộ, doanh thu hệ thống, số tiền cần chuyển cho chủ
                        sân và duyệt các lệnh rút tiền trong cùng một màn hình.
                    </p>
                </div>

                <button type='button' className={styles.refreshButton} onClick={() => loadData(filter)}>
                    Làm mới
                </button>
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}
            {success ? <div className={styles.success}>{success}</div> : null}

            <div className={styles.summaryGrid}>
                {cards.map((card) => (
                    <article key={card.label} className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>{card.label}</div>
                        <strong>{loading ? '...' : card.value}</strong>
                        <p>{card.caption}</p>
                    </article>
                ))}
            </div>

            <div className={styles.dualGrid}>
                <section className={styles.panel}>
                    <div className={styles.panelTitle}>Cấu hình tỉ lệ ăn chia</div>
                    <div className={styles.panelHint}>
                        Chủ sân đang nhận <strong>{formatPercent(summary?.ownerShareRate)}</strong>,
                        nền tảng nhận <strong>{formatPercent(summary?.platformCommissionRate)}</strong>.
                    </div>

                    <form className={styles.form} onSubmit={handleSaveSettings}>
                        <label>
                            <span>Hoa hồng nền tảng (%)</span>
                            <input
                                type='number'
                                min='0'
                                max='99'
                                step='0.1'
                                value={settings.platformCommissionRate}
                                onChange={(event) =>
                                    setSettings((current) => ({
                                        ...current,
                                        platformCommissionRate: event.target.value
                                    }))
                                }
                            />
                        </label>

                        <label>
                            <span>Ngưỡng rút tối thiểu (VND)</span>
                            <input
                                type='number'
                                min='0'
                                value={settings.minimumPayoutAmount}
                                onChange={(event) =>
                                    setSettings((current) => ({
                                        ...current,
                                        minimumPayoutAmount: event.target.value
                                    }))
                                }
                            />
                        </label>

                        <button type='submit' className={styles.primaryButton} disabled={savingSettings}>
                            {savingSettings ? 'Đang lưu...' : 'Lưu cấu hình'}
                        </button>
                    </form>
                </section>

                <section className={styles.panel}>
                    <div className={styles.panelTitle}>Bộ lọc yêu cầu rút tiền</div>
                    <div className={styles.filterRow}>
                        {['PENDING', 'APPROVED', 'REJECTED', ''].map((item) => (
                            <button
                                key={item || 'ALL'}
                                type='button'
                                className={`${styles.filterButton} ${
                                    filter === item ? styles.filterButtonActive : ''
                                }`}
                                onClick={() => setFilter(item)}
                            >
                                {item || 'ALL'}
                            </button>
                        ))}
                    </div>

                    <div className={styles.panelHint}>
                        Mức rút tối thiểu hiện tại là{' '}
                        <strong>{formatCurrency(summary?.minimumPayoutAmount)}</strong>.
                    </div>
                </section>
            </div>

            <section className={styles.panel}>
                <div className={styles.panelTitle}>Danh sách yêu cầu rút tiền</div>

                {requests.length === 0 ? (
                    <div className={styles.empty}>Không có yêu cầu nào trong bộ lọc hiện tại.</div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Owner</th>
                                    <th>Số tiền</th>
                                    <th>Thông tin nhận</th>
                                    <th>Trạng thái</th>
                                    <th>Ghi chú</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((item) => {
                                    const isPending = String(item.status || '').toUpperCase() === 'PENDING';
                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <strong>#{item.ownerId}</strong>
                                                <div>{item.ownerEmail || '-'}</div>
                                                <div>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '-'}</div>
                                            </td>
                                            <td>{formatCurrency(item.amount)}</td>
                                            <td>
                                                <div>{item.bankName}</div>
                                                <div>{item.bankAccountNumber}</div>
                                                <div>{item.bankAccountHolder}</div>
                                            </td>
                                            <td>
                                                <span className={`${styles.status} ${getStatusClass(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td>{item.adminNote || item.payoutReference || item.ownerNote || '-'}</td>
                                            <td>
                                                <div className={styles.actionStack}>
                                                    <button
                                                        type='button'
                                                        className={styles.detailButton}
                                                        onClick={() => loadRequestDetail(item.id)}
                                                    >
                                                        Chi tiết
                                                    </button>
                                                    <button
                                                        type='button'
                                                        className={styles.approveButton}
                                                        disabled={!isPending || processingId === item.id}
                                                        onClick={() => handleReview(item.id, 'approve')}
                                                    >
                                                        Duyệt
                                                    </button>
                                                    <button
                                                        type='button'
                                                        className={styles.rejectButton}
                                                        disabled={!isPending || processingId === item.id}
                                                        onClick={() => handleReview(item.id, 'reject')}
                                                    >
                                                        Từ chối
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {selectedRequest ? (
                <section className={styles.panel}>
                    <div className={styles.panelTitle}>Chi tiết yêu cầu đang chọn</div>
                    <div className={styles.panelHint}>
                        {detailLoading ? 'Đang tải chi tiết...' : 'Theo dõi đầy đủ thông tin trước khi duyệt hoặc từ chối.'}
                    </div>

                    <div className={styles.detailGrid}>
                        <article className={styles.detailCard}>
                            <div className={styles.detailLabel}>Owner</div>
                            <strong>#{selectedRequest.ownerId}</strong>
                            <p>{selectedRequest.ownerEmail || '-'}</p>
                        </article>
                        <article className={styles.detailCard}>
                            <div className={styles.detailLabel}>Số tiền</div>
                            <strong>{formatCurrency(selectedRequest.amount)}</strong>
                            <p>{selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString('vi-VN') : '-'}</p>
                        </article>
                        <article className={styles.detailCard}>
                            <div className={styles.detailLabel}>Trạng thái</div>
                            <strong>
                                <span className={`${styles.status} ${getStatusClass(selectedRequest.status)}`}>
                                    {selectedRequest.status}
                                </span>
                            </strong>
                            <p>{selectedRequest.reviewedAt ? new Date(selectedRequest.reviewedAt).toLocaleString('vi-VN') : 'Chưa xử lý'}</p>
                        </article>
                    </div>

                    <div className={styles.detailColumns}>
                        <div className={styles.detailBlock}>
                            <div className={styles.detailLabel}>Thông tin nhận tiền</div>
                            <p>{selectedRequest.bankName || '-'}</p>
                            <p>{selectedRequest.bankAccountNumber || '-'}</p>
                            <p>{selectedRequest.bankAccountHolder || '-'}</p>
                        </div>
                        <div className={styles.detailBlock}>
                            <div className={styles.detailLabel}>Ghi chú owner</div>
                            <p>{selectedRequest.ownerNote || '-'}</p>
                            <div className={styles.detailLabel}>Ghi chú admin</div>
                            <p>{selectedRequest.adminNote || '-'}</p>
                        </div>
                        <div className={styles.detailBlock}>
                            <div className={styles.detailLabel}>Xử lý</div>
                            <p>Admin: {selectedRequest.reviewedByEmail || '-'}</p>
                            <p>Mã đối soát: {selectedRequest.payoutReference || '-'}</p>
                            <p>Cập nhật: {selectedRequest.updatedAt ? new Date(selectedRequest.updatedAt).toLocaleString('vi-VN') : '-'}</p>
                        </div>
                    </div>
                </section>
            ) : null}
        </div>
    );
}

