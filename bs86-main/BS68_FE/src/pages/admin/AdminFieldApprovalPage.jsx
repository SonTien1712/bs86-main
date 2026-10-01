import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { extractList } from './admin.utils';
import styles from './AdminApprovalPage.module.css';

export default function AdminFieldApprovalPage({
    onPendingCountChange,
    onRefreshStats
}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const syncItems = (nextItems) => {
        setItems(nextItems);
        onPendingCountChange?.(nextItems.length);
    };

    const load = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await adminApi.getPendingFields();
            syncItems(extractList(response));
        } catch (requestError) {
            setError(
                requestError?.response?.data?.message ||
                    requestError?.message ||
                    'Không thể tải danh sách field chờ duyệt.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const approve = async (verificationId, fieldId) => {
        const confirmed = window.confirm('Duyệt cụm sân này?');

        if (!confirmed) return;

        try {
            await adminApi.approveField(fieldId);
            const nextItems = items.filter((item) => item.id !== verificationId);
            syncItems(nextItems);
            onRefreshStats?.();
        } catch (requestError) {
            window.alert(
                requestError?.response?.data?.message ||
                    requestError?.message ||
                    'Duyệt field thất bại.'
            );
        }
    };

    const reject = async (verificationId, fieldId) => {
        const reason = window.prompt('Nhập lý do từ chối field:');

        if (reason === null) return;

        const trimmedReason = reason.trim();

        if (!trimmedReason) {
            window.alert('Vui lòng nhập lý do từ chối.');
            return;
        }

        try {
            await adminApi.rejectField(fieldId, trimmedReason);
            const nextItems = items.filter((item) => item.id !== verificationId);
            syncItems(nextItems);
            onRefreshStats?.();
        } catch (requestError) {
            window.alert(
                requestError?.response?.data?.message ||
                    requestError?.message ||
                    'Từ chối field thất bại.'
            );
        }
    };

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <div>
                    <div className={styles.eyebrow}>Field Approval</div>
                    <h2 className={styles.title}>Duyệt cụm sân mới</h2>
                    <p className={styles.description}>
                        Xác nhận thông tin, giấy tờ và ảnh sân trước khi field được mở cho người
                        dùng đặt lịch.
                    </p>
                </div>

                <div className={styles.toolbar}>
                    <div className={styles.counterChip}>{items.length} field chờ duyệt</div>
                    <button
                        type='button'
                        className={styles.primaryButton}
                        onClick={load}
                        disabled={loading}
                    >
                        {loading ? 'Đang tải...' : 'Tải lại'}
                    </button>
                </div>
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            {!loading && items.length === 0 ? (
                <div className={styles.empty}>Không có field nào đang chờ duyệt.</div>
            ) : null}

            {items.length > 0 ? (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Field ID</th>
                                <th>Tên sân</th>
                                <th>Địa chỉ</th>
                                <th>Giấy phép</th>
                                <th>Ảnh sân</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td className={styles.cellStrong}>{item.fieldId}</td>
                                    <td>{item.fieldName || 'Chưa cập nhật'}</td>
                                    <td className={styles.muted}>
                                        {item.address || 'Chưa có địa chỉ'}
                                    </td>
                                    <td>
                                        {item.landCertificateUrl ? (
                                            <a
                                                className={styles.link}
                                                href={item.landCertificateUrl}
                                                target='_blank'
                                                rel='noreferrer'
                                            >
                                                Xem giấy phép
                                            </a>
                                        ) : (
                                            <span className={styles.muted}>Chưa có file</span>
                                        )}
                                    </td>
                                    <td>
                                        {item.fieldImagesUrl ? (
                                            <a
                                                className={styles.link}
                                                href={item.fieldImagesUrl}
                                                target='_blank'
                                                rel='noreferrer'
                                            >
                                                Xem ảnh sân
                                            </a>
                                        ) : (
                                            <span className={styles.muted}>Chưa có ảnh</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className={styles.actionGroup}>
                                            <button
                                                type='button'
                                                className={styles.approveButton}
                                                onClick={() => approve(item.id, item.fieldId)}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                type='button'
                                                className={styles.rejectButton}
                                                onClick={() => reject(item.id, item.fieldId)}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
}
