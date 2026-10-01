import { useEffect, useState } from 'react';
import { createPassPost } from '../../api/passApi';
import {
    formatPassDate,
    formatPassMoney,
    formatPassTime,
    getApiErrorMessage
} from '../../pages/customer/pass/passUi';
import styles from './PassModal.module.css';

export default function PassTicketModal({ open, onClose, ticket, onCreated }) {
    const [content, setContent] = useState('');
    const [askingPrice, setAskingPrice] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!open) {
            setContent('');
            setAskingPrice('');
            setSubmitting(false);
            setError('');
            setSuccess('');
        }
    }, [open, ticket?.ticketId]);

    if (!open || !ticket) {
        return null;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        const trimmedContent = content.trim();
        const normalizedPrice = askingPrice === '' ? null : Number(askingPrice);

        if (trimmedContent.length === 0) {
            setError('Vui lòng nhập nội dung ngắn cho bài đăng pass vé.');
            return;
        }

        if (normalizedPrice !== null && (!Number.isFinite(normalizedPrice) || normalizedPrice < 0)) {
            setError('Giá mong muốn phải lớn hơn hoặc bằng 0.');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const result = await createPassPost({
                ticketId: ticket.ticketId,
                content: trimmedContent,
                askingPrice: normalizedPrice
            });
            setSuccess('Tạo bài đăng pass vé thành công.');
            if (typeof onCreated === 'function') {
                onCreated(result);
            }
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, 'Không tạo được bài đăng pass vé.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} role='dialog' aria-modal='true'>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div>
                        <div className={styles.kicker}>Pass vé</div>
                        <h2 className={styles.title}>Tạo bài đăng pass vé</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} type='button'>
                        Đóng
                    </button>
                </div>

                <div className={styles.summaryCard}>
                    <div className={styles.summaryTitle}>{ticket.fieldName || 'Chưa có tên sân'}</div>
                    <div className={styles.summarySub}>
                        {ticket.courtName || 'Chưa gán sân con'} • {formatPassDate(ticket.slotDate)} •{' '}
                        {formatPassTime(ticket.startTime)} - {formatPassTime(ticket.endTime)}
                    </div>
                    <div className={styles.summaryMeta}>
                        Mã vé: <strong>{ticket.ticketCode || '--'}</strong>
                    </div>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.field}>
                        <span>Nội dung bài đăng</span>
                        <textarea
                            maxLength={2000}
                            onChange={(event) => setContent(event.target.value)}
                            placeholder='Nhập lý do hoặc mô tả ngắn để người khác dễ quyết định.'
                            rows={5}
                            value={content}
                        />
                    </label>

                    <label className={styles.field}>
                        <span>Giá mong muốn (VND)</span>
                        <input
                            inputMode='numeric'
                            min='0'
                            onChange={(event) => setAskingPrice(event.target.value)}
                            placeholder='100000'
                            type='number'
                            value={askingPrice}
                        />
                        <small>
                            Xem trước:{' '}
                            {askingPrice === ''
                                ? 'Không bắt buộc'
                                : formatPassMoney(Number(askingPrice) || 0)}
                        </small>
                    </label>

                    {error ? <div className={styles.error}>{error}</div> : null}
                    {success ? <div className={styles.success}>{success}</div> : null}

                    <div className={styles.actions}>
                        <button className={styles.secondaryBtn} onClick={onClose} type='button'>
                            Hủy
                        </button>
                        <button className={styles.primaryBtn} disabled={submitting} type='submit'>
                            {submitting ? 'Đang đăng...' : 'Tạo bài đăng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
