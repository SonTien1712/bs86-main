import styles from '../../../pages/public/account/OwnerManagementPanels.module.scss';

export default function FormShell({
    title,
    desc,
    onSubmit,
    loading,
    msgType,
    msgText,
    submitDisabled,
    children
}) {
    return (
        <form className={styles.form} onSubmit={onSubmit}>
            <h4>{title}</h4>
            {desc ? <p className={styles.desc}>{desc}</p> : null}
            <div className={styles.fieldsGrid}>{children}</div>
            {msgText ? (
                <div className={`${styles.msg} ${styles[msgType]}`}>{msgText}</div>
            ) : null}
            <button
                type='submit'
                className={styles.submitBtn}
                disabled={loading || submitDisabled}
            >
                {loading ? 'Đang xử lý...' : 'Thực hiện'}
            </button>
        </form>
    );
}
