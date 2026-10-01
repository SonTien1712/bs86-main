import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getMyTickets, getTicketDetail } from '../../api/bookingApi';
import { getCurrentCustomerProfile } from '../../api/customerApi';
import { getMyTransactionHistory } from '../../api/paymentApi';
import PassTicketModal from '../../components/pass/PassTicketModal';
import BookingHistorySection from '../../components/booking/BookingHistorySection';
import ProfileDisplay from '../../components/customer/ProfileDisplay';
import ProfileForm from '../../components/customer/ProfileForm';
import TransactionHistorySection from '../../components/payment/TransactionHistorySection';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useProfileForm } from '../../hooks/useProfileForm';
import AccountGroupsSection from '../public/group/AccountGroupsSection';
import AccountMiniGroupChat from '../public/group/AccountMiniGroupChat';
import {
    getCurrentUserId,
    normalizeUserId,
    parseAuthFromToken
} from '../../utils/auth';
import { isTransferableTicketStatus } from './pass/passUi';
import styles from './ProfilePage.module.css';

const SPORT_LABELS = {
    Football: 'Bóng đá',
    FOOTBALL: 'Bóng đá',
    Basketball: 'Bóng rổ',
    BASKETBALL: 'Bóng rổ',
    Tennis: 'Tennis',
    TENNIS: 'Tennis',
    Cricket: 'Cricket',
    CRICKET: 'Cricket',
    Swimming: 'Bơi lội',
    SWIMMING: 'Bơi lội',
    Badminton: 'Cầu lông',
    BADMINTON: 'Cầu lông',
    Golf: 'Golf',
    GOLF: 'Golf',
    Cycling: 'Đạp xe',
    CYCLING: 'Đạp xe'
};

const LEVEL_LABELS = {
    Beginner: 'Mới bắt đầu',
    BEGINNER: 'Mới bắt đầu',
    Intermediate: 'Trung cấp',
    INTERMEDIATE: 'Trung cấp',
    Advanced: 'Nâng cao',
    ADVANCED: 'Nâng cao',
    Professional: 'Chuyên nghiệp',
    PROFESSIONAL: 'Chuyên nghiệp'
};

function formatDetail(value, fallback) {
    const normalized = String(value || '').trim();
    return normalized || fallback;
}

function formatSportLabel(value, fallback = 'Chưa cập nhật') {
    const normalized = String(value || '').trim();
    if (!normalized) {
        return fallback;
    }

    return SPORT_LABELS[normalized] || normalized;
}

function formatLevelLabel(value, fallback = 'Chưa cập nhật') {
    const normalized = String(value || '').trim();
    if (!normalized) {
        return fallback;
    }

    return LEVEL_LABELS[normalized] || normalized;
}

function countActiveTickets(tickets) {
    if (!Array.isArray(tickets) || tickets.length === 0) {
        return 0;
    }

    const ticketsWithStatus = tickets.filter((ticket) => ticket?.ticketStatus);
    if (ticketsWithStatus.length === 0) {
        return tickets.length;
    }

    return ticketsWithStatus.filter(
        (ticket) =>
            String(ticket.ticketStatus).trim().toUpperCase() === 'ISSUED'
    ).length;
}

function extractTransactionTotal(pageData) {
    const explicitTotal = Number(
        pageData?.totalElements ?? pageData?.total_elements
    );
    if (Number.isFinite(explicitTotal) && explicitTotal >= 0) {
        return explicitTotal;
    }

    const candidates = [
        pageData?.content,
        pageData?.items,
        pageData?.data,
        pageData?.transactions,
        pageData?.records,
        pageData?.list
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate.length;
        }
    }

    return 0;
}

