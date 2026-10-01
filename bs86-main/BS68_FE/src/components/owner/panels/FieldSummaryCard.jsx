import styles from '../../../pages/public/account/OwnerManagementPanels.module.scss';

export default function FieldSummaryCard({ field, emptyText, notice }) {
    return (
        <div className={styles.infoCard}>
            {field ? (
                <>
                    <div className={styles.infoTitle}>{field.name}</div>
                    <div className={styles.infoText}>{field.address}</div>
                    <div className={styles.infoMeta}>
                        <span>Field ID: {field.id}</span>
                        <span>{field.slug || 'Chưa có slug'}</span>
                        <span>{field.openingHours || 'Chưa có giờ mở cửa'}</span>
                    </div>
                </>
            ) : (
                <div className={styles.infoText}>{emptyText}</div>
            )}
            {notice ? <div className={styles.infoNotice}>{notice}</div> : null}
        </div>
    );
}
