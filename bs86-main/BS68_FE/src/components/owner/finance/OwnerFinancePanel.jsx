import { useEffect, useState } from 'react';
import { ownerApi } from '../../../api/ownerApi';
import { getApiErrorMessage } from '../../../utils/apiError';
import styles from './OwnerFinancePanel.module.scss';

const INIT_ACCOUNT = {
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: ''
};

const INIT_PAYOUT = {
    amount: '',
    note: ''
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

function normalizeText(value) {
    return String(value || '').trim();
}

export default function OwnerFinancePanel() {
    const [summary, setSummary] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingAccount, setSavingAccount] = useState(false);
    const [submittingPayout, setSubmittingPayout] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [accountForm, setAccountForm] = useState(INIT_ACCOUNT);
    const [payoutForm, setPayoutForm] = useState(INIT_PAYOUT);

    const hydrateAccountForm = (data) => {
        setAccountForm({
            bankName: data?.bankName || '',
            bankAccountNumber: data?.bankAccountNumber || '',
            bankAccountHolder: data?.bankAccountHolder || ''
        });
    };

    const loadFinance = async () => {
        setLoading(true);
        setError('');

        try {
            const [summaryData, requestData] = await Promise.all([
                ownerApi.getFinanceSummary(),
                ownerApi.getPayoutRequests({ size: 10 })
            ]);

            setSummary(summaryData);
            hydrateAccountForm(summaryData);
            setRequests(Array.isArray(requestData?.content) ? requestData.content : []);
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, 'Không tải được dữ liệu tài chính.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFinance();

        const syncLatest = () => {
            if (document.visibilityState === 'visible') {
                loadFinance();
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
    }, []);

    const validateAccountForm = () => {
        if (!normalizeText(accountForm.bankName)) {
            return 'Vui lòng nhập tên ngân hàng.';
        }
        if (!normalizeText(accountForm.bankAccountNumber)) {
            return 'Vui lòng nhập số tài khoản.';
        }
        if (!normalizeText(accountForm.bankAccountHolder)) {
            return 'Vui lòng nhập tên chủ tài khoản.';
        }
        return '';
    };

    const validatePayoutForm = () => {
        const accountError = validateAccountForm();
        if (accountError) {
            return accountError;
        }

        const amount = Number(payoutForm.amount || 0);
        const minimumAmount = Number(summary?.minimumPayoutAmount || 0);
        const availableAmount = Number(summary?.availablePayoutBalance ?? summary?.pendingPayoutBalance ?? 0);

        if (!Number.isFinite(amount) || amount <= 0) {
            return 'Số tiền rút phải lớn hơn 0.';
        }
        if (minimumAmount > 0 && amount < minimumAmount) {
            return `Số tiền rút phải từ ${formatCurrency(minimumAmount)} trở lên.`;
        }
        if (amount > availableAmount) {
            return 'Số tiền rút vượt quá số dư khả dụng.';
        }
        return '';
    };

    const handleSaveAccount = async (event) => {
        event.preventDefault();
        const validationMessage = validateAccountForm();
        if (validationMessage) {
            setError(validationMessage);
            setSuccess('');
            return;
        }

        setSavingAccount(true);
        setError('');
        setSuccess('');

        try {
            await ownerApi.updatePayoutAccount({
                bankName: normalizeText(accountForm.bankName),
                bankAccountNumber: normalizeText(accountForm.bankAccountNumber),
                bankAccountHolder: normalizeText(accountForm.bankAccountHolder)
            });
            setSuccess('Đã cập nhật tài khoản nhận tiền.');
            await loadFinance();
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, 'Không thể cập nhật tài khoản nhận tiền.'));
        } finally {
            setSavingAccount(false);
        }
    };

    const handleCreatePayout = async (event) => {
        event.preventDefault();
        const validationMessage = validatePayoutForm();
        if (validationMessage) {
            setError(validationMessage);
            setSuccess('');
            return;
        }

        setSubmittingPayout(true);
        setError('');
        setSuccess('');

        try {
            await ownerApi.createPayoutRequest({
                amount: payoutForm.amount ? Number(payoutForm.amount) : 0,
                note: normalizeText(payoutForm.note),
                bankName: normalizeText(accountForm.bankName),
                bankAccountNumber: normalizeText(accountForm.bankAccountNumber),
                bankAccountHolder: normalizeText(accountForm.bankAccountHolder)
            });
            setSuccess('Đã gửi yêu cầu rút tiền cho admin.');
            setPayoutForm(INIT_PAYOUT);
            await loadFinance();
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, 'Không thể tạo yêu cầu rút tiền.'));
        } finally {
            setSubmittingPayout(false);
        }
    };

    const availablePayoutBalance = summary?.availablePayoutBalance ?? summary?.pendingPayoutBalance;
    const pendingRequestAmount = summary?.pendingPayoutRequestAmount || 0;
    const totalPayableBalance = summary?.totalPayableBalance ?? availablePayoutBalance;
    const payoutDisabled = submittingPayout || loading || Number(availablePayoutBalance || 0) <= 0;

    const cards = [
        {
            label: 'Số dư khả dụng',
            value: formatCurrency(availablePayoutBalance),
            caption: 'Số tiền còn có thể tạo thêm lệnh rút ngay lúc này'
        },
        {
            label: 'Đang chờ duyệt',
            value: formatCurrency(pendingRequestAmount),
            caption: 'Số tiền đã gửi admin và đang được giữ cho xử lý'
        },
        {
            label: 'Số dư chưa đối soát',
            value: formatCurrency(totalPayableBalance),
            caption: 'Tổng số dư merchant chưa được chuyển khoản xong'
        },
        {
            label: 'Tổng doanh thu chủ sân',
            value: formatCurrency(summary?.totalRevenue),
            caption: `Đã chuyển khoản ${formatCurrency(summary?.settledAmount)}`
        }
    ];

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <div>
                    <div className={styles.eyebrow}>Finance</div>
                    <h3>Ví tiền và yêu cầu rút tiền</h3>
                    <p>
                        Theo dõi số dư đang chờ admin chuyển khoản, cập nhật tài khoản nhận tiền
                        và gửi lệnh rút tiền ngay trong dashboard chủ sân.
                    </p>
                </div>

                <button type='button' className={styles.refreshButton} onClick={loadFinance}>
                    Làm mới
                </button>
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}
            {success ? <div className={styles.success}>{success}</div> : null}

            <div className={styles.metricGrid}>
                {cards.map((card) => (
                    <article key={card.label} className={styles.metricCard}>
                        <div className={styles.metricLabel}>{card.label}</div>
                        <strong>{loading ? '...' : card.value}</strong>
                        <p>{card.caption}</p>
                    </article>
                ))}
            </div>

            <div className={styles.dualGrid}>
                <section className={styles.sectionCard}>
                    <div className={styles.sectionTitle}>Tài khoản nhận tiền</div>
                    <div className={styles.sectionHint}>
                        Bắt buộc cập nhật trước khi gửi yêu cầu rút. Mức tối thiểu:{' '}
                        <strong>{formatCurrency(summary?.minimumPayoutAmount)}</strong>. Tỷ lệ nhận hiện tại:{' '}
                        <strong>{formatPercent(summary?.ownerShareRate)}</strong>
                    </div>

                    <form className={styles.form} onSubmit={handleSaveAccount}>
                        <label>
                            <span>Tên ngân hàng</span>
                            <input
                                value={accountForm.bankName}
                                onChange={(event) =>
                                    setAccountForm((current) => ({
                                        ...current,
                                        bankName: event.target.value
                                    }))
                                }
                                placeholder='VD: Vietcombank'
                            />
                        </label>

                        <label>
                            <span>Số tài khoản</span>
                            <input
                                value={accountForm.bankAccountNumber}
                                onChange={(event) =>
                                    setAccountForm((current) => ({
                                        ...current,
                                        bankAccountNumber: event.target.value
                                    }))
                                }
                                placeholder='Nhập số tài khoản'
                            />
                        </label>

                        <label>
                            <span>Chủ tài khoản</span>
                            <input
                                value={accountForm.bankAccountHolder}
                                onChange={(event) =>
                                    setAccountForm((current) => ({
                                        ...current,
                                        bankAccountHolder: event.target.value
                                    }))
                                }
                                placeholder='Nhập tên chủ tài khoản'
                            />
                        </label>

                        <button type='submit' className={styles.primaryButton} disabled={savingAccount}>
                            {savingAccount ? 'Đang lưu...' : 'Lưu tài khoản'}
                        </button>
                    </form>
                </section>

                <section className={styles.sectionCard}>
                    <div className={styles.sectionTitle}>Gửi yêu cầu rút tiền</div>
                    <div className={styles.sectionHint}>
                        Admin sẽ duyệt và chuyển khoản theo thông tin tài khoản đang hiển thị trên màn hình này.
                    </div>
                    <div className={styles.inlineFacts}>
                        <span>Khả dụng: {formatCurrency(availablePayoutBalance)}</span>
                        <span>Đang chờ duyệt: {formatCurrency(pendingRequestAmount)}</span>
                    </div>

                    <form className={styles.form} onSubmit={handleCreatePayout}>
                        <label>
                            <span>Số tiền muốn rút</span>
                            <input
                                type='number'
                                min='0'
                                value={payoutForm.amount}
                                onChange={(event) =>
                                    setPayoutForm((current) => ({
                                        ...current,
                                        amount: event.target.value
                                    }))
                                }
                                placeholder='Nhập số tiền VND'
                            />
                        </label>

                        <label>
                            <span>Ghi chú</span>
                            <textarea
                                rows='4'
                                value={payoutForm.note}
                                onChange={(event) =>
                                    setPayoutForm((current) => ({
                                        ...current,
                                        note: event.target.value
                                    }))
                                }
                                placeholder='Nội dung để admin dễ đối'
                            />
                        </label>

                        <button
                            type='submit'
                            className={styles.primaryButton}
                            disabled={payoutDisabled}
                        >
                            {submittingPayout ? 'Đang gửi...' : 'Gửi yêu cầu'}
                        </button>
                    </form>
                </section>
            </div>

            <section className={styles.sectionCard}>
                <div className={styles.sectionTitle}>Lịch sử rút tiền</div>
                <div className={styles.sectionHint}>
                    Hiển thị các yêu cầu gần đây để chủ sân đối soát với admin.
                </div>

                {requests.length === 0 ? (
                    <div className={styles.empty}>Chưa có yêu cầu rút tiền nào.</div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Thời gian</th>
                                    <th>Số tiền</th>
                                    <th>Tài khoản nhận</th>
                                    <th>Trạng thái</th>
                                    <th>Ghi chú</th>
                                    <th>Phản hồi admin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '-'}</td>
                                        <td>{formatCurrency(item.amount)}</td>
                                        <td>
                                            <div>{item.bankName || '-'}</div>
                                            <div>{item.bankAccountNumber || '-'}</div>
                                            <div>{item.bankAccountHolder || '-'}</div>
                                        </td>
                                        <td>
                                            <span className={`${styles.status} ${getStatusClass(item.status)}`}>
                                                {item.status || 'PENDING'}
                                            </span>
                                        </td>
                                        <td>{item.ownerNote || '-'}</td>
                                        <td>{item.adminNote || item.payoutReference || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

