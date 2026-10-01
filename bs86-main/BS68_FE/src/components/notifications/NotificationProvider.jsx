import {
    createContext,
    startTransition,
    useContext,
    useEffect,
    useRef,
    useState
} from 'react';
import { notificationsApi } from '../../api/notificationsApi';
import { parseAuthFromToken } from '../../utils/auth';
import { connectNotificationSocket } from './notificationSocket';

const NotificationContext = createContext(null);
const INITIAL_PAGE = { items: [], page: 0, size: 10, totalPages: 0, totalElements: 0, hasNext: false };

function isAuthError(error) {
    const status = Number(error?.response?.status);
    return status === 401 || status === 403;
}

function normalizeNotification(item) {
    if (!item || typeof item !== 'object') {
        return null;
    }

    return {
        id: Number(item.id) || 0,
        title: item.title || 'Thông báo mới',
        message: item.message || '',
        type: item.type || 'SYSTEM',
        eventCode: item.eventCode || '',
        isRead: Boolean(item.isRead),
        readAt: item.readAt || '',
        relatedEntityType: item.relatedEntityType || '',
        relatedEntityId: item.relatedEntityId ?? null,
        actionUrl: item.actionUrl || '/account',
        createdAt: item.createdAt || ''
    };
}

function mergeNotifications(currentItems, incomingItems) {
    const next = [...currentItems];

    incomingItems.forEach((item) => {
        const normalized = normalizeNotification(item);
        if (!normalized) {
            return;
        }

        const existingIndex = next.findIndex((entry) => entry.id === normalized.id);
        if (existingIndex >= 0) {
            next[existingIndex] = { ...next[existingIndex], ...normalized };
        } else {
            next.unshift(normalized);
        }
    });

    return next.sort((left, right) => {
        const leftTime = new Date(left.createdAt || 0).getTime();
        const rightTime = new Date(right.createdAt || 0).getTime();
        return rightTime - leftTime;
    });
}

export function NotificationProvider({ children }) {
    const auth = parseAuthFromToken();
    const pollingRef = useRef(null);
    const [pageState, setPageState] = useState(INITIAL_PAGE);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [socketError, setSocketError] = useState('');

    const resetState = () => {
        setPageState(INITIAL_PAGE);
        setUnreadCount(0);
        setLoading(false);
        setLoadingMore(false);
        setSocketError('');
    };

    const loadUnreadCount = async () => {
        if (!auth.isAuthenticated) {
            setUnreadCount(0);
            return;
        }

        try {
            const payload = await notificationsApi.getUnreadCount();
            const nextCount = Number(payload?.unreadCount ?? payload?.count ?? 0) || 0;
            setUnreadCount(nextCount);
        } catch (error) {
            if (isAuthError(error)) {
                setUnreadCount(0);
                return;
            }
            setUnreadCount(0);
        }
    };

    const loadNotifications = async ({ page = 0, append = false } = {}) => {
        if (!auth.isAuthenticated) {
            setPageState(INITIAL_PAGE);
            return INITIAL_PAGE;
        }

        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            const payload = await notificationsApi.getNotifications({ page, size: 10 });
            const items = Array.isArray(payload?.items)
                ? payload.items.map(normalizeNotification).filter(Boolean)
                : [];

            startTransition(() => {
                setPageState((current) => ({
                    items: append ? mergeNotifications(current.items, items) : items,
                    page: Number(payload?.page ?? page) || 0,
                    size: Number(payload?.size ?? 10) || 10,
                    totalPages: Number(payload?.totalPages ?? 0) || 0,
                    totalElements: Number(payload?.totalElements ?? items.length) || 0,
                    hasNext: Boolean(payload?.hasNext)
                }));
            });

            return payload;
        } catch (error) {
            if (isAuthError(error)) {
                startTransition(() => {
                    setPageState(INITIAL_PAGE);
                });
                return INITIAL_PAGE;
            }
            throw error;
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const refresh = async () => {
        try {
            await Promise.all([
                loadNotifications({ page: 0, append: false }),
                loadUnreadCount()
            ]);
        } catch {
            // Keep provider silent for transient fetch errors.
        }
    };

    const loadMore = async () => {
        if (loadingMore || !pageState.hasNext) {
            return;
        }

        await loadNotifications({ page: pageState.page + 1, append: true });
    };

    const markAsRead = async (notificationId) => {
        if (!notificationId) {
            return null;
        }

        try {
            const response = await notificationsApi.markAsRead(notificationId);
            const normalized = normalizeNotification(response);

            if (!normalized) {
                return null;
            }

            setPageState((current) => ({
                ...current,
                items: current.items.map((item) =>
                    item.id === normalized.id ? { ...item, ...normalized, isRead: true } : item
                )
            }));
            setUnreadCount((current) => Math.max(0, current - 1));
            return normalized;
        } catch {
            return null;
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            setPageState((current) => ({
                ...current,
                items: current.items.map((item) => ({ ...item, isRead: true }))
            }));
            setUnreadCount(0);
        } catch {
            // Keep current state if request fails.
        }
    };

    useEffect(() => {
        if (!auth.isAuthenticated) {
            resetState();
            return undefined;
        }

        void refresh();

        pollingRef.current = window.setInterval(() => {
            void loadUnreadCount();
        }, 60000);

        const disconnect = connectNotificationSocket({
            onError: (message) => setSocketError(message || ''),
            onNotification: (payload) => {
                const normalized = normalizeNotification(payload);
                if (!normalized) {
                    return;
                }

                startTransition(() => {
                    setPageState((current) => ({
                        ...current,
                        items: mergeNotifications(current.items, [normalized]),
                        totalElements:
                            current.totalElements +
                            (current.items.some((item) => item.id === normalized.id) ? 0 : 1)
                    }));
                });

                if (!normalized.isRead) {
                    setUnreadCount((current) => current + 1);
                }
            }
        });

        return () => {
            if (pollingRef.current) {
                window.clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            disconnect?.();
        };
    }, [auth.isAuthenticated, auth.token]);

    return (
        <NotificationContext.Provider
            value={{
                auth,
                notifications: pageState.items,
                unreadCount,
                loading,
                loadingMore,
                hasNext: pageState.hasNext,
                totalElements: pageState.totalElements,
                socketError,
                refresh,
                loadMore,
                markAsRead,
                markAllAsRead
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error('useNotifications must be used inside NotificationProvider.');
    }

    return context;
}
