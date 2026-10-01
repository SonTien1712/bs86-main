import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import styles from './AdminLogPage.module.css';

export default function AdminLogPage() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({});

    const [filters, setFilters] = useState({
        keyword: '',
        type: '',
        startDate: '',
        endDate: ''
    });

    const [page, setPage] = useState(0);

    useEffect(() => {
        loadStats();
        loadLogs();
    }, []);

    // ===== FORMAT TIME (FIX INVALID DATE) =====
    function formatTime(time) {
        if (!time) return '-';

        // ép về ISO có timezone để JS hiểu đúng
        const iso = time + 'Z';
        const date = new Date(iso);

        if (isNaN(date)) return '-';

        return date.toLocaleString('vi-VN');
    }

    const loadStats = async () => {
        try {
            const statRes = await adminApi.getLogStats();
            setStats(statRes.data || {});
        } catch (err) {
            console.error(err);
        }
    };

    const loadLogs = async () => {
        try {
            const logRes = await adminApi.searchLogs({
                keyword: filters.keyword || null,
                type: filters.type || null,
                startDate: filters.startDate || null,
                endDate: filters.endDate || null,
                page: page,
                size: 10
            });

            setLogs(logRes.data?.content || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleApplyFilter = () => {
        setPage(0);
        loadLogs();
    };

    const handleReset = () => {
        const reset = {
            keyword: '',
            type: '',
            startDate: '',
            endDate: ''
        };
        setFilters(reset);

        setTimeout(() => loadLogs(), 0);
    };

    return (
        <div className={styles.container}>
            <h1>Activity Logs</h1>

            {/* ===== FILTER ===== */}
            <div className={styles.filters}>
                <input
                    type='text'
                    placeholder='Search user / field / email...'
                    value={filters.keyword}
                    onChange={(e) =>
                        setFilters({ ...filters, keyword: e.target.value })
                    }
                />

                <select
                    value={filters.type}
                    onChange={(e) =>
                        setFilters({ ...filters, type: e.target.value })
                    }
                >
                    <option value=''>ALL TYPES</option>
                    <option value='ADMIN'>ADMIN</option>
                    <option value='BOOKING'>BOOKING</option>
                    <option value='FIELD'>FIELD</option>
                    <option value='OWNER'>OWNER</option>
                    <option value='REPORT'>REPORT</option>
                </select>

                <input
                    type='datetime-local'
                    value={filters.startDate}
                    onChange={(e) =>
                        setFilters({ ...filters, startDate: e.target.value })
                    }
                />

                <input
                    type='datetime-local'
                    value={filters.endDate}
                    onChange={(e) =>
                        setFilters({ ...filters, endDate: e.target.value })
                    }
                />

                <button onClick={handleApplyFilter}>Filter</button>

                <button onClick={handleReset}>Reset</button>
            </div>

            {/* ===== STATS ===== */}
            <div className={styles.stats}>
                <div className={styles.card}>
                    <p>Total Today</p>
                    <h3>{stats.totalToday || 0}</h3>
                </div>

                <div className={styles.card}>
                    <p>Success Booking</p>
                    <h3>{stats.successBookings || 0}</h3>
                </div>

                <div className={styles.card}>
                    <p>Cancel Booking</p>
                    <h3>{stats.cancelBookings || 0}</h3>
                </div>

                <div className={styles.card}>
                    <p>System Errors</p>
                    <h3>{stats.systemErrors || 0}</h3>
                </div>
            </div>

            {/* ===== TABLE ===== */}
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Type</th>
                        <th>User</th>
                        <th>Event</th>
                        <th>Field</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.length === 0 ? (
                        <tr>
                            <td colSpan='6' style={{ textAlign: 'center' }}>
                                No data
                            </td>
                        </tr>
                    ) : (
                        logs.map((log, i) => (
                            <tr key={i}>
                                <td>{formatTime(log.time)}</td>
                                <td>{log.type}</td>
                                <td>{log.user || log.userId || '-'}</td>
                                <td>{log.event || log.description || '-'}</td>
                                <td>{log.field || '-'}</td>
                                <td
                                    className={
                                        styles[log.result?.toLowerCase()]
                                    }
                                >
                                    {log.result || '-'}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
