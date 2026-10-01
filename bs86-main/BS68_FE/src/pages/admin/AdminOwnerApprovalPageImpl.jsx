import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Toast from '../../components/ui/Toast';
import { extractList } from './admin.utils';
import styles from './AdminApprovalPage.module.css';

const TABS = {
    PENDING: 'PENDING',
    MANAGEMENT: 'MANAGEMENT'
};

const REGISTRATION_FAILED_REASON = 'Đăng ký không thành công';

function getRequestMessage(requestError, fallback) {
    return requestError?.response?.data?.message || requestError?.message || fallback;
}

function getStatusMeta(status) {
    const normalized = String(status || '').toUpperCase();

    if (normalized === 'ACTIVE') {
        return { label: 'Đang hoạt động', className: styles.statusActive };
    }

    if (normalized === 'BLOCKED') {
        return { label: 'Đã khóa', className: styles.statusBlocked };
    }

    return { label: normalized || 'Không rõ', className: styles.statusNeutral };
}

function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function getOwnerReason(owner) {
    const reason = owner?.reason || owner?.blockReason || owner?.lastReason || owner?.rejectionReason;

    if (String(owner?.status || '').toUpperCase() === 'BLOCKED') {
        return reason || REGISTRATION_FAILED_REASON;
    }

    return reason || 'Không có ghi chú';
}

