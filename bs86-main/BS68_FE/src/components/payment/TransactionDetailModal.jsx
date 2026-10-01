import { useEffect, useMemo, useState } from 'react';
import { getTransactionDetail } from '../../api/paymentApi';
import { formatAmount, formatDateTime, getErrorMessage } from '../../pages/public/payment/paymentResultUtils';
import styles from './TransactionDetailModal.module.css';

function normalizeDetail(detail) {
    if (!detail || typeof detail !== 'object') {
        return {};
    }

    return detail;
}

function formatFieldValue(value) {
    if (value == null || value === '') {
        return '--';
    }

    if (Array.isArray(value) || typeof value === 'object') {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    }

    return String(value);
}

function renderValue(key, value) {
    if (value == null || value === '') {
        return <span className={styles.placeholder}>--</span>;
    }

    if (typeof value === 'number' && /amount|price|fee|total|paid/i.test(key)) {
        return <strong>{formatAmount(value)}</strong>;
    }

    if (/date|time|at$/i.test(key) && typeof value === 'string') {
        return <strong>{formatDateTime(value)}</strong>;
    }

    if (Array.isArray(value) || typeof value === 'object') {
        return <pre className={styles.codeBlock}>{formatFieldValue(value)}</pre>;
    }

    return <strong>{String(value)}</strong>;
}

export default function TransactionDetailModal({ open, transactionId, onClose }) {
    const [state, setState] = useState({
        loading: false,
        error: '',
        data: null
    });

    const normalizedTransactionId = useMemo(() => String(transactionId || '').trim(), [transactionId]);

    useEffect(() => {
        let active = true;

        if (!open || !normalizedTransactionId) {
            return undefined;
        }

        async function loadTransaction() {
            setState({ loading: true, error: '', data: null });

            try {
                const detail = await getTransactionDetail(normalizedTransactionId);

                if (!active) {
                    return;
                }

                setState({
                    loading: false,
                    error: '',
                    data: normalizeDetail(detail)
                });
            } catch (error) {
                if (!active) {
                    return;
                }

                setState({
                    loading: false,
                    error: getErrorMessage(error, 'Unable to load transaction detail'),
                    data: null
                });
            }
        }

        loadTransaction();

        return () => {
            active = false;
        };
    }, [normalizedTransactionId, open]);

    if (!open) {
        return null;
    }

    const entries = Object.entries(state.data || {});

    return (
        <div className={styles.overlay} role='presentation' onClick={onClose}>
            <div
                aria-modal='true'
                className={styles.modal}
                role='dialog'
                onClick={(event) => event.stopPropagation()}
            >
                <div className={styles.header}>
                    <div>
                        <div className={styles.kicker}>Transaction detail</div>
                        <h3 className={styles.title}>Transaction {normalizedTransactionId}</h3>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} type='button'>
                        Close
                    </button>
                </div>

                {state.loading ? (
                    <div className={styles.feedback}>Loading transaction detail...</div>
                ) : null}

                {!state.loading && state.error ? (
                    <div className={styles.feedbackError}>{state.error}</div>
                ) : null}

                {!state.loading && !state.error ? (
                    <div className={styles.grid}>
                        {entries.length > 0 ? (
                            entries.map(([key, value]) => (
                                <div className={styles.field} key={key}>
                                    <span className={styles.label}>{key}</span>
                                    {renderValue(key, value)}
                                </div>
                            ))
                        ) : (
                            <div className={styles.feedback}>No transaction data returned by backend.</div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
