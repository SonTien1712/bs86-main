export default function PostComposerModal({
    styles,
    show,
    fields = [],
    form,
    errMsg,
    successMsg,
    submitting,
    title = 'Thông Báo Sân Trống',
    submitLabel = 'Đăng ngay',
    submittingLabel = 'Đang đăng...',
    onClose,
    onSubmit,
    onChange
}) {
    if (!show) return null;

    return (
        <div
            className={styles.overlay}
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <div className={styles.modal}>
                <div className={styles.modalTitle}>{title}</div>

                <div className={styles.formGroup}>
                    <label>Sân của bạn *</label>
                    <select
                        value={form.fieldId}
                        onChange={(e) => onChange?.({ ...form, fieldId: e.target.value })}
                    >
                        <option value=''>Chọn sân để đăng bài</option>
                        {fields.map((field) => (
                            <option key={field.id} value={field.id}>
                                {field.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Nội dung thông báo *</label>
                    <textarea
                        rows={5}
                        placeholder={`Ví dụ:\nSân trống tối nay!\nS?n A: 18:00 - 20:00\nS?n B: 20:00 - 22:00`}
                        value={form.content}
                        onChange={(e) => onChange?.({ ...form, content: e.target.value })}
                    />
                </div>

                {errMsg ? <div className={styles.errMsg}>{errMsg}</div> : null}
                {successMsg ? <div className={styles.successMsg}>{successMsg}</div> : null}

                <div className={styles.modalActions}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        H?y
                    </button>
                    <button
                        className={styles.submitBtn}
                        onClick={onSubmit}
                        disabled={submitting}
                    >
                        {submitting ? submittingLabel : submitLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