function formatDateValue(value) {
    if (!value) {
        return '--';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(date);
}

function formatTimeValue(value) {
    if (!value) {
        return '--';
    }

    const normalized = String(value);
    return normalized.length >= 5 ? normalized.slice(0, 5) : normalized;
}

function formatDateTimeValue(value) {
    if (!value) {
        return '--';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function getTicketStatusMeta(status) {
    const normalized = String(status || '')
        .trim()
        .toUpperCase();

    switch (normalized) {
        case 'ISSUED':
            return {
                label: 'Còn hiệu lực',
                className: styles.ticketStatusIssued
            };
        case 'CHECKED_IN':
            return {
                label: 'Đã check-in',
                className: styles.ticketStatusCheckedIn
            };
        case 'EXPIRED':
            return {
                label: 'Hết hạn',
                className: styles.ticketStatusExpired
            };
        case 'CANCELLED':
            return {
                label: 'Đã hủy',
                className: styles.ticketStatusCancelled
            };
        default:
            return {
                label: normalized || 'Không xác định',
                className: styles.ticketStatusNeutral
            };
    }
}

function getQrImageUrl(qrContent) {
    const normalized = String(qrContent || '').trim();
    if (!normalized) {
        return '';
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(normalized)}`;
}

export default function ProfilePage({ onNotification = () => {} }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { logout } = useAuth();
    const auth = parseAuthFromToken();
    const [isEditing, setIsEditing] = useState(false);
    const [headerProfile, setHeaderProfile] = useState(null);
    const [headerProfileLoading, setHeaderProfileLoading] = useState(false);
    const [headerProfileError, setHeaderProfileError] = useState('');
    const [ticketSummary, setTicketSummary] = useState({
        count: null,
        loading: false,
        error: ''
    });
    const [tickets, setTickets] = useState([]);
    const [passTicketModalTarget, setPassTicketModalTarget] = useState(null);
    const [openTicketId, setOpenTicketId] = useState(null);
    const [ticketDetails, setTicketDetails] = useState({});
    const [ticketDetailLoading, setTicketDetailLoading] = useState({});
    const [ticketDetailErrors, setTicketDetailErrors] = useState({});
    const [transactionSummary, setTransactionSummary] = useState({
        count: null,
        loading: false,
        error: ''
    });

    const authUserId = getCurrentUserId(auth);
    const routeUserId = normalizeUserId(id);
    const displayUserId = routeUserId ?? authUserId;
    const authError = !authUserId
        ? 'Không xác định được người dùng đang đăng nhập. Vui lòng đăng nhập lại.'
        : '';
    const isReadOnly = routeUserId !== null && routeUserId !== authUserId;

    const {
        profile,
        loading: profileLoading,
        error: profileError,
        updateProfile,
        createProfile
    } = useProfile(displayUserId);
    const form = useProfileForm(profile || {});

    const resolvedProfile = useMemo(() => {
        if (isReadOnly) {
            return profile;
        }

        return headerProfile || profile;
    }, [headerProfile, isReadOnly, profile]);

    const handleEditClick = () => {
        if (!authUserId) {
            onNotification(authError, 'error');
            return;
        }

        if (isReadOnly) return;

        setIsEditing((currentValue) => {
            const nextValue = !currentValue;
            if (currentValue && profile) {
                form.resetForm();
            }
            return nextValue;
        });
    };

    const handleFormSubmit = async () => {
        if (!form.validateForm()) {
            onNotification(
                'Vui lòng kiểm tra lại thông tin hồ sơ trước khi lưu.',
                'error'
            );
            return;
        }

        try {
            if (!authUserId) {
                throw new Error(authError);
            }

            form.setIsSubmitting(true);
            const mappedPayload = {
                fullName:
                    `${form.formData.firstName || ''} ${form.formData.lastName || ''}`.trim() ||
                    '',
                phoneNumber: form.formData.phone || '',
                dateOfBirth: form.formData.dateOfBirth || null,
                address: form.formData.address || '',
                level: form.formData.sportLevel || '',
                location: form.formData.location || '',
                sportPreference: form.formData.sportPreference || '',
                avatarUrl: form.formData.avatarUrl || '',
                userId: authUserId
            };

            // Trong handleFormSubmit, sau khi updateProfile/createProfile thành công:
            if (profile) {
                await updateProfile(mappedPayload);

                // ✅ Reload lại headerProfile để hiển thị dữ liệu mới
                try {
                    const fresh = await getCurrentCustomerProfile(authUserId);
                    setHeaderProfile(
                        fresh && typeof fresh === 'object' ? fresh : null
                    );
                } catch (_) {
                    // ignore, profile cũ vẫn hiển thị
                }

                onNotification('Cập nhật hồ sơ thành công.', 'success');
            } else {
                await createProfile(mappedPayload);
                // tương tự
                onNotification('Tạo hồ sơ thành công.', 'success');
            }

            setIsEditing(false);
        } catch (error) {
            onNotification(
                error.message || 'Có lỗi xảy ra khi lưu hồ sơ.',
                'error'
            );
        } finally {
            form.setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/account', { replace: true });
    };

    useEffect(() => {
        if (profile) {
            form.resetForm();
            Object.keys(profile).forEach((key) => {
                if (key !== 'userId' && key !== 'id') {
                    form.setFieldValue(key, profile[key] || '');
                }
            });
        }
    }, [profile]);

    useEffect(() => {
        if (isReadOnly || !authUserId) {
            setHeaderProfile(null);
            setHeaderProfileError('');
            setHeaderProfileLoading(false);
            return undefined;
        }

        let isActive = true;

        const loadHeaderProfile = async () => {
            setHeaderProfileLoading(true);
            setHeaderProfileError('');

            try {
                const data = await getCurrentCustomerProfile(authUserId);
                if (!isActive) return;
                setHeaderProfile(
                    data && typeof data === 'object' ? data : null
                );
            } catch (error) {
                if (!isActive) return;
                setHeaderProfile(null);
                if (error?.status === 404) {
                    setHeaderProfileError('');
                } else {
                    setHeaderProfileError(
                        error?.message ||
                            'Không tải được thông tin hồ sơ từ backend.'
                    );
                }
            } finally {
                if (isActive) {
                    setHeaderProfileLoading(false);
                }
            }
        };

        void loadHeaderProfile();

        return () => {
            isActive = false;
        };
    }, [authUserId, isReadOnly]);

    useEffect(() => {
        if (isReadOnly || !authUserId) {
            setTickets([]);
            setPassTicketModalTarget(null);
            setOpenTicketId(null);
            setTicketDetails({});
            setTicketDetailLoading({});
            setTicketDetailErrors({});
            setTicketSummary({ count: null, loading: false, error: '' });
            setTransactionSummary({ count: null, loading: false, error: '' });
            return undefined;
        }

        let isActive = true;

        const loadTopStats = async () => {
            setTicketSummary({ count: null, loading: true, error: '' });
            setTransactionSummary({ count: null, loading: true, error: '' });

            const [ticketsResult, transactionsResult] =
                await Promise.allSettled([
                    getMyTickets(),
                    getMyTransactionHistory({ page: 0, size: 20 })
                ]);

            if (!isActive) {
                return;
            }

            if (ticketsResult.status === 'fulfilled') {
                setTickets(
                    Array.isArray(ticketsResult.value)
                        ? ticketsResult.value
                        : []
                );
                setTicketSummary({
                    count: countActiveTickets(ticketsResult.value),
                    loading: false,
                    error: ''
                });
            } else {
                setTickets([]);
                setTicketSummary({
                    count: null,
                    loading: false,
                    error:
                        ticketsResult.reason?.message ||
                        'Không tải được số lượng vé hiện có.'
                });
            }

            if (transactionsResult.status === 'fulfilled') {
                setTransactionSummary({
                    count: extractTransactionTotal(transactionsResult.value),
                    loading: false,
                    error: ''
                });
            } else {
                setTransactionSummary({
                    count: null,
                    loading: false,
                    error:
                        transactionsResult.reason?.message ||
                        'Không tải được thống kê lịch sử giao dịch.'
                });
            }
        };

        void loadTopStats();

        return () => {
            isActive = false;
        };
    }, [authUserId, isReadOnly]);

    useEffect(() => {
        if (!location.hash) {
            return;
        }

        const target = location.hash.replace('#', '');
        if (!target) {
            return;
        }

        const timeout = window.setTimeout(() => {
            const element = document.getElementById(target);
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);

        return () => window.clearTimeout(timeout);
    }, [location.hash]);

    const profileStatLabel = resolvedProfile?.sportPreference
        ? 'Môn thể thao'
        : resolvedProfile?.level
          ? 'Trình độ'
          : 'Điểm nhấn hồ sơ';
    const profileStatValue = formatDetail(
        resolvedProfile?.sportPreference
            ? formatSportLabel(resolvedProfile?.sportPreference)
            : formatLevelLabel(resolvedProfile?.level),
        'Chưa cập nhật'
    );
    const profileStatMeta =
        resolvedProfile?.sportPreference && resolvedProfile?.level
            ? `Trình độ: ${formatLevelLabel(resolvedProfile.level)}`
            : resolvedProfile?.location
              ? `Khu vực: ${resolvedProfile.location}`
              : 'Cập nhật hồ sơ để hiển thị thông tin thể thao tại đây.';

    const statCards = isReadOnly
        ? [
              {
                  label: 'Khu vực',
                  value: formatDetail(
                      resolvedProfile?.location,
                      'Chưa cập nhật'
                  ),
                  meta: 'Khu vực hiện tại lấy từ hồ sơ khách hàng.'
              },
              {
                  label: 'Môn thể thao',
                  value: formatSportLabel(
                      resolvedProfile?.sportPreference,
                      'Chưa cập nhật'
                  ),
                  meta: 'Môn thể thao chính lấy từ hồ sơ khách hàng.'
              },
              {
                  label: 'Trình độ',
                  value: formatLevelLabel(
                      resolvedProfile?.level,
                      'Chưa cập nhật'
                  ),
                  meta: 'Trình độ khai báo trong hồ sơ khách hàng.'
              }
          ]
        : [
              {
                  label: 'Vé đang hoạt động',
                  value: ticketSummary.loading
                      ? '...'
                      : ticketSummary.count === null
                        ? '--'
                        : ticketSummary.count,
                  meta: ticketSummary.error
                      ? 'Chưa lấy được số lượng từ /api/tickets/my lúc này.'
                      : 'Số vé còn hiệu lực hiện có trong tài khoản.',
                  muted: Boolean(ticketSummary.error)
              },
              {
                  label: 'Giao dịch',
                  value: transactionSummary.loading
                      ? '...'
                      : transactionSummary.count === null
                        ? '--'
                        : transactionSummary.count,
                  meta: transactionSummary.error
                      ? 'Chưa lấy được tổng giao dịch từ /api/transactions/my-history.'
                      : 'Tổng số bản ghi trả về từ lịch sử giao dịch.',
                  muted: Boolean(transactionSummary.error)
              },
              {
                  label: profileStatLabel,
                  value: profileStatValue,
                  meta: profileStatMeta,
                  muted: profileStatValue === 'Chưa cập nhật'
              }
          ];

    const topMessages = [
        authError,
        !isReadOnly && headerProfileError
            ? 'Phần hồ sơ đang dùng dữ liệu hiện có vì /api/customer-profile tạm thời lỗi.'
            : '',
        !isReadOnly && (ticketSummary.error || transactionSummary.error)
            ? 'Một số thẻ thống kê đang tạm thời không khả dụng, nhưng các phần còn lại vẫn dùng được.'
            : ''
    ].filter(Boolean);

    const showTicketSection = !isReadOnly;

    const handleToggleTicketDetail = async (ticketId) => {
        if (!ticketId) {
            return;
        }
        if (openTicketId === ticketId) {
            setOpenTicketId(null);
            return;
        }

        setOpenTicketId(ticketId);

        if (ticketDetails[ticketId] || ticketDetailLoading[ticketId]) {
            return;
        }

        setTicketDetailLoading((currentValue) => ({
            ...currentValue,
            [ticketId]: true
        }));
        setTicketDetailErrors((currentValue) => ({
            ...currentValue,
            [ticketId]: ''
        }));

        try {
            const detail = await getTicketDetail(ticketId);
            setTicketDetails((currentValue) => ({
                ...currentValue,
                [ticketId]: detail
            }));
        } catch (error) {
            setTicketDetailErrors((currentValue) => ({
                ...currentValue,
                [ticketId]:
                    error?.message || 'Không tải được thông tin QR của vé này.'
            }));
        } finally {
            setTicketDetailLoading((currentValue) => ({
                ...currentValue,
                [ticketId]: false
            }));
        }
    };

    const handleDownloadQr = async (qrUrl, ticketCode) => {
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `QR-${ticketCode || 'Ticket'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download QR failed:', error);
            const a = document.createElement('a');
            a.href = qrUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.download = `QR-${ticketCode || 'Ticket'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    return (
        <div className={styles.shell}>
            <div className={styles.container}>
                {profileError ? (
                    <div className={styles.errorAlert}>
                        <span>Lỗi hồ sơ:</span> {profileError}
                    </div>
                ) : null}

                {profileLoading ? (
                    <div className={styles.loadingWrapper}>
                        <div className={styles.spinner} />
                        <p>Đang tải thông tin hồ sơ...</p>
                    </div>
                ) : !displayUserId ? (
                    <div className={styles.errorAlert}>
                        Cần có user ID hợp lệ để mở trang này.
                    </div>
                ) : (
                    <>
                        {isEditing ? (
                            <div className={styles.editCard}>
                                <div className={styles.editHeader}>
                                    <h3>Chỉnh sửa hồ sơ</h3>
                                    <button
                                        className={styles.cancelBtn}
                                        disabled={form.isSubmitting}
                                        onClick={handleEditClick}
                                        type='button'
                                    >
                                        Hủy
                                    </button>
                                </div>
                                <ProfileForm
                                    form={form}
                                    isSubmitting={form.isSubmitting}
                                    onSubmit={handleFormSubmit}
                                    userId={authUserId}
                                />
                            </div>
                        ) : (
                            <div className={styles.displayCardWrapper}>
                                <ProfileDisplay
                                    isReadOnly={isReadOnly}
                                    onEdit={handleEditClick}
                                    profile={profile}
                                />
                            </div>
                        )}

                        {!isReadOnly ? (
                            <section className={styles.contentSection}>
                                <div className={styles.sectionHeader}>
                                    <div>
                                        <div className={styles.sectionKicker}>
                                            Tổng quan
                                        </div>
                                        <h2 className={styles.sectionTitle}>
                                            Tổng quan tài khoản
                                        </h2>
                                        <p className={styles.sectionSubtitle}>
                                            Thống kê nhanh về vé, giao dịch và
                                            thông tin thể thao.
                                        </p>
                                    </div>

                                    <div className={styles.sectionActions}>
                                        <button
                                            className={styles.secondaryAction}
                                            onClick={handleLogout}
                                            type='button'
                                        >
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.statsGrid}>
                                    {statCards.map((card) => (
                                        <article
                                            className={`${styles.statCard} ${
                                                card.muted
                                                    ? styles.statCardMuted
                                                    : ''
                                            }`}
                                            key={card.label}
                                        >
                                            <span className={styles.statLabel}>
                                                {card.label}
                                            </span>
                                            <strong
                                                className={styles.statValue}
                                            >
                                                {card.value}
                                            </strong>
                                            <p className={styles.statMeta}>
                                                {card.meta}
                                            </p>
                                        </article>
                                    ))}
                                </div>

                                {topMessages.length > 0 ? (
                                    <div className={styles.topFeedback}>
                                        {topMessages.map((message) => (
                                            <p
                                                className={
                                                    styles.topFeedbackText
                                                }
                                                key={message}
                                            >
                                                {message}
                                            </p>
                                        ))}
                                    </div>
                                ) : null}
                            </section>
                        ) : null}

                        {showTicketSection ? (
                            <section
                                className={styles.contentSection}
                                id='tickets'
                            >
                                <div className={styles.sectionHeader}>
                                    <div>
                                        <div className={styles.sectionKicker}>
                                            Vé
                                        </div>
                                        <h2 className={styles.sectionTitle}>
                                            Vé của tôi
                                        </h2>
                                        <p className={styles.sectionSubtitle}>
                                            Danh sách vé đang lấy trực tiếp từ
                                            `/api/tickets/my`.
                                        </p>
                                    </div>

                                    <div className={styles.sectionActions}>
                                        <Link
                                            className={styles.secondaryAction}
                                            to='/explore?category=PASSSAN'
                                        >
                                            PASSSAN
                                        </Link>
                                        <Link
                                            className={styles.secondaryAction}
                                            to='/pass-conversations'
                                        >
                                            Hội thoại pass vé
                                        </Link>
                                    </div>
                                </div>

                                {ticketSummary.loading ? (
                                    <div className={styles.sectionFeedback}>
                                        Đang tải vé từ backend...
                                    </div>
                                ) : null}

                                {!ticketSummary.loading &&
                                ticketSummary.error ? (
                                    <div
                                        className={styles.sectionFeedbackError}
                                    >
                                        {ticketSummary.error}
                                    </div>
                                ) : null}

                                {!ticketSummary.loading &&
                                !ticketSummary.error &&
                                tickets.length === 0 ? (
                                    <div className={styles.emptyPanel}>
                                        <strong>Chưa có vé nào.</strong>
                                        <span>
                                            Các đơn đặt sân thành công sẽ hiển
                                            thị vé tại đây.
                                        </span>
                                    </div>
                                ) : null}

                                {!ticketSummary.loading &&
                                !ticketSummary.error &&
                                tickets.length > 0 ? (
                                    <div className={styles.ticketGrid}>
                                        {tickets.map((ticket, index) => {
                                            const statusMeta =
                                                getTicketStatusMeta(
                                                    ticket?.ticketStatus
                                                );
                                            const ticketKey =
                                                ticket?.ticketId ||
                                                ticket?.ticketCode ||
                                                `ticket-${index}`;
                                            const ticketId = ticket?.ticketId;
                                            const isExpanded =
                                                openTicketId === ticketId;
                                            const detail =
                                                ticketDetails[ticketId];
                                            const detailLoading = Boolean(
                                                ticketDetailLoading[ticketId]
                                            );
                                            const detailError =
                                                ticketDetailErrors[ticketId];
                                            const qrImageUrl = getQrImageUrl(
                                                detail?.qrContent
                                            );
                                            const canPassTicket =
                                                isTransferableTicketStatus(
                                                    ticket?.ticketStatus
                                                );

                                            return (
                                                <article
                                                    className={
                                                        styles.ticketCard
                                                    }
                                                    key={ticketKey}
                                                >
                                                    <div
                                                        className={
                                                            styles.ticketTopRow
                                                        }
                                                    >
                                                        <div>
                                                            <div
                                                                className={
                                                                    styles.ticketLabel
                                                                }
                                                            >
                                                                Mã vé
                                                            </div>
                                                            <h3
                                                                className={
                                                                    styles.ticketCode
                                                                }
                                                            >
                                                                {ticket?.ticketCode ||
                                                                    '--'}
                                                            </h3>
                                                        </div>
                                                        <span
                                                            className={`${styles.ticketStatus} ${statusMeta.className}`}
                                                        >
                                                            {statusMeta.label}
                                                        </span>
                                                    </div>

                                                    <div
                                                        className={
                                                            styles.ticketVenue
                                                        }
                                                    >
                                                        <strong>
                                                            {ticket?.fieldName ||
                                                                'Chưa có tên sân'}
                                                        </strong>
                                                        <span>
                                                            {ticket?.courtName ||
                                                                'Chưa gán sân con'}
                                                        </span>
                                                    </div>

                                                    <div
                                                        className={
                                                            styles.ticketMetaGrid
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.ticketMeta
                                                            }
                                                        >
                                                            <span>Ngày</span>
                                                            <strong>
                                                                {formatDateValue(
                                                                    ticket?.slotDate
                                                                )}
                                                            </strong>
                                                        </div>
                                                        <div
                                                            className={
                                                                styles.ticketMeta
                                                            }
                                                        >
                                                            <span>Giờ</span>
                                                            <strong>
                                                                {formatTimeValue(
                                                                    ticket?.startTime
                                                                )}{' '}
                                                                -{' '}
                                                                {formatTimeValue(
                                                                    ticket?.endTime
                                                                )}
                                                            </strong>
                                                        </div>
                                                        <div
                                                            className={
                                                                styles.ticketMeta
                                                            }
                                                        >
                                                            <span>
                                                                Có hiệu lực từ
                                                            </span>
                                                            <strong>
                                                                {formatDateTimeValue(
                                                                    ticket?.validFrom
                                                                )}
                                                            </strong>
                                                        </div>
                                                        <div
                                                            className={
                                                                styles.ticketMeta
                                                            }
                                                        >
                                                            <span>
                                                                Có hiệu lực đến
                                                            </span>
                                                            <strong>
                                                                {formatDateTimeValue(
                                                                    ticket?.validUntil
                                                                )}
                                                            </strong>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className={
                                                            styles.ticketActions
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.ticketActionGroup
                                                            }
                                                        >
                                                            {canPassTicket ? (
                                                                <button
                                                                    className={
                                                                        styles.ticketActionBtn
                                                                    }
                                                                    onClick={() =>
                                                                        setPassTicketModalTarget(
                                                                            ticket
                                                                        )
                                                                    }
                                                                    type='button'
                                                                >
                                                                    Pass vé
                                                                </button>
                                                            ) : null}
                                                            <button
                                                                className={
                                                                    styles.ticketActionBtn
                                                                }
                                                                onClick={() =>
                                                                    handleToggleTicketDetail(
                                                                        ticketId
                                                                    )
                                                                }
                                                                type='button'
                                                            >
                                                                {isExpanded
                                                                    ? 'Ẩn QR'
                                                                    : 'Xem QR'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {isExpanded ? (
                                                        <div
                                                            className={
                                                                styles.ticketQrPanel
                                                            }
                                                        >
                                                            {detailLoading ? (
                                                                <div
                                                                    className={
                                                                        styles.ticketQrFeedback
                                                                    }
                                                                >
                                                                    Đang tải mã
                                                                    QR từ chi
                                                                    tiết vé...
                                                                </div>
                                                            ) : null}

                                                            {!detailLoading &&
                                                            detailError ? (
                                                                <div
                                                                    className={
                                                                        styles.ticketQrError
                                                                    }
                                                                >
                                                                    {
                                                                        detailError
                                                                    }
                                                                </div>
                                                            ) : null}

                                                            {!detailLoading &&
                                                            !detailError &&
                                                            detail ? (
                                                                <div
                                                                    className={
                                                                        styles.ticketQrContent
                                                                    }
                                                                >
                                                                    {qrImageUrl ? (
                                                                        <div className={styles.ticketQrImageContainer}>
                                                                            <img
                                                                                alt={`QR cho vé ${detail.ticketCode || ticket.ticketCode || ''}`}
                                                                                className={
                                                                                    styles.ticketQrImage
                                                                                }
                                                                                src={
                                                                                    qrImageUrl
                                                                                }
                                                                            />
                                                                            <button 
                                                                                className={styles.downloadQrBtn}
                                                                                onClick={() => handleDownloadQr(qrImageUrl, detail.ticketCode || ticket.ticketCode || '')}
                                                                                type="button"
                                                                            >
                                                                                Tải mã QR
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <div
                                                                            className={
                                                                                styles.ticketQrPlaceholder
                                                                            }
                                                                        >
                                                                            Chưa
                                                                            có
                                                                            dữ
                                                                            liệu
                                                                            QR
                                                                        </div>
                                                                    )}

                                                                    <div
                                                                        className={
                                                                            styles.ticketQrText
                                                                        }
                                                                    >
                                                                        <div
                                                                            className={
                                                                                styles.ticketQrLabel
                                                                            }
                                                                        >
                                                                            Quét
                                                                            mã
                                                                            này
                                                                            khi
                                                                            check-in
                                                                        </div>
                                                                        <p
                                                                            className={
                                                                                styles.ticketQrNote
                                                                            }
                                                                        >
                                                                            {detail?.displayNote ||
                                                                                'Hãy dùng mã QR mới nhất được cấp cho vé này.'}
                                                                        </p>
                                                                        <div
                                                                            className={
                                                                                styles.ticketQrTokenBlock
                                                                            }
                                                                        >
                                                                            <span>
                                                                                Mã
                                                                                QR
                                                                                Token
                                                                            </span>
                                                                            <strong>
                                                                                {detail?.qrToken ||
                                                                                    '--'}
                                                                            </strong>
                                                                        </div>
                                                                        <div
                                                                            className={
                                                                                styles.ticketQrTokenBlock
                                                                            }
                                                                        >
                                                                            <span>
                                                                                Nội
                                                                                dung
                                                                                QR
                                                                            </span>
                                                                            <strong>
                                                                                {detail?.qrContent ||
                                                                                    '--'}
                                                                            </strong>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    ) : null}
                                                </article>
                                            );
                                        })}
                                    </div>
                                ) : null}
                            </section>
                        ) : null}

                        {!isReadOnly ? <BookingHistorySection /> : null}
                        {!isReadOnly ? (
                            <TransactionHistorySection maxItems={5} />
                        ) : null}
                    </>
                )}
            </div>

            {!isReadOnly && (
                <>
                    <AccountGroupsSection />
                    <AccountMiniGroupChat />
                </>
            )}

            <PassTicketModal
                onClose={() => setPassTicketModalTarget(null)}
                onCreated={(createdPost) => {
                    setPassTicketModalTarget(null);
                    onNotification(
                        'Tạo bài đăng pass vé thành công.',
                        'success'
                    );
                    if (createdPost?.id) {
                        navigate('/explore?category=PASSSAN');
                    }
                }}
                open={Boolean(passTicketModalTarget)}
                ticket={passTicketModalTarget}
            />
        </div>
    );
}
