import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listPassPosts } from '../../../api/passApi';
import { postsApi } from '../../../api/postsApi';
import ContactPassPostModal from '../../../components/pass/ContactPassPostModal';
import { getCurrentUserId, parseAuthFromToken } from '../../../utils/auth';
import {
    formatPassDate,
    formatPassMoney,
    formatPassTime,
    getApiErrorMessage,
    getPassPostStatusLabel
} from '../../customer/pass/passUi';
import styles from './ExplorePage.module.scss';

const FILTERS = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'EMPTY_COURT', label: 'Sân trống' },
    { key: 'DEAL', label: 'Deal' },
    { key: 'PASSSAN', label: 'PASSSAN' }
];

const SPORT_TYPE_LABELS = {
    FOOTBALL: 'Bóng đá',
    BADMINTON: 'Cầu lông',
    TENNIS: 'Tennis',
    PICKLEBALL: 'Pickleball',
    BASKETBALL: 'Bóng rổ',
    VOLLEYBALL: 'Bóng chuyền'
};

function timeAgo(dateStr) {
    if (!dateStr) return '';

    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;

    return formatDate(dateStr);
}

function parseDateParts(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;

    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        return {
            year: Number(isoMatch[1]),
            month: Number(isoMatch[2]),
            day: Number(isoMatch[3])
        };
    }

    const localMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (localMatch) {
        return {
            year: Number(localMatch[3]),
            month: Number(localMatch[2]),
            day: Number(localMatch[1])
        };
    }

    return null;
}

function formatDate(dateStr) {
    const parts = parseDateParts(dateStr);
    if (!parts) return dateStr || '';

    const day = String(parts.day).padStart(2, '0');
    const month = String(parts.month).padStart(2, '0');
    const year = String(parts.year);
    return `${day}/${month}/${year}`;
}

function compareDateStrings(dateA, dateB) {
    const a = parseDateParts(dateA);
    const b = parseDateParts(dateB);

    if (!a || !b) return String(dateA ?? '').localeCompare(String(dateB ?? ''));

    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
}

function formatTimeRange(startTime, endTime) {
    const start = typeof startTime === 'string' ? startTime.slice(0, 5) : '';
    const end = typeof endTime === 'string' ? endTime.slice(0, 5) : '';
    return `${start} - ${end}`;
}

function buildSlotDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;

    const normalizedTime = String(timeStr).slice(0, 8);
    const value = new Date(`${dateStr}T${normalizedTime}`);
    return Number.isNaN(value.getTime()) ? null : value;
}

function isUpcomingSlot(slot) {
    const slotStart = buildSlotDateTime(slot?.date, slot?.startTime);
    if (!slotStart) return false;
    return slotStart.getTime() > Date.now();
}

function formatSportType(type) {
    return SPORT_TYPE_LABELS[type] ?? type ?? 'Sân thể thao';
}

