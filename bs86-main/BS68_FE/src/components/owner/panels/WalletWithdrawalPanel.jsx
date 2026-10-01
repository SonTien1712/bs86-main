import { useEffect, useState } from 'react';
import { withdrawalApi } from '../../../api/withdrawalApi';
import s from './WalletWithdrawalPanel.module.css';

const WITHDRAWAL_FEE = 3300;

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

// ─── Sub-section: Bank Accounts ──────────────────────────────────────────────
function BankAccountsSection({ bankAccounts, loadingBanks, onAdded }) {
    const [form, setForm] = useState({
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        isDefault: false
    });
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState('');
    const [showForm, setShowForm] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.bankName || !form.accountNumber || !form.accountHolderName) {
            setMsg('Vui lòng điền đầy đủ thông tin.');
            return;
        }
        setSubmitting(true);
        setMsg('');
        try {
            await withdrawalApi.addBankAccount(form);
            setMsg('✅ Đã thêm tài khoản!');
            setForm({ bankName: '', accountNumber: '', accountHolderName: '', isDefault: false });
            setShowForm(false);
            onAdded();
        } catch (err) {
            setMsg('❌ ' + (err?.response?.data?.message || err?.message || 'Lỗi không xác định'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={s.section}>
            <div className={s.sectionHeader}>
                <h4 className={s.sectionTitle}>Tài khoản ngân hàng</h4>
                <button
                    type='button'
                    className={s.btnOutline}
                    onClick={() => setShowForm((v) => !v)}
                >
                    {showForm ? 'Huỷ' : '+ Thêm tài khoản'}
                </button>
            </div>

            {showForm && (
                <form className={s.bankForm} onSubmit={handleSubmit}>
                    <div className={s.formRow}>
                        <div className={s.formGroup}>
                            <label className={s.label}>Tên ngân hàng</label>
                            <input
                                className={s.input}
                                name='bankName'
                                placeholder='Vd: Vietcombank, MB Bank...'
                                value={form.bankName}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={s.formGroup}>
                            <label className={s.label}>Số tài khoản</label>
                            <input
                                className={s.input}
                                name='accountNumber'
                                placeholder='Số tài khoản ngân hàng'
                                value={form.accountNumber}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className={s.formRow}>
                        <div className={s.formGroup}>
                            <label className={s.label}>Tên chủ tài khoản</label>
                            <input
                                className={s.input}
                                name='accountHolderName'
                                placeholder='Tên theo CMND/CCCD'
                                value={form.accountHolderName}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={s.formGroupCheck}>
                            <label className={s.checkLabel}>
                                <input
                                    type='checkbox'
                                    name='isDefault'
                                    checked={form.isDefault}
                                    onChange={handleChange}
                                />
                                Đặt làm mặc định
                            </label>
                        </div>
                    </div>
                    {msg && <div className={s.formMsg}>{msg}</div>}
                    <button type='submit' className={s.btnPrimary} disabled={submitting}>
                        {submitting ? 'Đang lưu...' : 'Lưu tài khoản'}
                    </button>
                </form>
            )}

            {!showForm && msg && <div className={s.formMsg}>{msg}</div>}

            {loadingBanks ? (
                <div className={s.empty}>Đang tải...</div>
            ) : bankAccounts.length === 0 ? (
                <div className={s.empty}>Chưa có tài khoản ngân hàng nào. Thêm để bắt đầu rút tiền.</div>
            ) : (
                <div className={s.bankList}>
                    {bankAccounts.map((acc) => (
                        <div className={s.bankCard} key={acc.id}>
                            <div className={s.bankIcon}>🏦</div>
                            <div className={s.bankInfo}>
                                <div className={s.bankName}>{acc.bankName}</div>
                                <div className={s.bankNumber}>{acc.accountNumber}</div>
                                <div className={s.bankHolder}>{acc.accountHolderName}</div>
                            </div>
                            {acc.isDefault && <span className={s.defaultBadge}>Mặc định</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Sub-section: Withdrawal Request Form ────────────────────────────────────
function WithdrawalForm({ bankAccounts, availableBalance, onRequested }) {
    const [form, setForm] = useState({ bankAccountId: '', amount: '' });
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState('');

    const amount = Number(form.amount) || 0;
    const netAmount = amount > WITHDRAWAL_FEE ? amount - WITHDRAWAL_FEE : 0;
    const canSubmit = amount > WITHDRAWAL_FEE && form.bankAccountId && amount <= availableBalance;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        setMsg('');
        try {
            await withdrawalApi.requestWithdrawal({
                bankAccountId: Number(form.bankAccountId),
                amount: amount
            });
            setMsg('✅ Yêu cầu rút tiền đã được gửi! Admin sẽ xét duyệt trong 1-2 ngày làm việc.');
            setForm({ bankAccountId: '', amount: '' });
            onRequested();
        } catch (err) {
            setMsg('❌ ' + (err?.response?.data?.message || err?.message || 'Gửi yêu cầu thất bại'));
        } finally {
            setSubmitting(false);
        }
    };

    if (bankAccounts.length === 0) {
        return (
            <div className={s.emptyNotice}>
                Vui lòng thêm ít nhất một tài khoản ngân hàng trước khi rút tiền.
            </div>
        );
    }

    return (
        <form className={s.withdrawForm} onSubmit={handleSubmit}>
            <div className={s.formRow}>
                <div className={s.formGroup}>
                    <label className={s.label}>Tài khoản nhận tiền</label>
                    <select
                        className={s.select}
                        name='bankAccountId'
                        value={form.bankAccountId}
                        onChange={handleChange}
                    >
                        <option value=''>-- Chọn tài khoản --</option>
                        {bankAccounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                                {acc.bankName} — {acc.accountNumber} ({acc.accountHolderName})
                                {acc.isDefault ? ' ★' : ''}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={s.formGroup}>
                    <label className={s.label}>Số tiền muốn rút (VNĐ)</label>
                    <input
                        className={s.input}
                        name='amount'
                        type='number'
                        min={WITHDRAWAL_FEE + 1}
                        max={availableBalance}
                        step='1000'
                        placeholder='Tối thiểu > 3.300đ phí'
                        value={form.amount}
                        onChange={handleChange}
                    />
                </div>
            </div>

            {/* Fee preview */}
            {amount > 0 && (
                <div className={s.feePreview}>
                    <div className={s.feeRow}>
                        <span>Số tiền rút</span>
                        <span>{formatVnd(amount)}</span>
                    </div>
                    <div className={s.feeRow}>
                        <span>Phí chuyển khoản</span>
                        <span className={s.feeAmt}>- {formatVnd(WITHDRAWAL_FEE)}</span>
                    </div>
                    <div className={`${s.feeRow} ${s.feeTotal}`}>
                        <span>Thực nhận</span>
                        <span className={netAmount > 0 ? s.netPositive : s.netZero}>
                            {formatVnd(netAmount)}
                        </span>
                    </div>
                </div>
            )}

            {amount > availableBalance && availableBalance > 0 && (
                <div className={s.warnMsg}>
                    Số tiền vượt quá số dư khả dụng ({formatVnd(availableBalance)})
                </div>
            )}

            {msg && <div className={s.formMsg}>{msg}</div>}

            <button
                type='submit'
                className={s.btnPrimary}
                disabled={!canSubmit || submitting}
            >
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu rút tiền'}
            </button>
        </form>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WalletWithdrawalPanel() {
    const [wallet, setWallet]           = useState(null);
    const [history, setHistory]         = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [loadingBanks, setLoadingBanks] = useState(true);
    const [error, setError]             = useState('');
    const [subTab, setSubTab]           = useState('withdraw'); // 'withdraw' | 'history' | 'banks'

    const loadAll = async () => {
        setLoading(true);
        setError('');
        try {
            const [walletData, historyData] = await Promise.all([
                withdrawalApi.getBalance(),
                withdrawalApi.getHistory()
            ]);
            setWallet(walletData);
            setHistory(Array.isArray(historyData) ? historyData : []);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Không tải được dữ liệu ví');
        } finally {
            setLoading(false);
        }
    };

    const loadBanks = async () => {
        setLoadingBanks(true);
        try {
            const data = await withdrawalApi.getBankAccounts();
            setBankAccounts(Array.isArray(data) ? data : []);
        } catch {
            setBankAccounts([]);
        } finally {
            setLoadingBanks(false);
        }
    };

    useEffect(() => {
        loadAll();
        loadBanks();
    }, []);

    const available = wallet?.availableBalance ?? 0;
    const frozen    = wallet?.frozenBalance    ?? 0;

    return (
        <div className={s.container}>
            {/* Wallet summary cards */}
            <div className={s.walletGrid}>
                <article className={s.walletCard}>
                    <div className={s.walletLabel}>Số dư khả dụng</div>
                    <div className={`${s.walletValue} ${s.green}`}>
                        {loading ? '...' : formatVnd(available)}
                    </div>
                    <div className={s.walletCaption}>Có thể rút ngay</div>
                </article>
                <article className={s.walletCard}>
                    <div className={s.walletLabel}>Đang xử lý</div>
                    <div className={`${s.walletValue} ${s.blue}`}>
                        {loading ? '...' : formatVnd(frozen)}
                    </div>
                    <div className={s.walletCaption}>Đang trong quá trình rút</div>
                </article>
                <article className={s.walletCard}>
                    <div className={s.walletLabel}>Tổng số dư</div>
                    <div className={s.walletValue}>
                        {loading ? '...' : formatVnd(available + frozen)}
                    </div>
                    <div className={s.walletCaption}>Khả dụng + Đang xử lý</div>
                </article>
            </div>

            {error && <div className={s.errorMsg}>{error}</div>}

            {/* Sub tabs */}
            <div className={s.subTabBar}>
                {[
                    { id: 'withdraw', label: '💸 Rút tiền' },
                    { id: 'history',  label: '📋 Lịch sử' },
                    { id: 'banks',    label: '🏦 Tài khoản NH' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type='button'
                        className={`${s.subTab} ${subTab === tab.id ? s.subTabActive : ''}`}
                        onClick={() => setSubTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
                <button
                    type='button'
                    className={s.refreshBtn}
                    onClick={() => { loadAll(); loadBanks(); }}
                >
                    ↻ Làm mới
                </button>
            </div>

            {/* Withdraw tab */}
            {subTab === 'withdraw' && (
                <div className={s.section}>
                    <h4 className={s.sectionTitle}>Yêu cầu rút tiền</h4>
                    <p className={s.sectionDesc}>
                        Phí chuyển khoản cố định <strong>{formatVnd(WITHDRAWAL_FEE)}</strong> mỗi lần rút.
                        Thời gian xử lý 1–2 ngày làm việc.
                    </p>
                    <WithdrawalForm
                        bankAccounts={bankAccounts}
                        availableBalance={available}
                        onRequested={loadAll}
                    />
                </div>
            )}

            {/* History tab */}
            {subTab === 'history' && (
                <div className={s.section}>
                    <h4 className={s.sectionTitle}>Lịch sử rút tiền</h4>
                    {loading ? (
                        <div className={s.empty}>Đang tải...</div>
                    ) : history.length === 0 ? (
                        <div className={s.empty}>Chưa có yêu cầu rút tiền nào.</div>
                    ) : (
                        <div className={s.tableWrap}>
                            <table className={s.table}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Số tiền rút</th>
                                        <th>Phí</th>
                                        <th>Thực nhận</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày tạo</th>
                                        <th>Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.id}</td>
                                            <td>{formatVnd(item.amount)}</td>
                                            <td className={s.feeCell}>{formatVnd(item.fee ?? WITHDRAWAL_FEE)}</td>
                                            <td>{formatVnd(item.netAmount)}</td>
                                            <td>
                                                <span className={`${s.badge} ${statusClass(item.status)}`}>
                                                    {statusLabel(item.status)}
                                                </span>
                                            </td>
                                            <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                                            <td className={s.noteCell}>{item.adminNote || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Bank accounts tab */}
            {subTab === 'banks' && (
                <BankAccountsSection
                    bankAccounts={bankAccounts}
                    loadingBanks={loadingBanks}
                    onAdded={loadBanks}
                />
            )}
        </div>
    );
}
