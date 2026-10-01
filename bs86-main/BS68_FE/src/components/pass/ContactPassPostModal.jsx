import { useEffect, useState } from 'react';
import { contactPassPost } from '../../api/passApi';
import {
    formatPassDate,
    formatPassMoney,
    formatPassTime,
    getApiErrorMessage
} from '../../pages/customer/pass/passUi';
import styles from './PassModal.module.css';

export default function ContactPassPostModal({ open, onClose, post, onSuccess }) {
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) {
            setMessage('');
            setSubmitting(false);
            setError('');
        }
    }, [open, post?.id]);

    if (!open || !post) {
        return null;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const result = await contactPassPost(post.id, {
                initialMessage: message.trim() || undefined
            });
            if (typeof onSuccess === 'function') {
                onSuccess(result);
            }
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, 'Unable to contact this ticket owner.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} role='dialog' aria-modal='true'>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div>
                        <div className={styles.kicker}>Contact Owner</div>
                        <h2 className={styles.title}>Start a private conversation</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} type='button'>
                        Close
                    </button>
                </div>

                <div className={styles.summaryCard}>
                    <div className={styles.summaryTitle}>{post.fieldName || 'Unknown field'}</div>
                    <div className={styles.summarySub}>
                        {post.courtName || 'Court not assigned'} • {formatPassDate(post.slotDate)} •{' '}
                        {formatPassTime(post.startTime)} - {formatPassTime(post.endTime)}
                    </div>
                    <div className={styles.summaryMeta}>
                        Asking price: <strong>{formatPassMoney(post.askingPrice)}</strong>
                    </div>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.field}>
                        <span>Initial message</span>
                        <textarea
                            maxLength={2000}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder='Hi, I am interested in this ticket.'
                            rows={5}
                            value={message}
                        />
                    </label>

                    {error ? <div className={styles.error}>{error}</div> : null}

                    <div className={styles.actions}>
                        <button className={styles.secondaryBtn} onClick={onClose} type='button'>
                            Cancel
                        </button>
                        <button className={styles.primaryBtn} disabled={submitting} type='submit'>
                            {submitting ? 'Opening...' : 'Contact'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
