import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminHomePage.module.css';
import { adminApi } from '../../api/adminApi';
import AdminDashboard from './AdminDashboard';
import AdminFieldApprovalPage from './AdminFieldApprovalPage';
import AdminOwnerApprovalPage from './AdminOwnerApprovalPage';
import { extractCount } from './admin.utils';
import AdminReportField from './AdminReportField';
import AdminLogPage from './AdminLogPage';
import { clearStoredAuthSession } from '../../utils/auth';
const NAV_ITEMS = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: '▦' },
    { id: 'OWNERS', label: 'Owners', icon: '◉' },
    { id: 'FIELDS', label: 'Fields', icon: '◆' },
    { id: 'REPORTS', label: 'Reports', icon: '!' },
    { id: 'LOGS', label: 'Logs', icon: '📊' }
];

export default function AdminHomePage() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [active, setActive] = useState('FIELDS');
    const [stats, setStats] = useState({
        pendingOwners: 0,
        pendingFields: 0,
        pendingReports: 0
    });
    const [statsLoading, setStatsLoading] = useState(false);

    const updateStat = (key, value) => {
        setStats((current) => ({ ...current, [key]: value }));
    };

    const loadStats = async () => {
        setStatsLoading(true);

        try {
            const [owners, fields, reports] = await Promise.all([
                adminApi.getPendingOwners(),
                adminApi.getPendingFields(),
                adminApi.getPendingReports()
            ]);

            setStats({
                pendingOwners: extractCount(owners),
                pendingFields: extractCount(fields),
                pendingReports: extractCount(reports)
            });
        } catch (error) {
            console.error('Failed to load admin stats', error);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        loadStats();
    }, []);

    const handleLogout = () => {
        clearStoredAuthSession();
        window.location.href = '/login';
    };

    const renderContent = () => {
        switch (active) {
            case 'OWNERS':
                return (
                    <AdminOwnerApprovalPage
                        onPendingCountChange={(count) =>
                            updateStat('pendingOwners', count)
                        }
                        onRefreshStats={loadStats}
                    />
                );
            case 'FIELDS':
                return (
                    <AdminFieldApprovalPage
                        onPendingCountChange={(count) =>
                            updateStat('pendingFields', count)
                        }
                        onRefreshStats={loadStats}
                    />
                );
            case 'DASHBOARD':
                return <AdminDashboard onRefreshStats={loadStats} />;
            case 'REPORTS':
                return (
                    <AdminReportField
                        onPendingCountChange={(count) =>
                            updateStat('pendingReports', count)
                        }
                        onRefreshStats={loadStats}
                    />
                );
            case 'LOGS':
                return <AdminLogPage />;
            default:
                return <AdminDashboard onRefreshStats={loadStats} />;
        }
    };

    return (
        <div className={styles.page}>
            <aside
                className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
            >
                <div className={styles.brand}>
                    <div className={styles.brandBadge}>A</div>
                    {sidebarOpen ? (
                        <div>
                            <div className={styles.brandTitle}>
                                Admin Center
                            </div>
                            <div className={styles.brandSub}>
                                Quản trị hệ thống sân
                            </div>
                        </div>
                    ) : null}
                </div>

                <nav className={styles.nav}>
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            type='button'
                            className={`${styles.navItem} ${
                                active === item.id ? styles.navItemActive : ''
                            }`}
                            onClick={() => setActive(item.id)}
                            title={item.label}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {sidebarOpen ? <span>{item.label}</span> : null}
                        </button>
                    ))}
                </nav>
            </aside>

            <div className={styles.main}>
                <header className={styles.header}>
                    <div className={styles.headerTop}>
                        <button
                            type='button'
                            className={styles.menuButton}
                            onClick={() => setSidebarOpen((value) => !value)}
                        >
                            {sidebarOpen ? 'Thu gọn' : 'Mở menu'}
                        </button>
                        <div className={styles.headerActions}>
                            <button
                                type='button'
                                className={styles.refreshButton}
                                onClick={loadStats}
                                disabled={statsLoading}
                            >
                                {statsLoading
                                    ? 'Đang tải...'
                                    : 'Làm mới thống kê'}
                            </button>
                            <button
                                type='button'
                                className={styles.logoutButton}
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    <div className={styles.hero}>
                        <div>
                            <div className={styles.eyebrow}>
                                Admin Workspace
                            </div>
                            <h1>Quản trị hệ thống</h1>
                            <p>
                                Theo dõi hồ sơ owner, field chờ duyệt và báo cáo
                            </p>
                        </div>

                        <div className={styles.heroPill}>
                            <span>Tab hiện tại</span>
                            <strong>
                                {NAV_ITEMS.find((item) => item.id === active)
                                    ?.label || 'Dashboard'}
                            </strong>
                        </div>
                    </div>
                </header>

                <section className={styles.statsGrid}>
                    <article className={styles.statCard}>
                        <div className={styles.statLabel}>Owners Pending</div>
                        <div className={styles.statValue}>
                            {stats.pendingOwners}
                        </div>
                        <p>Hồ sơ chủ sân đang chờ admin xác nhận.</p>
                    </article>

                    <article className={styles.statCard}>
                        <div className={styles.statLabel}>Fields Pending</div>
                        <div className={styles.statValue}>
                            {stats.pendingFields}
                        </div>
                        <p>Số cụm sân đang chờ duyệt từ backend.</p>
                    </article>

                    <article className={styles.statCard}>
                        <div className={styles.statLabel}>Reports Pending</div>
                        <div className={styles.statValue}>
                            {stats.pendingReports}
                        </div>
                        <p>Báo cáo chờ xử lý từ người dùng và hệ thống.</p>
                    </article>
                </section>

                <section className={styles.contentPanel}>
                    {renderContent()}
                </section>
            </div>
        </div>
    );
}
