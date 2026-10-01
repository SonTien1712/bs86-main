import { Fragment, useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Toast from '../../components/ui/Toast';
import { extractList } from './admin.utils';
import AdminOwnerApprovalPageImpl from './AdminOwnerApprovalPageImpl';
import styles from './AdminApprovalPage.module.css';

export default function AdminOwnerApprovalPage(props) {
    return <AdminOwnerApprovalPageImpl {...props} />;
}

export function LegacyAdminOwnerApprovalPage({
    onPendingCountChange,
    onRefreshStats
}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Track which row is pending approve confirmation
    const [confirmingApprove, setConfirmingApprove] = useState(null);
    // Track which row is in reject mode + its reason input
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }
    const dismissToast = useCallback(() => setToast(null), []);

    const syncItems = (nextItems) => {
        setItems(nextItems);
        onPendingCountChange?.(nextItems.length);
    };

    const load = async () => {
        setLoading(true);
        setError('');
        setConfirmingApprove(null);
        setRejectingId(null);

        try {
            const response = await adminApi.getPendingOwners();
            syncItems(extractList(response));
        } catch (requestError) {
            const status = requestError?.response?.status;
            const message =
                requestError?.response?.data?.message ||
                requestError?.message ||
                'Không thể tải danh sách owner chờ duyệt.';
            setError(status ? `Load failed. Status=${status}. ${message}` : message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleApproveConfirm = async (verificationId) => {
        setActionLoading(true);
        try {
            await adminApi.approveOwner(verificationId);
            const nextItems = items.filter((item) => item.id !== verificationId);
            syncItems(nextItems);
            onRefreshStats?.();
            setToast({ message: 'Duyệt owner thành công!', type: 'success' });
        } catch (requestError) {
            const msg =
                requestError?.response?.data?.message ||
                requestError?.message ||
                'Duyệt owner thất bại.';
            setError(msg);
            setToast({ message: msg, type: 'error' });
        } finally {
            setActionLoading(false);
            setConfirmingApprove(null);
        }
    };

    const handleRejectConfirm = async (verificationId) => {
        const trimmed = rejectReason.trim();
        if (!trimmed) {
            setError('Vui lòng nhập lý do từ chối.');
            return;
        }
        setActionLoading(true);
        setError('');
        try {
            await adminApi.rejectOwner(verificationId, trimmed);
            const nextItems = items.filter((item) => item.id !== verificationId);
            syncItems(nextItems);
            onRefreshStats?.();
            setToast({ message: 'Từ chối owner thành công.', type: 'success' });
        } catch (requestError) {
            const msg =
                requestError?.response?.data?.message ||
                requestError?.message ||
                'Từ chối owner thất bại.';
            setError(msg);
            setToast({ message: msg, type: 'error' });
        } finally {
            setActionLoading(false);
            setRejectingId(null);
            setRejectReason('');
        }
    };

    const openReject = (id) => {
        setRejectingId(id);
        setRejectReason('');
        setConfirmingApprove(null);
        setError('');
    };

    const openApprove = (id) => {
        setConfirmingApprove(id);
        setRejectingId(null);
        setError('');
    };

    return (
        <div className={styles.panel}>
            <Toast toast={toast} onDismiss={dismissToast} />
            <div className={styles.header}>
                <div>
                    <div className={styles.eyebrow}>Owner Approval</div>
                    <h2 className={styles.title}>Duyệt hồ sơ chủ sân</h2>
                    <p className={styles.description}>
                        Kiểm tra thông tin, số giấy tờ và giấy phép kinh doanh trước khi cấp quyền
                        owner cho tài khoản đăng ký.
                    </p>
                </div>

                <div className={styles.toolbar}>
                    <div className={styles.counterChip}>{items.length} owner chờ duyệt</div>
                    <button
                        type='button'
                        className={styles.primaryButton}
                        onClick={load}
                        disabled={loading}
                    >
                        {loading ? 'Đang tải...' : 'Tải lại'}
                    </button>
                </div>
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            {!loading && items.length === 0 ? (
                <div className={styles.empty}>Không có owner nào đang chờ duyệt.</div>
            ) : null}

            {items.length > 0 ? (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Họ tên</th>
                                <th>Email</th>
                                <th>SĐT</th>
                                <th>Số CCCD</th>
                                <th>Ảnh CCCD</th>
                                <th>Giấy phép KD</th>
                                <th>Lần nộp</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => {
                                const attemptBg =
                                    item.attemptCount === 3 ? 'rgba(239,68,68,0.08)' :
                                    item.attemptCount === 2 ? 'rgba(249,115,22,0.08)' : 'transparent';
                                const badgeStyle =
                                    item.attemptCount === 3
                                        ? { background: 'rgba(239,68,68,0.18)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }
                                        : item.attemptCount === 2
                                        ? { background: 'rgba(249,115,22,0.18)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)' }
                                        : { background: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' };
                                return (
                                <Fragment key={item.id}>
                                    <tr style={{ background: attemptBg }}>
                                        <td className={styles.cellStrong}>{item.id}</td>
                                        <td>{item.ownerName || <span className={styles.muted}>—</span>}</td>
                                        <td>{item.ownerEmail || <span className={styles.muted}>—</span>}</td>
                                        <td>{item.phoneNumber || <span className={styles.muted}>—</span>}</td>
                                        <td>{item.idCardNumber || <span className={styles.muted}>—</span>}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {item.idCardFrontUrl ? (
                                                    <a
                                                        className={styles.link}
                                                        href={item.idCardFrontUrl}
                                                        target='_blank'
                                                        rel='noreferrer'
                                                    >
                                                        Mặt trước ↗
                                                    </a>
                                                ) : (
                                                    <span className={styles.muted}>Chưa có</span>
                                                )}
                                                {item.idCardBackUrl ? (
                                                    <a
                                                        className={styles.link}
                                                        href={item.idCardBackUrl}
                                                        target='_blank'
                                                        rel='noreferrer'
                                                    >
                                                        Mặt sau ↗
                                                    </a>
                                                ) : (
                                                    <span className={styles.muted}>Chưa có</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {item.businessLicenseUrl ? (
                                                <a
                                                    className={styles.link}
                                                    href={item.businessLicenseUrl}
                                                    target='_blank'
                                                    rel='noreferrer'
                                                >
                                                    Xem giấy phép ↗
                                                </a>
                                            ) : (
                                                <span className={styles.muted}>Chưa có file</span>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '3px 10px',
                                                borderRadius: 20,
                                                fontSize: 12,
                                                fontWeight: 700,
                                                ...badgeStyle,
                                            }}>
                                                Lần {item.attemptCount}/3
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.actionGroup}>
                                                {confirmingApprove === item.id ? (
                                                    <>
                                                        <span style={{ fontSize: 13, color: '#a6b8d0' }}>Duyệt owner này?</span>
                                                        <button
                                                            type='button'
                                                            className={styles.approveButton}
                                                            onClick={() => handleApproveConfirm(item.id)}
                                                            disabled={actionLoading}
                                                        >
                                                            {actionLoading ? '...' : 'Xác nhận'}
                                                        </button>
                                                        <button
                                                            type='button'
                                                            className={styles.primaryButton}
                                                            onClick={() => setConfirmingApprove(null)}
                                                            disabled={actionLoading}
                                                            style={{ background: 'rgba(148,163,184,0.15)' }}
                                                        >
                                                            Huỷ
                                                        </button>
                                                    </>
                                                ) : rejectingId === item.id ? (
                                                    <span style={{ fontSize: 13, color: '#a6b8d0' }}>Nhập lý do →</span>
                                                ) : (
                                                    <>
                                                        <button
                                                            type='button'
                                                            className={styles.approveButton}
                                                            onClick={() => openApprove(item.id)}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            type='button'
                                                            className={styles.rejectButton}
                                                            onClick={() => openReject(item.id)}
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Inline reject reason row */}
                                    {rejectingId === item.id ? (
                                        <tr>
                                            <td colSpan={9} style={{
                                                padding: '12px 14px',
                                                background: 'rgba(239,68,68,0.06)',
                                                borderBottom: '1px solid rgba(239,68,68,0.15)',
                                            }}>
                                                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                    <textarea
                                                        rows={2}
                                                        placeholder='Nhập lý do từ chối...'
                                                        value={rejectReason}
                                                        onChange={(e) => setRejectReason(e.target.value)}
                                                        style={{
                                                            flex: 1, minWidth: 240, padding: '8px 12px',
                                                            borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)',
                                                            background: 'rgba(239,68,68,0.08)', color: '#f8fafc',
                                                            fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
                                                        }}
                                                    />
                                                    <div style={{ display: 'flex', gap: 8, paddingTop: 2 }}>
                                                        <button
                                                            type='button'
                                                            className={styles.rejectButton}
                                                            onClick={() => handleRejectConfirm(item.id)}
                                                            disabled={actionLoading || !rejectReason.trim()}
                                                        >
                                                            {actionLoading ? '...' : 'Xác nhận từ chối'}
                                                        </button>
                                                        <button
                                                            type='button'
                                                            className={styles.primaryButton}
                                                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                                            disabled={actionLoading}
                                                            style={{ background: 'rgba(148,163,184,0.15)' }}
                                                        >
                                                            Huỷ
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : null}
                                </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
}
