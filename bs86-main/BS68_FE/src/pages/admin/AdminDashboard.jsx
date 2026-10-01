import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { extractList, unwrapData } from './admin.utils';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard({ initialSection = 'overview', onRefreshStats }) {
    const [dashboard, setDashboard] = useState(null);
    const [reports, setReports] = useState([]);
    const [topFields, setTopFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeSection, setActiveSection] = useState(initialSection);

    useEffect(() => {
        setActiveSection(initialSection);
    }, [initialSection]);

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            const [dashboardResponse, reportsResponse, topFieldsResponse] = await Promise.all([
                adminApi.getDashboard(),
                adminApi.getPendingReports(),
                adminApi.getTopReportedFields()
            ]);

            setDashboard(unwrapData(dashboardResponse) || {});
            setReports(extractList(reportsResponse));
            setTopFields(extractList(topFieldsResponse));
            onRefreshStats?.();
        } catch (requestError) {
            setError(
                requestError?.response?.data?.message ||
                    requestError?.message ||
                    'Không thể tải dashboard admin.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resolveReport = async (reportId) => {
        const confirmed = window.confirm('Đánh dấu report này là đã xử lý?');

        if (!confirmed) return;

        try {
            await adminApi.resolveReport(reportId);
            setReports((current) => current.filter((report) => report.reportId !== reportId));
            onRefreshStats?.();
        } catch (requestError) {
            window.alert(
                requestError?.response?.data?.message ||
                    requestError?.message ||
                    'Xử lý report thất bại.'
            );
        }
    };

    const summaryCards = [
        { label: 'Total Users', value: dashboard?.totalUsers ?? 0 },
        { label: 'Owners', value: dashboard?.totalOwners ?? 0 },
        { label: 'Fields', value: dashboard?.totalFields ?? 0 },
        { label: 'Reports Pending', value: dashboard?.pendingReports ?? reports.length }
    ];

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div>
                    <div className={styles.eyebrow}>Dashboard</div>
                    <h2 className={styles.title}>Tổng quan quản trị</h2>
                    <p className={styles.description}>
                        Theo dõi nhanh người dùng, số lượng sân, report chờ xử lý và các sân bị
                        báo cáo nhiều nhất.
                    </p>
                </div>

                <button
                    type='button'
                    className={styles.refreshButton}
                    onClick={loadData}
                    disabled={loading}
                >
                    {loading ? 'Đang tải...' : 'Làm mới dashboard'}
                </button>
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            <div className={styles.summaryGrid}>
                {summaryCards.map((card) => (
                    <article className={styles.summaryCard} key={card.label}>
                        <div className={styles.summaryLabel}>{card.label}</div>
                        <div className={styles.summaryValue}>{card.value}</div>
                    </article>
                ))}
            </div>

            <div className={styles.tabRow}>
                <button
                    type='button'
                    className={`${styles.tabButton} ${
                        activeSection === 'overview' ? styles.tabButtonActive : ''
                    }`}
                    onClick={() => setActiveSection('overview')}
                >
                    Overview
                </button>
                <button
                    type='button'
                    className={`${styles.tabButton} ${
                        activeSection === 'reports' ? styles.tabButtonActive : ''
                    }`}
                    onClick={() => setActiveSection('reports')}
                >
                    Pending Reports
                </button>
                <button
                    type='button'
                    className={`${styles.tabButton} ${
                        activeSection === 'top-fields' ? styles.tabButtonActive : ''
                    }`}
                    onClick={() => setActiveSection('top-fields')}
                >
                    Top Reported Fields
                </button>
            </div>

            {activeSection === 'overview' ? (
                <div className={styles.overviewCard}>
                    <div className={styles.overviewMetric}>
                        <span>Total Bookings</span>
                        <strong>{dashboard?.totalBookings ?? 0}</strong>
                    </div>
                    <div className={styles.overviewMetric}>
                        <span>Pending Owners</span>
                        <strong>{dashboard?.pendingOwners ?? 0}</strong>
                    </div>
                    <div className={styles.overviewMetric}>
                        <span>Pending Fields</span>
                        <strong>{dashboard?.pendingFields ?? 0}</strong>
                    </div>
                    <div className={styles.overviewMetric}>
                        <span>Total Revenue</span>
                        <strong>{dashboard?.totalRevenue ?? 0}</strong>
                    </div>
                </div>
            ) : null}

            {activeSection === 'reports' ? (
                reports.length === 0 ? (
                    <div className={styles.empty}>Không có report đang chờ xử lý.</div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Field</th>
                                    <th>Reason</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((report) => (
                                    <tr key={report.reportId}>
                                        <td>#{report.reportId}</td>
                                        <td>{report.fieldName || 'Chưa cập nhật'}</td>
                                        <td>{report.reason || 'Không có lý do'}</td>
                                        <td>
                                            <button
                                                type='button'
                                                className={styles.resolveButton}
                                                onClick={() => resolveReport(report.reportId)}
                                            >
                                                Resolve
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : null}

            {activeSection === 'top-fields' ? (
                topFields.length === 0 ? (
                    <div className={styles.empty}>Chưa có dữ liệu top reported fields.</div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Field</th>
                                    <th>Số lần bị report</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topFields.map((field, index) => (
                                    <tr key={`${field.fieldName}-${index}`}>
                                        <td>{field.fieldName || 'Chưa cập nhật'}</td>
                                        <td>{field.totalReports ?? 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : null}
        </div>
    );
}