export default function AdminOwnerApprovalPageImpl({
    onPendingCountChange,
    onRefreshStats
}) {
    // Dùng ref để tránh callback props tạo ra dependency chain không ổn định
    const onPendingCountChangeRef = useRef(onPendingCountChange);
    const onRefreshStatsRef = useRef(onRefreshStats);
    onPendingCountChangeRef.current = onPendingCountChange;
    onRefreshStatsRef.current = onRefreshStats;

    const [activeTab, setActiveTab] = useState(TABS.PENDING);
    const [pendingItems, setPendingItems] = useState([]);
    const [managedOwners, setManagedOwners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [confirmingApprove, setConfirmingApprove] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const [blockingId, setBlockingId] = useState(null);
    const [blockReason, setBlockReason] = useState('');
    const [activatingId, setActivatingId] = useState(null);
    const [activateReason, setActivateReason] = useState('');

    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const dismissToast = useCallback(() => setToast(null), []);

    const syncPendingItems = useCallback((nextItems) => {
        setPendingItems(nextItems);
        onPendingCountChangeRef.current?.(nextItems.length);
    }, []);

    const resetRowActions = useCallback(() => {
        setConfirmingApprove(null);
        setRejectingId(null);
        setRejectReason('');
        setBlockingId(null);
        setBlockReason('');
        setActivatingId(null);
        setActivateReason('');
    }, []);

    const loadPendingOwners = useCallback(async () => {
        setLoading(true);
        setError('');
        resetRowActions();

        try {
            const response = await adminApi.getPendingOwners();
            syncPendingItems(extractList(response));
        } catch (requestError) {
            const status = requestError?.response?.status;
            const message = getRequestMessage(requestError, 'Không thể tải danh sách owner chờ duyệt.');
            setError(status ? `Load failed. Status=${status}. ${message}` : message);
        } finally {
            setLoading(false);
        }
    }, [resetRowActions, syncPendingItems]);

    const loadManagedOwners = useCallback(async () => {
        setLoading(true);
        setError('');
        resetRowActions();

        try {
            const response = await adminApi.getManagedOwners();
            setManagedOwners(extractList(response));
        } catch (requestError) {
            const status = requestError?.response?.status;
            const message = getRequestMessage(requestError, 'Không thể tải danh sách owner đang quản lý.');
            setError(status ? `Load failed. Status=${status}. ${message}` : message);
        } finally {
            setLoading(false);
        }
    }, [resetRowActions]);

    const loadCurrentTab = useCallback(() => {
        if (activeTab === TABS.MANAGEMENT) {
            return loadManagedOwners();
        }

        return loadPendingOwners();
    }, [activeTab, loadManagedOwners, loadPendingOwners]);

    useEffect(() => {
        loadCurrentTab();
    }, [loadCurrentTab]);

    const handleApproveConfirm = async (verificationId) => {
        setActionLoading(true);
        setError('');

        try {
            await adminApi.approveOwner(verificationId);
            syncPendingItems(pendingItems.filter((item) => item.id !== verificationId));
            onRefreshStatsRef.current?.();
            setError('');
            setToast({ message: 'Duyệt owner thành công!', type: 'success' });
        } catch (requestError) {
            const msg = getRequestMessage(requestError, 'Duyệt owner thất bại.');
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
            syncPendingItems(pendingItems.filter((item) => item.id !== verificationId));
            onRefreshStatsRef.current?.();
            setError('');
            setToast({ message: 'Từ chối owner thành công.', type: 'success' });
        } catch (requestError) {
            const msg = getRequestMessage(requestError, 'Từ chối owner thất bại.');
            setError(msg);
            setToast({ message: msg, type: 'error' });
        } finally {
            setActionLoading(false);
            setRejectingId(null);
            setRejectReason('');
        }
    };

    const handleBlockConfirm = async (userId) => {
        const trimmed = blockReason.trim();

        if (!trimmed) {
            setError('Vui lòng nhập lý do khóa owner.');
            return;
        }

        setActionLoading(true);
        setError('');

        try {
            await adminApi.blockOwner(userId, trimmed);
            await loadManagedOwners();
            onRefreshStatsRef.current?.();
            setError('');
            setToast({ message: 'Đã khóa owner thành công.', type: 'success' });
        } catch (requestError) {
            const msg = getRequestMessage(requestError, 'Khóa owner thất bại.');
            setError(msg);
            setToast({ message: msg, type: 'error' });
        } finally {
            setActionLoading(false);
            setBlockingId(null);
            setBlockReason('');
        }
    };

    const handleActivateConfirm = async (userId) => {
        const trimmed = activateReason.trim();

        setActionLoading(true);
        setError('');

        try {
            await adminApi.activateOwner(userId, trimmed || 'Admin active lại owner');
            await loadManagedOwners();
            onRefreshStatsRef.current?.();
            setError('');
            setToast({ message: 'Đã active lại owner thành công.', type: 'success' });
        } catch (requestError) {
            const msg = getRequestMessage(requestError, 'Active lại owner thất bại.');
            setError(msg);
            setToast({ message: msg, type: 'error' });
        } finally {
            setActionLoading(false);
            setActivatingId(null);
            setActivateReason('');
        }
    };

    const visibleCount = activeTab === TABS.PENDING ? pendingItems.length : managedOwners.length;

    return (
        <div className={styles.panel}>
            <Toast toast={toast} onDismiss={dismissToast} />
            <div className={styles.header}>
                <div>
                    <div className={styles.eyebrow}>Owner Approval</div>
                    <h2 className={styles.title}>Duyệt và quản lý chủ sân</h2>
                    <p className={styles.description}>
                        Kiểm tra hồ sơ đăng ký owner, quản lý trạng thái active hoặc blocked,
                        và ghi nhận lý do khi admin thay đổi trạng thái tài khoản.
                    </p>
                </div>

                <div className={styles.toolbar}>
                    <div className={styles.counterChip}>
                        {activeTab === TABS.PENDING
                            ? `${visibleCount} owner chờ duyệt`
                            : `${visibleCount} owner đang quản lý`}
                    </div>
                    <button type='button' className={styles.primaryButton} onClick={loadCurrentTab} disabled={loading}>
                        {loading ? 'Đang tải...' : 'Tải lại'}
                    </button>
                </div>
            </div>

            <div className={styles.tabGroup}>
                <button
                    type='button'
                    className={`${styles.tabButton} ${activeTab === TABS.PENDING ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab(TABS.PENDING)}
                >
                    Chờ duyệt
                </button>
                <button
                    type='button'
                    className={`${styles.tabButton} ${activeTab === TABS.MANAGEMENT ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab(TABS.MANAGEMENT)}
                >
                    Quản lý Owner
                </button>
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            {activeTab === TABS.PENDING ? (
                <PendingOwnerTable
                    items={pendingItems}
                    loading={loading}
                    confirmingApprove={confirmingApprove}
                    rejectingId={rejectingId}
                    rejectReason={rejectReason}
                    actionLoading={actionLoading}
                    onApprove={(id) => {
                        setConfirmingApprove(id);
                        setRejectingId(null);
                        setError('');
                    }}
                    onCancelApprove={() => setConfirmingApprove(null)}
                    onApproveConfirm={handleApproveConfirm}
                    onReject={(id) => {
                        setRejectingId(id);
                        setRejectReason('');
                        setConfirmingApprove(null);
                        setError('');
                    }}
                    onRejectReasonChange={setRejectReason}
                    onRejectConfirm={handleRejectConfirm}
                    onCancelReject={() => {
                        setRejectingId(null);
                        setRejectReason('');
                    }}
                />
            ) : (
                <ManagedOwnerTable
                    owners={managedOwners}
                    loading={loading}
                    blockingId={blockingId}
                    blockReason={blockReason}
                    activatingId={activatingId}
                    activateReason={activateReason}
                    actionLoading={actionLoading}
                    onBlock={(id) => {
                        setBlockingId(id);
                        setBlockReason('');
                        setActivatingId(null);
                        setActivateReason('');
                        setError('');
                    }}
                    onBlockReasonChange={setBlockReason}
                    onBlockConfirm={handleBlockConfirm}
                    onCancelBlock={() => {
                        setBlockingId(null);
                        setBlockReason('');
                    }}
                    onActivate={(id) => {
                        setActivatingId(id);
                        setActivateReason('');
                        setBlockingId(null);
                        setBlockReason('');
                        setError('');
                    }}
                    onActivateReasonChange={setActivateReason}
                    onActivateConfirm={handleActivateConfirm}
                    onCancelActivate={() => {
                        setActivatingId(null);
                        setActivateReason('');
                    }}
                />
            )}
        </div>
    );
}

function PendingOwnerTable({
    items,
    loading,
    confirmingApprove,
    rejectingId,
    rejectReason,
    actionLoading,
    onApprove,
    onCancelApprove,
    onApproveConfirm,
    onReject,
    onRejectReasonChange,
    onRejectConfirm,
    onCancelReject
}) {
    if (loading && items.length === 0) {
        return <div className={styles.empty}>Đang tải danh sách chờ duyệt...</div>;
    }

    if (items.length === 0) {
        return <div className={styles.empty}>Không có owner nào đang chờ duyệt.</div>;
    }

    return (
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
                                ? { background: 'rgba(239,68,68,0.18)', color: '#b91c1c', border: '1px solid rgba(239,68,68,0.3)' }
                                : item.attemptCount === 2
                                ? { background: 'rgba(249,115,22,0.18)', color: '#c2410c', border: '1px solid rgba(249,115,22,0.3)' }
                                : { background: 'rgba(148,163,184,0.12)', color: '#475569', border: '1px solid rgba(148,163,184,0.2)' };

                        return (
                            <Fragment key={item.id}>
                                <tr style={{ background: attemptBg }}>
                                    <td className={styles.cellStrong}>{item.id}</td>
                                    <td>{item.ownerName || <span className={styles.muted}>Không có</span>}</td>
                                    <td>{item.ownerEmail || <span className={styles.muted}>Không có</span>}</td>
                                    <td>{item.phoneNumber || <span className={styles.muted}>Không có</span>}</td>
                                    <td>{item.idCardNumber || <span className={styles.muted}>Không có</span>}</td>
                                    <td>
                                        <div className={styles.fileLinks}>
                                            {item.idCardFrontUrl ? (
                                                <a className={styles.link} href={item.idCardFrontUrl} target='_blank' rel='noreferrer'>
                                                    Mặt trước ↗
                                                </a>
                                            ) : (
                                                <span className={styles.muted}>Chưa có</span>
                                            )}
                                            {item.idCardBackUrl ? (
                                                <a className={styles.link} href={item.idCardBackUrl} target='_blank' rel='noreferrer'>
                                                    Mặt sau ↗
                                                </a>
                                            ) : (
                                                <span className={styles.muted}>Chưa có</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {item.businessLicenseUrl ? (
                                            <a className={styles.link} href={item.businessLicenseUrl} target='_blank' rel='noreferrer'>
                                                Xem giấy phép ↗
                                            </a>
                                        ) : (
                                            <span className={styles.muted}>Chưa có file</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={styles.attemptBadge} style={badgeStyle}>
                                            Lần {item.attemptCount || 1}/3
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actionGroup}>
                                            {confirmingApprove === item.id ? (
                                                <>
                                                    <span className={styles.inlinePrompt}>Duyệt owner này?</span>
                                                    <button
                                                        type='button'
                                                        className={styles.approveButton}
                                                        onClick={() => onApproveConfirm(item.id)}
                                                        disabled={actionLoading}
                                                    >
                                                        {actionLoading ? '...' : 'Xác nhận'}
                                                    </button>
                                                    <button type='button' className={styles.primaryButton} onClick={onCancelApprove} disabled={actionLoading}>
                                                        Hủy
                                                    </button>
                                                </>
                                            ) : rejectingId === item.id ? (
                                                <span className={styles.inlinePrompt}>Nhập lý do bên dưới</span>
                                            ) : (
                                                <>
                                                    <button type='button' className={styles.approveButton} onClick={() => onApprove(item.id)}>
                                                        Approve
                                                    </button>
                                                    <button type='button' className={styles.rejectButton} onClick={() => onReject(item.id)}>
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>

                                {rejectingId === item.id ? (
                                    <ReasonRow
                                        colSpan={9}
                                        tone='danger'
                                        value={rejectReason}
                                        placeholder='Nhập lý do từ chối...'
                                        confirmLabel='Xác nhận từ chối'
                                        confirmClassName={styles.rejectButton}
                                        actionLoading={actionLoading}
                                        confirmDisabled={!rejectReason.trim()}
                                        onChange={onRejectReasonChange}
                                        onConfirm={() => onRejectConfirm(item.id)}
                                        onCancel={onCancelReject}
                                    />
                                ) : null}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function ManagedOwnerTable({
    owners,
    loading,
    blockingId,
    blockReason,
    activatingId,
    activateReason,
    actionLoading,
    onBlock,
    onBlockReasonChange,
    onBlockConfirm,
    onCancelBlock,
    onActivate,
    onActivateReasonChange,
    onActivateConfirm,
    onCancelActivate
}) {
    if (loading && owners.length === 0) {
        return <div className={styles.empty}>Đang tải danh sách owner...</div>;
    }

    if (owners.length === 0) {
        return <div className={styles.empty}>Chưa có owner active hoặc blocked.</div>;
    }

    return (
        <div className={styles.tableWrap}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Owner ID</th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>SĐT</th>
                        <th>Trạng thái</th>
                        <th>Số sân</th>
                        <th>Lý do/Ghi chú</th>
                        <th>Cập nhật</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {owners.map((owner) => {
                        const statusMeta = getStatusMeta(owner.status);
                        const status = String(owner.status || '').toUpperCase();

                        return (
                            <Fragment key={owner.id}>
                                <tr>
                                    <td className={styles.cellStrong}>{owner.id}</td>
                                    <td>{owner.ownerId || <span className={styles.muted}>Không có</span>}</td>
                                    <td>{owner.ownerName || <span className={styles.muted}>Không có</span>}</td>
                                    <td>{owner.ownerEmail || <span className={styles.muted}>Không có</span>}</td>
                                    <td>{owner.phoneNumber || <span className={styles.muted}>Không có</span>}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${statusMeta.className}`}>
                                            {statusMeta.label}
                                        </span>
                                    </td>
                                    <td>{owner.fieldCount ?? 0}</td>
                                    <td className={styles.reasonCell}>{getOwnerReason(owner)}</td>
                                    <td className={styles.muted}>{formatDate(owner.updatedAt)}</td>
                                    <td>
                                        <div className={styles.actionGroup}>
                                            {status === 'ACTIVE' ? (
                                                blockingId === owner.id ? (
                                                    <span className={styles.inlinePrompt}>Nhập lý do bên dưới</span>
                                                ) : (
                                                    <button type='button' className={styles.rejectButton} onClick={() => onBlock(owner.id)}>
                                                        Block
                                                    </button>
                                                )
                                            ) : null}

                                            {status === 'BLOCKED' ? (
                                                activatingId === owner.id ? (
                                                    <span className={styles.inlinePrompt}>Xác nhận active lại</span>
                                                ) : (
                                                    <button type='button' className={styles.approveButton} onClick={() => onActivate(owner.id)}>
                                                        Active lại
                                                    </button>
                                                )
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>

                                {blockingId === owner.id ? (
                                    <ReasonRow
                                        colSpan={10}
                                        tone='danger'
                                        value={blockReason}
                                        placeholder='Nhập lý do khóa owner...'
                                        confirmLabel='Xác nhận khóa'
                                        confirmClassName={styles.rejectButton}
                                        actionLoading={actionLoading}
                                        confirmDisabled={!blockReason.trim()}
                                        onChange={onBlockReasonChange}
                                        onConfirm={() => onBlockConfirm(owner.id)}
                                        onCancel={onCancelBlock}
                                    />
                                ) : null}

                                {activatingId === owner.id ? (
                                    <ReasonRow
                                        colSpan={10}
                                        tone='success'
                                        value={activateReason}
                                        placeholder='Ghi chú khi active lại (không bắt buộc)...'
                                        confirmLabel='Xác nhận active'
                                        confirmClassName={styles.approveButton}
                                        actionLoading={actionLoading}
                                        confirmDisabled={false}
                                        onChange={onActivateReasonChange}
                                        onConfirm={() => onActivateConfirm(owner.id)}
                                        onCancel={onCancelActivate}
                                    />
                                ) : null}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function ReasonRow({
    colSpan,
    tone,
    value,
    placeholder,
    confirmLabel,
    confirmClassName,
    actionLoading,
    confirmDisabled,
    onChange,
    onConfirm,
    onCancel
}) {
    const rowClassName = tone === 'success' ? styles.reasonRowSuccess : styles.reasonRowDanger;

    return (
        <tr>
            <td colSpan={colSpan} className={rowClassName}>
                <div className={styles.reasonEditor}>
                    <textarea
                        rows={2}
                        placeholder={placeholder}
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        className={styles.reasonInput}
                    />
                    <div className={styles.reasonActions}>
                        <button
                            type='button'
                            className={confirmClassName}
                            onClick={onConfirm}
                            disabled={actionLoading || confirmDisabled}
                        >
                            {actionLoading ? '...' : confirmLabel}
                        </button>
                        <button type='button' className={styles.primaryButton} onClick={onCancel} disabled={actionLoading}>
                            Hủy
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
}
