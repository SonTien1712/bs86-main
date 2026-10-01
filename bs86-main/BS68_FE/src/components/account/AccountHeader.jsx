export default function AccountHeader({ styles, auth, onLogout }) {
    const isOwnerDisplay = auth.rawIsOwner ?? false;
    const roleLabel = auth.isAdmin
        ? 'Quản trị viên'
        : isOwnerDisplay
        ? 'Chủ sân'
        : 'Người dùng';
    const subLabel = auth.isAdmin
        ? 'Trung tâm quản trị'
        : isOwnerDisplay
        ? 'Không gian quản lý chủ sân'
        : 'Trang tài khoản cá nhân';

    return (
        <div className={styles.header}>
            <div className={styles.profileRow}>
                <div
                    className={`${styles.avatarBig} ${
                        auth.isAdmin
                            ? styles.adminAva
                            : isOwnerDisplay
                            ? styles.ownerAva
                            : styles.customerAva
                    }`}
                >
                    {auth.isAdmin ? 'AD' : isOwnerDisplay ? 'OW' : 'US'}
                </div>

                <div className={styles.profileInfo}>
                    <div className={styles.profileEmail}>{auth.email}</div>
                    <div className={styles.profileHint}>{subLabel}</div>
                    <span
                        className={`${styles.roleBadge} ${
                            auth.isAdmin
                                ? styles.adminBadge
                                : isOwnerDisplay
                                ? styles.ownerBadge
                                : styles.customerBadge
                        }`}
                    >
                        {roleLabel}
                    </span>
                </div>

                <div className={styles.topActions}>
                    <button className={styles.logoutBtn} onClick={onLogout} type='button'>
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    );
}