function getInitials(name) {
    if (!name) return 'SF';
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function resolveFilterKey(value) {
    const normalized = String(value || '')
        .trim()
        .toUpperCase();
    return FILTERS.some((item) => item.key === normalized) ? normalized : 'ALL';
}

function sortNewestFirst(left, right) {
    return new Date(right?.createdAt || 0).getTime() - new Date(left?.createdAt || 0).getTime();
}

function normalizeSlots(items) {
    if (!Array.isArray(items)) return [];

    return items
        .filter((slot) => slot && slot.date && slot.courtName)
        .map((slot) => ({
            slotId: slot.slotId,
            date: slot.date,
            courtId: slot.courtId,
            courtName: slot.courtName,
            startTime: slot.startTime,
            endTime: slot.endTime
        }))
        .filter(isUpcomingSlot);
}

function groupSlotsByDate(items) {
    const dateMap = new Map();

    items.forEach((slot) => {
        if (!dateMap.has(slot.date)) {
            dateMap.set(slot.date, new Map());
        }

        const courtMap = dateMap.get(slot.date);
        const courtKey = `${slot.courtId}-${slot.courtName}`;

        if (!courtMap.has(courtKey)) {
            courtMap.set(courtKey, {
                courtId: slot.courtId,
                courtName: slot.courtName,
                slots: []
            });
        }

        courtMap.get(courtKey).slots.push(slot);
    });

    return Array.from(dateMap.entries())
        .sort((a, b) => compareDateStrings(a[0], b[0]))
        .map(([date, courtMap]) => ({
            date,
            courts: Array.from(courtMap.values()).map((court) => ({
                ...court,
                slots: [...court.slots].sort((a, b) => {
                    const startA = a.startTime ?? '';
                    const startB = b.startTime ?? '';
                    return startA.localeCompare(startB);
                })
            }))
        }));
}

function getPostMeta(category) {
    if (category === 'DEAL') {
        return {
            pill: 'Deal',
            cardClass: styles.dealCard,
            pillClass: styles.dealPill,
            ctaLabel: 'Đặt lịch',
            bodyTitle: 'Ưu đãi từ chủ sân',
            accentClass: styles.dealAccent,
            secondaryLabel: 'Xem deal'
        };
    }

    return {
        pill: 'Sân trống',
        cardClass: styles.emptyCourtCard,
        pillClass: styles.emptyCourtPill,
        ctaLabel: 'Xem chi tiết',
        bodyTitle: 'Sân trống trong hôm nay',
        accentClass: styles.emptyCourtAccent,
        secondaryLabel: 'Xem lịch trống'
    };
}

export default function ExplorePage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const auth = parseAuthFromToken();
    const currentUserId = getCurrentUserId(auth);
    const categoryParam = searchParams.get('category');
    const [posts, setPosts] = useState([]);
    const [passPosts, setPassPosts] = useState([]);
    const [feedLoading, setFeedLoading] = useState(true);
    const [feedError, setFeedError] = useState('');
    const [passLoading, setPassLoading] = useState(true);
    const [passError, setPassError] = useState('');
    const [activeFilter, setActiveFilter] = useState(() => resolveFilterKey(categoryParam));
    const [slotCache, setSlotCache] = useState({});
    const [slotLoading, setSlotLoading] = useState({});
    const [slotErrors, setSlotErrors] = useState({});
    const [requestedSlots, setRequestedSlots] = useState({});
    const [expandedCards, setExpandedCards] = useState({});
    const [contactPost, setContactPost] = useState(null);

    const loadExploreContent = useCallback(async () => {
        setFeedLoading(true);
        setFeedError('');
        setPassLoading(true);
        setPassError('');
        setSlotCache({});
        setSlotLoading({});
        setSlotErrors({});
        setRequestedSlots({});
        setExpandedCards({});

        const [feedResult, passPostsResult] = await Promise.allSettled([
            postsApi.getFeed(),
            listPassPosts()
        ]);

        if (feedResult.status === 'fulfilled') {
            const data = feedResult.value;
            const normalized = Array.isArray(data)
                ? data.filter((item) => item && ['EMPTY_COURT', 'DEAL'].includes(item.category))
                : [];
            setPosts(normalized);
            setFeedError('');
        } else {
            setPosts([]);
            setFeedError('Không tải được bảng tin khám phá.');
        }

        if (passPostsResult.status === 'fulfilled') {
            const result = Array.isArray(passPostsResult.value) ? passPostsResult.value : [];
            setPassPosts([...result].sort(sortNewestFirst));
            setPassError('');
        } else {
            setPassPosts([]);
            setPassError(getApiErrorMessage(passPostsResult.reason, 'Không tải được PASSSAN lúc này.'));
        }

        setFeedLoading(false);
        setPassLoading(false);
    }, []);

    useEffect(() => {
        void loadExploreContent();
    }, [loadExploreContent]);

    useEffect(() => {
        const nextFilter = resolveFilterKey(categoryParam);
        setActiveFilter((currentValue) => (currentValue === nextFilter ? currentValue : nextFilter));
    }, [categoryParam]);

    const filteredPosts = useMemo(() => {
        if (activeFilter === 'ALL') return posts;
        if (activeFilter === 'PASSSAN') return [];
        return posts.filter((post) => post.category === activeFilter);
    }, [activeFilter, posts]);

    const filteredPassPosts = useMemo(() => {
        if (activeFilter === 'ALL' || activeFilter === 'PASSSAN') {
            return passPosts;
        }

        return [];
    }, [activeFilter, passPosts]);

    const showExploreFeed =
        activeFilter === 'ALL' || activeFilter === 'EMPTY_COURT' || activeFilter === 'DEAL';
    const showPassSanFeed = activeFilter === 'ALL' || activeFilter === 'PASSSAN';

    const loadSlotsForField = useCallback(
        async (fieldId) => {
            if (!fieldId) return;
            if (requestedSlots[fieldId] || slotLoading[fieldId]) return;

            setRequestedSlots((prev) => ({ ...prev, [fieldId]: true }));
            setSlotLoading((prev) => ({ ...prev, [fieldId]: true }));
            setSlotErrors((prev) => ({ ...prev, [fieldId]: '' }));

            try {
                const data = await postsApi.getAvailableSlots(fieldId);
                const items = normalizeSlots(data);
                setSlotCache((prev) => ({ ...prev, [fieldId]: items }));
            } catch (err) {
                const status = err?.response?.status;
                const message = err?.response?.data?.message;

                setSlotErrors((prev) => ({
                    ...prev,
                    [fieldId]:
                        status === 403
                            ? message || 'Chưa thể xem khung giờ trống của sân này lúc này.'
                            : message || 'Không tải được khung giờ trống.'
                }));
            } finally {
                setSlotLoading((prev) => ({ ...prev, [fieldId]: false }));
            }
        },
        [requestedSlots, slotLoading]
    );

    const handleFilterChange = (filterKey) => {
        const nextFilter = resolveFilterKey(filterKey);
        setActiveFilter(nextFilter);

        if (nextFilter === 'ALL') {
            setSearchParams({}, { replace: true });
            return;
        }

        setSearchParams({ category: nextFilter }, { replace: true });
    };

    const toggleExpandCard = (post) => {
        const nextExpanded = !expandedCards[post.id];
        setExpandedCards((prev) => ({
            ...prev,
            [post.id]: nextExpanded
        }));

        if (post.category === 'EMPTY_COURT' && nextExpanded && !requestedSlots[post.fieldId]) {
            loadSlotsForField(post.fieldId);
        }
    };

    const hasVisibleItems = filteredPosts.length > 0 || filteredPassPosts.length > 0;
    const hasVisibleLoading = (showExploreFeed && feedLoading) || (showPassSanFeed && passLoading);
    const hasVisibleError = (showExploreFeed && feedError) || (showPassSanFeed && passError);

    return (
        <div className={styles.shell}>
            <div className={styles.headerCard}>
                <div>
                    <div className={styles.eyebrow}>Khám phá sân</div>
                    <div className={styles.headerTitle}>Bảng tin sân trống, deal và PASSSAN</div>
                    <div className={styles.headerSub}>
                        Xem nhanh sân trống, ưu đãi mới và vé pass lại ngay trong cùng một trang
                        khám phá.
                    </div>
                </div>

                <button className={styles.reloadBtn} onClick={loadExploreContent} type='button'>
                    Làm mới
                </button>
            </div>

            <div className={styles.filterRow}>
                {FILTERS.map((filter) => (
                    <button
                        key={filter.key}
                        className={`${styles.filterChip} ${
                            activeFilter === filter.key ? styles.filterChipActive : ''
                        }`}
                        onClick={() => handleFilterChange(filter.key)}
                        type='button'
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            <div className={styles.feed}>
                {showExploreFeed && feedLoading ? (
                    <div className={styles.stateCard}>
                        <div className={styles.spinner} />
                        <div className={styles.stateTitle}>Đang tải bảng tin...</div>
                        <div className={styles.stateSub}>Hệ thống đang lấy bài đăng mới nhất.</div>
                    </div>
                ) : null}

                {showPassSanFeed && passLoading ? (
                    <div className={styles.stateCard}>
                        <div className={styles.spinner} />
                        <div className={styles.stateTitle}>Đang tải PASSSAN...</div>
                        <div className={styles.stateSub}>
                            Hệ thống đang lấy các bài pass vé mới nhất.
                        </div>
                    </div>
                ) : null}

                {showExploreFeed && !feedLoading && feedError ? (
                    <div className={styles.stateCard}>
                        <div className={styles.stateIcon}>!</div>
                        <div className={styles.stateTitle}>{feedError}</div>
                        <div className={styles.stateSub}>Thử làm mới để tải lại dữ liệu.</div>
                    </div>
                ) : null}

                {showPassSanFeed && !passLoading && passError ? (
                    <div className={styles.stateCard}>
                        <div className={styles.stateIcon}>!</div>
                        <div className={styles.stateTitle}>{passError}</div>
                        <div className={styles.stateSub}>Thử làm mới để tải lại danh mục PASSSAN.</div>
                    </div>
                ) : null}

                {!hasVisibleLoading && !hasVisibleError && !hasVisibleItems ? (
                    <div className={styles.stateCard}>
                        <div className={styles.stateIcon}>0</div>
                        <div className={styles.stateTitle}>Chưa có bài đăng phù hợp.</div>
                        <div className={styles.stateSub}>
                            Hiện chưa có nội dung trong nhóm đang chọn.
                        </div>
                    </div>
                ) : null}

                {showExploreFeed &&
                    !feedLoading &&
                    !feedError &&
                    filteredPosts.map((post) => {
                        const meta = getPostMeta(post.category);
                        const slotItems = slotCache[post.fieldId] ?? [];
                        const slotGroups = groupSlotsByDate(slotItems);
                        const isExpanded = Boolean(expandedCards[post.id]);
                        const visibleSlotGroups = isExpanded ? slotGroups.slice(0, 3) : [];
                        const hasRequestedSlots = Boolean(requestedSlots[post.fieldId]);

                        return (
                            <article key={post.id} className={`${styles.feedCard} ${meta.cardClass}`}>
                                <div className={styles.cardTopRow}>
                                    <div className={styles.coverWrap}>
                                        {post.fieldImage ? (
                                            <img
                                                className={styles.coverImage}
                                                src={post.fieldImage}
                                                alt={post.fieldName}
                                            />
                                        ) : (
                                            <div className={styles.coverFallback}>
                                                {getInitials(post.fieldName)}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.cardTopContent}>
                                        <div className={styles.cardMetaRow}>
                                            <span className={`${styles.categoryPill} ${meta.pillClass}`}>
                                                {meta.pill}
                                            </span>
                                            <span className={styles.sportPill}>
                                                {formatSportType(post.sportType)}
                                            </span>
                                        </div>

                                        <h3 className={styles.fieldName}>{post.fieldName}</h3>
                                        <div className={styles.fieldAddress}>{post.fieldAddress}</div>
                                        <div className={styles.cardSubMeta}>{timeAgo(post.createdAt)}</div>
                                    </div>
                                </div>

                                <div className={`${styles.bodyIntro} ${meta.accentClass}`}>
                                    <div className={styles.bodyTitle}>{meta.bodyTitle}</div>
                                    <div className={styles.bodyContent}>{post.content}</div>
                                </div>

                                {post.category === 'EMPTY_COURT' ? (
                                    <div className={styles.scheduleSection}>
                                        {!hasRequestedSlots ? (
                                            <div className={styles.scheduleState}>
                                                Bấm &quot;Xem lịch trống&quot; để tải các khung giờ gần
                                                nhất của sân.
                                            </div>
                                        ) : null}

                                        {hasRequestedSlots && slotLoading[post.fieldId] ? (
                                            <div className={styles.scheduleState}>
                                                Đang tải khung giờ trống...
                                            </div>
                                        ) : null}

                                        {hasRequestedSlots &&
                                        !slotLoading[post.fieldId] &&
                                        slotErrors[post.fieldId] ? (
                                            <div className={styles.scheduleState}>
                                                {slotErrors[post.fieldId]}
                                            </div>
                                        ) : null}

                                        {hasRequestedSlots &&
                                        isExpanded &&
                                        !slotLoading[post.fieldId] &&
                                        !slotErrors[post.fieldId] &&
                                        slotGroups.length === 0 ? (
                                            <div className={styles.scheduleState}>
                                                Chưa có khung giờ trống trong các ngày tới.
                                            </div>
                                        ) : null}

                                        {hasRequestedSlots &&
                                            isExpanded &&
                                            !slotLoading[post.fieldId] &&
                                            !slotErrors[post.fieldId] &&
                                            visibleSlotGroups.map((group, index) => (
                                                <div key={`${post.id}-${group.date}`} className={styles.scheduleCard}>
                                                    <div className={styles.scheduleCardHeader}>
                                                        <div className={styles.scheduleIndex}>{index + 1}</div>
                                                        <div>
                                                            <div className={styles.scheduleDate}>
                                                                {formatDate(group.date)}
                                                            </div>
                                                            <div className={styles.scheduleHint}>
                                                                {group.courts.length} court có khung giờ trống
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={styles.scheduleCourts}>
                                                        {group.courts.map((court) => (
                                                            <div
                                                                key={`${group.date}-${court.courtId}`}
                                                                className={styles.scheduleCourtRow}
                                                            >
                                                                <div className={styles.scheduleCourtName}>
                                                                    {court.courtName}
                                                                </div>
                                                                <div className={styles.scheduleTimes}>
                                                                    {court.slots.map((slot) => (
                                                                        <span key={slot.slotId} className={styles.timeChip}>
                                                                            {formatTimeRange(
                                                                                slot.startTime,
                                                                                slot.endTime
                                                                            )}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                        {hasRequestedSlots &&
                                        isExpanded &&
                                        !slotLoading[post.fieldId] &&
                                        !slotErrors[post.fieldId] &&
                                        slotGroups.length > 3 ? (
                                            <div className={styles.scheduleState}>
                                                Chỉ hiển thị 3 ngày gần nhất còn khung giờ trống.
                                            </div>
                                        ) : null}

                                        {hasRequestedSlots && false && isExpanded && slotGroups.length > 3 ? (
                                            <button
                                                className={styles.expandBtn}
                                                onClick={() => toggleExpandCard(post)}
                                                type='button'
                                            >
                                                {isExpanded
                                                    ? 'Thu gọn lịch'
                                                    : `Xem thêm ${slotGroups.length - 2} ngày`}
                                            </button>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className={styles.dealBody}>
                                        <div className={styles.dealMessage}>{post.content}</div>
                                        <div className={styles.dealHint}>
                                            Đặt lịch ngay để giữ ưu đãi từ chủ sân.
                                        </div>
                                    </div>
                                )}

                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.secondaryBtn}
                                        onClick={() =>
                                            post.category === 'EMPTY_COURT'
                                                ? toggleExpandCard(post)
                                                : navigate(`/booking/${post.fieldId}`)
                                        }
                                        type='button'
                                    >
                                        {post.category === 'EMPTY_COURT'
                                            ? isExpanded
                                                ? 'Thu gọn lịch'
                                                : meta.secondaryLabel
                                            : meta.secondaryLabel}
                                    </button>
                                    <button
                                        className={styles.primaryBtn}
                                        onClick={() => navigate(`/booking/${post.fieldId}`)}
                                        type='button'
                                    >
                                        {meta.ctaLabel}
                                    </button>
                                </div>
                            </article>
                        );
                    })}

                {showPassSanFeed &&
                    !passLoading &&
                    !passError &&
                    filteredPassPosts.map((post) => {
                        const isOwner = Number(post?.ownerUserId) === Number(currentUserId);

                        return (
                            <article
                                key={`pass-post-${post.id}`}
                                className={`${styles.feedCard} ${styles.passSanCard}`}
                            >
                                <div className={styles.cardTopRow}>
                                    <div className={styles.coverWrap}>
                                        {post.fieldImage ? (
                                            <img
                                                className={styles.coverImage}
                                                src={post.fieldImage}
                                                alt={post.fieldName}
                                            />
                                        ) : (
                                            <div className={styles.coverFallback}>
                                                {getInitials(post.fieldName || 'PASSSAN')}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.cardTopContent}>
                                        <div className={styles.cardMetaRow}>
                                            <span
                                                className={`${styles.categoryPill} ${styles.passSanPill}`}
                                            >
                                                PASSSAN
                                            </span>
                                            <span className={styles.sportPill}>
                                                {post.ticketStatus || 'Ticket'}
                                            </span>
                                            {isOwner ? (
                                                <span className={styles.ownerPill}>Your Post</span>
                                            ) : null}
                                        </div>

                                        <h3 className={styles.fieldName}>
                                            {post.fieldName || 'Unknown field'}
                                        </h3>
                                        <div className={styles.fieldAddress}>
                                            {post.fieldAddress || 'Address unavailable'}
                                        </div>
                                        <div className={styles.cardSubMeta}>
                                            {post.ownerFullName || 'Unknown owner'} |{' '}
                                            {formatPassDate(post.slotDate)} |{' '}
                                            {formatPassTime(post.startTime)} -{' '}
                                            {formatPassTime(post.endTime)}
                                        </div>
                                    </div>
                                </div>

                                <div className={`${styles.bodyIntro} ${styles.passSanAccent}`}>
                                    <div className={styles.bodyTitle}>
                                        {post.courtName || 'Court not assigned'}
                                    </div>
                                    <div className={styles.bodyContent}>
                                        {post.content || 'No additional details from the owner.'}
                                    </div>
                                </div>

                                <div className={styles.passStatGrid}>
                                    <div className={styles.passStatCard}>
                                        <span>Asking Price</span>
                                        <strong>{formatPassMoney(post.askingPrice)}</strong>
                                    </div>
                                    <div className={styles.passStatCard}>
                                        <span>Status</span>
                                        <strong>{getPassPostStatusLabel(post.status)}</strong>
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.secondaryBtn}
                                        onClick={() => navigate('/pass-conversations')}
                                        type='button'
                                    >
                                        Pass Conversations
                                    </button>
                                    {!isOwner ? (
                                        <button
                                            className={styles.primaryBtn}
                                            onClick={() => {
                                                if (!auth.isAuthenticated) {
                                                    navigate('/auth?mode=login');
                                                    return;
                                                }

                                                setContactPost(post);
                                            }}
                                            type='button'
                                        >
                                            {auth.isAuthenticated ? 'Contact' : 'Login to Contact'}
                                        </button>
                                    ) : (
                                        <button
                                            className={styles.primaryBtn}
                                            onClick={() => navigate('/userprofile#tickets')}
                                            type='button'
                                        >
                                            View My Tickets
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
            </div>

            <ContactPassPostModal
                onClose={() => setContactPost(null)}
                onSuccess={(conversation) => {
                    setContactPost(null);
                    if (conversation?.id) {
                        navigate(`/pass-conversations/${conversation.id}`);
                    }
                }}
                open={Boolean(contactPost)}
                post={contactPost}
            />
        </div>
    );
}
