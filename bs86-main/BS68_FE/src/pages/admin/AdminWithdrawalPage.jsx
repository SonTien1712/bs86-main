import { useEffect, useState } from 'react';
import { withdrawalApi } from '../../api/withdrawalApi';
import s from './AdminWithdrawalPage.module.css';

function formatVnd(amount) {
    if (amount == null || isNaN(amount)) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function statusLabel(status) {
    switch (String(status || '').toUpperCase()) {
        case 'PENDING':    return 'Chờ duyệt';
        case 'APPROVED':   return 'Đã duyệt';
        case 'PROCESSING': return 'Đang xử lý';
        case 'COMPLETED':  return 'Hoàn thành';
        case 'REJECTED':   return 'Từ chối';
        case 'FAILED':     return 'Thất bại';
        default:           return status || '—';
    }
}

function statusClass(status) {
    switch (String(status || '').toUpperCase()) {
        case 'COMPLETED':  return s.badgeGreen;
        case 'PROCESSING': return s.badgeBlue;
        case 'PENDING':    return s.badgeOrange;
        case 'APPROVED':   return s.badgeTeal;
        case 'REJECTED':
        case 'FAILED':     return s.badgeRed;
        default:           return s.badgeGray;
    }
}

// ─── Approve Modal ────────────────────────────────────────────────────────────
function ApproveModal({ request, onClose, onDone }) {
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');

    const handleApprove = async () => {
        if (!password) { setError('Vui lòng nhập mật khẩu.'); return; }
        setLoading(true);
        setError('');
        try {
            await withdrawalApi.approveWithdrawal(request.id, password);
            onDone('approved');
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Duyệt thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={s.overlay} onClick={onClose}>
            <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                <div className={s.modalHeader}>
                    <h3 className={s.modalTitle}>✅ Duyệt yêu cầu rút tiền</h3>
                    <button type='button' className={s.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={s.modalBody}>
                    <div className={s.infoGrid}>
                        <div className={s.infoRow}>
                            <span className={s.infoLabel}>Mã yêu cầu</span>
                            <span className={s.infoValue}>#{request.id}</span>
                        </div>
                        <div className={s.infoRow}>
                            <span className={s.infoLabel}>Merchant</span>
                            <span className={s.infoValue}>#{request.merchantId}</span>
                        </div>
                        <div className={s.infoRow}>
                            <span className={s.infoLabel}>Số tiền rút</span>
                            <span className={`${s.infoValue} ${s.amtHighlight}`}>{formatVnd(request.amount)}</span>
                        </div>
                        <div className={s.infoRow}>
                            <span className={s.infoLabel}>Phí</span>
                            <span className={s.infoValue}>{formatVnd(request.fee)}</span>
                        </div>
                        <div className={s.infoRow}>
                            <span className={s.infoLabel}>Thực chuyển</span>
                            <span className={`${s.infoValue} ${s.netHighlight}`}>{formatVnd(request.netAmount)}</span>
                        </div>
                        {request.bankInfo && (
                            <>
                                <div className={s.infoRow}>
                                    <span className={s.infoLabel}>Ngân hàng</span>
                                    <span className={s.infoValue}>{request.bankInfo.bankName}</span>
                                </div>
                                <div className={s.infoRow}>
                                    <span className={s.infoLabel}>Số TK</span>
                                    <span className={`${s.infoValue} ${s.mono}`}>{request.bankInfo.accountNumber}</span>
                                </div>
                                <div className={s.infoRow}>
                                    <span className={s.infoLabel}>Chủ TK</span>
                                    <span className={s.infoValue}>{request.bankInfo.accountHolderName}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className={s.passwordSection}>
                        <label className={s.passwordLabel}>
                            🔐 Xác nhận mật khẩu Admin để thực hiện
                        </label>
                        <input
                            type='password'
                            className={s.passwordInput}
                            placeholder='Nhập mật khẩu của bạn...'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApprove()}
                            autoFocus
                        />
                    </div>

                    {error && <div className={s.errMsg}>{error}</div>}
                </div>

                <div className={s.modalFooter}>
                    <button type='button' className={s.btnCancel} onClick={onClose}>
                        Huỷ
                    </button>
                    <button
                        type='button'
                        className={s.btnApprove}
                        onClick={handleApprove}
                        disabled={loading || !password}
                    >
                        {loading ? 'Đang xử lý...' : '✅ Xác nhận duyệt'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────
function RejectModal({ request, onClose, onDone }) {
    const [password, setPassword] = useState('');
    const [note, setNote]         = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');

    const handleReject = async () => {
        if (!password) { setError('Vui lòng nhập mật khẩu.'); return; }
        if (!note.trim()) { setError('Vui lòng nhập lý do từ chối.'); return; }
        setLoading(true);
        setError('');
        try {
            await withdrawalApi.rejectWithdrawal(request.id, password, note);
            onDone('rejected');
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Từ chối thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={s.overlay} onClick={onClose}>
            <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                <div className={s.modalHeader}>
                    <h3 className={s.modalTitle}>❌ Từ chối yêu cầu rút tiền</h3>
                    <button type='button' className={s.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={s.modalBody}>
                    <div className={s.infoGrid}>
                        <div className={s.infoRow}>
                            <span className={s.infoLabel}>Mã yêu cầu</span>
                            <span className={s.infoValue}>#{request.id}</span>
                        </div>
                        <div className={s.infoRow}>
                            <span className={s.infoLabel}>Merchant</span>
                            <span className={s.infoValue}>#{request.merchantId}</span>
                        </div>
                        <div className={s.infoRow}>
                            <span className={s.infoLabel}>Số tiền rút</span>
                            <span className={`${s.infoValue} ${s.amtHighlight}`}>{formatVnd(request.amount)}</span>
                        </div>
                    </div>

                    <div className={s.passwordSection}>
                        <label className={s.passwordLabel}>Lý do từ chối</label>
                        <textarea
                            className={s.textarea}
                            placeholder='Nhập lý do từ chối để thông báo cho merchant...'
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className={s.passwordSection}>
                        <label className={s.passwordLabel}>
                            🔐 Xác nhận mật khẩu Admin
                        </label>
                        <input
                            type='password'
                            className={s.passwordInput}
                            placeholder='Nhập mật khẩu của bạn...'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleReject()}
                        />
                    </div>

                    {error && <div className={s.errMsg}>{error}</div>}
                </div>

                <div className={s.modalFooter}>
                    <button type='button' className={s.btnCancel} onClick={onClose}>
                        Huỷ
                    </button>
                    <button
                        type='button'
                        className={s.btnReject}
                        onClick={handleReject}
                        disabled={loading || !password || !note.trim()}
                    >
                        {loading ? 'Đang xử lý...' : '❌ Xác nhận từ chối'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminWithdrawalPage({ onPendingCountChange }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [approveTarget, setApproveTarget] = useState(null);
    const [rejectTarget, setRejectTarget]   = useState(null);
    const [toast, setToast] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await withdrawalApi.getPendingWithdrawals();
            const list = Array.isArray(data) ? data : [];
            setRequests(list);
            onPendingCountChange?.(list.length);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Không tải được dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const handleApproved = () => {
        setApproveTarget(null);
        showToast('✅ Đã duyệt và chuyển tiền thành công!');
        load();
    };

    const handleRejected = () => {
        setRejectTarget(null);
        showToast('❌ Đã từ chối yêu cầu rút tiền.');
        load();
    };

    return (
        <div className={s.page}>
            {/* Toast */}
            {toast && <div className={s.toast}>{toast}</div>}

            <div className={s.pageHeader}>
                <div>
                    <h2 className={s.pageTitle}>Yêu cầu rút tiền</h2>
                    <p className={s.pageDesc}>
                        Danh sách các yêu cầu rút tiền đang chờ duyệt từ chủ sân.
                        Xác nhận mật khẩu Admin trước khi thực hiện.
                    </p>
                </div>
                <button type='button' className={s.refreshBtn} onClick={load} disabled={loading}>
                    {loading ? '⟳ Đang tải...' : '↻ Làm mới'}
                </button>
            </div>

            {error && <div className={s.errorMsg}>{error}</div>}

            {loading ? (
                <div className={s.loading}>Đang tải yêu cầu rút tiền...</div>
            ) : requests.length === 0 ? (
                <div className={s.empty}>
                    <div className={s.emptyIcon}>💰</div>
                    <div>Không có yêu cầu rút tiền nào đang chờ duyệt.</div>
                </div>
            ) : (
                <>
                    <div className={s.countBadge}>{requests.length} yêu cầu đang chờ</div>
                    <div className={s.tableWrap}>
                        <table className={s.table}>
                            <thead>
                                <tr>
                                    <th>#ID</th>
                                    <th>Merchant</th>
                                    <th>Số tiền rút</th>
                                    <th>Phí</th>
                                    <th>Thực chuyển</th>
                                    <th>Ngân hàng</th>
                                    <th>Số TK</th>
                                    <th>Chủ TK</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req) => (
                                    <tr key={req.id}>
                                        <td className={s.idCell}>#{req.id}</td>
                                        <td>#{req.merchantId}</td>
                                        <td className={s.amtCell}>{formatVnd(req.amount)}</td>
                                        <td className={s.feeCell}>{formatVnd(req.fee)}</td>
                                        <td className={s.netCell}>{formatVnd(req.netAmount)}</td>
                                        <td>{req.bankInfo?.bankName || '—'}</td>
                                        <td className={s.monoCell}>{req.bankInfo?.accountNumber || '—'}</td>
                                        <td>{req.bankInfo?.accountHolderName || '—'}</td>
                                        <td>
                                            <span className={`${s.badge} ${statusClass(req.status)}`}>
                                                {statusLabel(req.status)}
                                            </span>
                                        </td>
                                        <td className={s.dateCell}>
                                            {req.createdAt
                                                ? new Date(req.createdAt).toLocaleDateString('vi-VN')
                                                : '—'}
                                        </td>
                                        <td>
                                            <div className={s.actions}>
                                                <button
                                                    type='button'
                                                    className={s.btnApproveRow}
                                                    onClick={() => setApproveTarget(req)}
                                                >
                                                    Duyệt
                                                </button>
                                                <button
                                                    type='button'
                                                    className={s.btnRejectRow}
                                                    onClick={() => setRejectTarget(req)}
                                                >
                                                    Từ chối
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Modals */}
            {approveTarget && (
                <ApproveModal
                    request={approveTarget}
                    onClose={() => setApproveTarget(null)}
                    onDone={handleApproved}
                />
            )}
            {rejectTarget && (
                <RejectModal
                    request={rejectTarget}
                    onClose={() => setRejectTarget(null)}
                    onDone={handleRejected}
                />
            )}
        </div>
    );
}
