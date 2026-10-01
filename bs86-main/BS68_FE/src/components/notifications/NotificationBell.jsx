import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from './NotificationProvider';
import styles from './NotificationBell.module.css';

function BellIcon() {
    return (
        <svg aria-hidden='true' fill='none' viewBox='0 0 24 24'>
            <path
                d='M12 4.75C9.38 4.75 7.25 6.88 7.25 9.5V11.79C7.25 12.73 6.95 13.64 6.38 14.39L5.25 15.9H18.75L17.62 14.39C17.05 13.64 16.75 12.73 16.75 11.79V9.5C16.75 6.88 14.62 4.75 12 4.75Z'
                stroke='currentColor'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='1.7'
            />
            <path
                d='M9.75 18.25C10.16 19.07 11.01 19.63 12 19.63C12.99 19.63 13.84 19.07 14.25 18.25'
                stroke='currentColor'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='1.7'
            />
        </svg>
    );
}

function formatNotificationTime(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function typeLabel(type) {
    switch (String(type || '').toUpperCase()) {
        case 'BOOKING':
            return 'Booking';
        case 'PAYMENT':
            return 'Payment';
        case 'REMINDER':
            return 'Reminder';
        case 'ADMIN_ALERT':
            return 'Alert';
        default:
            return 'System';
    }
}

export default function NotificationBell() {
    const navigate = useNavigate();
    const panelRef = useRef(null);
    const [open, setOpen] = useState(false);
    const {
        auth,
        notifications,
        unreadCount,
        loading,
        loadingMore,
        hasNext,
        socketError,
        refresh,
        loadMore,
        markAsRead,
        markAllAsRead
    } = useNotifications();

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const visibleItems = useMemo(() => notifications.slice(0, 20), [notifications]);

    if (!auth.isAuthenticated) {
        return null;
    }

    const togglePanel = async () => {
        const nextOpen = !open;
        setOpen(nextOpen);

        if (nextOpen) {
            await refresh();
        }
    };

    const handleOpenNotification = async (notification) => {
        if (!notification?.id) {
            return;
        }

        if (!notification.isRead) {
            await markAsRead(notification.id);
        }

        setOpen(false);
        navigate(notification.actionUrl || '/account');
    };

    return (
        <div className={styles.wrap} ref={panelRef}>
            <button
                aria-expanded={open}
                aria-haspopup='dialog'
                className={styles.trigger}
                onClick={togglePanel}
                type='button'
            >
                <BellIcon />
                {unreadCount > 0 ? (
                    <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                ) : null}
            </button>

            {open ? (
                <div className={styles.panel} role='dialog'>
                    <div className={styles.header}>
                        <div>
                            <div className={styles.eyebrow}>Realtime center</div>
                            <div className={styles.title}>Notifications</div>
                        </div>

                        <button className={styles.markAllBtn} onClick={markAllAsRead} type='button'>
                            Mark all read
                        </button>
                    </div>

                    {socketError ? <div className={styles.socketHint}>{socketError}</div> : null}
                    {loading ? <div className={styles.feedback}>Đang tải thông báo...</div> : null}

                    {!loading && visibleItems.length === 0 ? (
                        <div className={styles.emptyState}>
                            <strong>Chưa có thông báo.</strong>
                            <span>Booking, payment và reminder sẽ hiển thị tại đây.</span>
                        </div>
                    ) : null}

                    {!loading ? (
                        <div className={styles.list}>
                            {visibleItems.map((item) => (
                                <button
                                    className={`${styles.item} ${item.isRead ? styles.itemRead : ''}`}
                                    key={item.id}
                                    onClick={() => handleOpenNotification(item)}
                                    type='button'
                                >
                                    <div className={styles.itemTop}>
                                        <span className={styles.typePill}>{typeLabel(item.type)}</span>
                                        <span className={styles.time}>{formatNotificationTime(item.createdAt)}</span>
                                    </div>
                                    <div className={styles.itemTitle}>{item.title}</div>
                                    <div className={styles.itemMessage}>{item.message}</div>
                                </button>
                            ))}
                        </div>
                    ) : null}

                    {hasNext ? (
                        <button className={styles.loadMoreBtn} disabled={loadingMore} onClick={loadMore} type='button'>
                            {loadingMore ? 'Đang tải thêm...' : 'Xem thêm'}
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

