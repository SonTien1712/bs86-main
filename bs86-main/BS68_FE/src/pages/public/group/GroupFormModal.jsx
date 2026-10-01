import { useEffect, useState } from 'react';
import styles from './GroupFormModal.module.scss';

const EMPTY_FORM = {
    name: '',
    description: ''
};

export default function GroupFormModal({
    open,
    title,
    submitLabel,
    initialValue = EMPTY_FORM,
    submitting = false,
    errorMessage = '',
    onClose,
    onSubmit
}) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (!open) return;

        setForm({
            name: initialValue?.name ?? '',
            description: initialValue?.description ?? ''
        });
        setLocalError('');
    }, [initialValue, open]);

    if (!open) return null;

    function handleSubmit(event) {
        event.preventDefault();

        if (!form.name.trim()) {
            setLocalError('Tên nhóm không được để trống.');
            return;
        }

        setLocalError('');
        onSubmit?.({
            name: form.name.trim(),
            description: form.description.trim()
        });
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div>
                        <div className={styles.eyebrow}>Group</div>
                        <h2>{title}</h2>
                    </div>

                    <button className={styles.closeButton} onClick={onClose} type='button'>
                        x
                    </button>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.field}>
                        <span>Tên nhóm</span>
                        <input
                            value={form.name}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    name: event.target.value
                                }))
                            }
                            placeholder='Ví dụ: Nhóm đá bóng tối'
                        />
                    </label>

                    <label className={styles.field}>
                        <span>Mô tả</span>
                        <textarea
                            rows={4}
                            value={form.description}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    description: event.target.value
                                }))
                            }
                            placeholder='Viết ngắn gọn mục đích hoặc lịch sinh hoạt của nhóm'
                        />
                    </label>

                    {localError ? <div className={styles.error}>{localError}</div> : null}
                    {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}

                    <div className={styles.actions}>
                        <button className={styles.secondaryButton} onClick={onClose} type='button'>
                            Hủy
                        </button>
                        <button className={styles.primaryButton} disabled={submitting} type='submit'>
                            {submitting ? 'Đang lưu...' : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

