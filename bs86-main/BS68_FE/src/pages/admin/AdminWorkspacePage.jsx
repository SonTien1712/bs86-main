import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { clearStoredAuthSession, parseAuthFromToken } from '../../utils/auth';
import styles from './AdminHomePage.module.css';
import AdminDashboard from './AdminDashboard';
import AdminFieldApprovalPage from './AdminFieldApprovalPage';
import AdminFinancePage from './AdminFinancePage';
import AdminOwnerApprovalPage from './AdminOwnerApprovalPage';
import { extractCount } from './admin.utils';
import AdminLogPage from './AdminLogPage';
import AdminReportField from './AdminReportField';
const NAV_ITEMS = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: 'D' },
    { id: 'OWNERS', label: 'Owners', icon: 'O' },
    { id: 'FIELDS', label: 'Fields', icon: 'F' },
    { id: 'REPORTS', label: 'Reports', icon: 'R' },
    { id: 'FINANCE', label: 'Finance', icon: '$' },
    { id: 'LOGS', label: 'Logs', icon: 'L' },
    { id: 'CUSTOMERS', label: 'Customers', icon: 'C' }
];

export default function AdminWorkspacePage() {
    const navigate = useNavigate();
    const auth = parseAuthFromToken();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [active, setActive] = useState('FINANCE');
    const [stats, setStats] = useState({
        pendingOwners: 0,
        pendingFields: 0,
        pendingReports: 0,
        pendingPayoutRequests: 0
    });
    const [statsLoading, setStatsLoading] = useState(false);

    const updateStat = (key, value) => {
        setStats((current) => ({ ...current, [key]: value }));
    };

    const loadStats = async () => {
        if (!auth.isAdmin) {
            return;
        }

        setStatsLoading(true);

        try {
            const [owners, fields, reports, finance] = await Promise.all([
                adminApi.getPendingOwners(),
                adminApi.getPendingFields(),
                adminApi.getPendingReports(),
                adminApi.getFinanceSummary()
            ]);

            const financeData = finance?.data || finance || {};

            setStats({
                pendingOwners: extractCount(owners),
                pendingFields: extractCount(fields),
                pendingReports: extractCount(reports),
                pendingPayoutRequests: financeData.pendingPayoutRequests || 0
            });
        } catch (error) {
            console.error('Failed to load admin stats', error);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        if (!auth.isAdmin) {
            return;
        }
        loadStats();
    }, [auth.isAdmin]);

    const handleLogout = () => {
        clearStoredAuthSession();
        navigate('/auth', { replace: true });
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
            case 'FINANCE':
                return <AdminFinancePage />;
            case 'LOGS':
                return <AdminLogPage />;
            case 'CUSTOMERS':
                return (
                    <div className={styles.placeholderPanel}>
                        <div className={styles.placeholderEyebrow}>Soon</div>
                        <h3>Customer management</h3>
                        <p>
                            Khu vực quản lý khách hàng chưa được triển khai ở
                            phiên bản này. Khi backend/API sẵn sàng, mình có thể
                            nối tiếp vào đây.
                        </p>
                    </div>
                );
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
                                Theo dõi hồ sơ owner, field chờ duyệt, báo cáo
                                và dòng tiền thanh toán trong một bộ điều khiển
                                gọn gàng hơn.
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

                    <article className={styles.statCard}>
                        <div className={styles.statLabel}>Payout Pending</div>
                        <div className={styles.statValue}>
                            {stats.pendingPayoutRequests}
                        </div>
                        <p>
                            Yêu cầu rút tiền của chủ sân đang chờ admin duyệt.
                        </p>
                    </article>
                </section>

                <section className={styles.contentPanel}>
                    {renderContent()}
                </section>
            </div>
        </div>
    );
}

