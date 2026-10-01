import { useEffect, useState } from 'react';
import styles from './AdminReportField.module.css';
import { adminApi } from '../../api/adminApi';

export default function AdminReportField({
    onPendingCountChange,
    onRefreshStats
}) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadReports = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getPendingReports();
            const data = res?.data?.data || res?.data || [];

            setReports(data);

            onPendingCountChange?.(data.length);
        } catch (err) {
            console.error('Load reports failed', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const handleResolve = async (id, status) => {
        try {
            await adminApi.resolveReport(id, status);

            await loadReports(); // refresh lại DB thật
            onRefreshStats?.();
        } catch (err) {
            console.error('Resolve failed', err);
        }
    };

    if (loading) return <p>Đang tải reports...</p>;

    return (
        <div className={styles.container}>
            <h2>Reports Pending</h2>

            {reports.length === 0 ? (
                <p>Không có report nào</p>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Field</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {reports.map((r) => (
                            <tr key={r.reportId}>
                                <td>{r.reportId}</td>
                                <td>{r.fieldName}</td>
                                <td>{r.reason}</td>
                                <td>{r.status}</td>

                                <td>
                                    <button
                                        className={styles.approveBtn}
                                        onClick={() =>
                                            handleResolve(
                                                r.reportId,
                                                'APPROVED'
                                            )
                                        }
                                    >
                                        ✔ Approve
                                    </button>

                                    <button
                                        className={styles.rejectBtn}
                                        onClick={() =>
                                            handleResolve(
                                                r.reportId,
                                                'REJECTED'
                                            )
                                        }
                                    >
                                        ✖ Reject
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
