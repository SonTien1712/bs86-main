import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bookingApi } from '../../../api/bookingApi';
import { ownerApi } from '../../../api/ownerApi';
import {
    cancelPendingPayment,
    clearPendingPayment,
    clearPendingPaymentQueue,
    createVnpayPayment,
    getPendingPayment,
    rememberPendingPayment,
    rememberPendingPaymentQueue
} from '../../../api/paymentApi';
import { getCurrentUserId, parseAuthFromToken } from '../../../utils/auth';
import './BookingPage.css';

const STATUS_META = {
    AVAILABLE: { label: 'Trống', className: 'available' },
    BOOKED: { label: 'Đã đặt', className: 'booked' },
    BLOCKED: { label: 'Khóa', className: 'blocked' },
    LOCKED: { label: 'Đã khóa', className: 'locked' }
};

const LEGEND_ORDER = ['AVAILABLE', 'BOOKED', 'BLOCKED', 'LOCKED'];
const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function getTodayValue() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

function parseDateString(value) {
    if (!value) return new Date();
    const [year, month, day] = String(value).split('-').map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
}

function toDateValue(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

function formatDateDisplay(value) {
    if (!value) return '';
    const [year, month, day] = String(value).split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
}

function buildCalendarDays(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leadingEmptyCount = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();
    const cells = [];

    for (let index = 0; index < leadingEmptyCount; index += 1) {
        cells.push(null);
    }

    for (let day = 1; day <= totalDays; day += 1) {
        cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    return cells;
}

function formatVnd(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return '';
    return `${new Intl.NumberFormat('vi-VN').format(n)}đ`;
}

function formatTimeHHmm(timeStr) {
    if (!timeStr) return '';
    return String(timeStr).slice(0, 5);
}

function sortByTime(a, b) {
    return String(a || '').localeCompare(String(b || ''));
}

function getErrorMessage(error, fallback) {
    const responseData = error?.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
        return responseData;
    }

    const fieldErrors = error?.response?.data?.errors;
    if (fieldErrors && typeof fieldErrors === 'object') {
        const joinedFieldErrors = Object.values(fieldErrors)
            .filter((value) => typeof value === 'string' && value.trim())
            .join(' ');

        if (joinedFieldErrors) {
            return joinedFieldErrors;
        }
    }

    return (
        responseData?.message ||
        responseData?.error ||
        error?.message ||
        fallback
    );
}

function isBookingPaymentValidationError(message) {
    const text = String(message || '').trim();
    return (
        text.includes('Booking data is incomplete for payment') ||
        text.includes('Booking time range is invalid for payment') ||
        text.includes('Selected booking has no payable slots') ||
        text.includes('Booking already paid') ||
        text.includes('Booking is no longer payable') ||
        text.includes('Booking contains slots that cannot enter payment') ||
        text.includes('Selected slot is not available') ||
        text.includes('One or more slots are no longer available')
    );
}

function normalizeCourt(court, index) {
    return {
        id: court?.id ?? `court-${index}`,
        name: court?.name || `Court ${index + 1}`,
        fieldId: court?.fieldId ?? null,
        courtGroup: court?.courtGroup || 'Chưa phân nhóm',
        status: String(court?.status || 'ACTIVE').toUpperCase()
    };
}

function normalizeSlot(slot, court) {
    return {
        id: slot?.id ?? null,
        courtId: court.id,
        courtName: court.name,
        courtGroup: court.courtGroup,
        startTime: slot?.startTime || '',
        endTime: slot?.endTime || '',
        price: Number(slot?.price) || 0,
        status: slot?.status || 'BLOCKED'
    };
}

function unwrapBookingData(result) {
    return result?.data ?? result ?? null;
}

function getBookingId(result) {
    const bookingData = unwrapBookingData(result);
    const value = Number(bookingData?.id ?? bookingData?.bookingId);
    return Number.isInteger(value) && value > 0 ? value : null;
}

function isPastOrOngoing(slot, date) {
    if (!slot?.startTime || !date) return true;
    const now = new Date();
    const start = new Date(`${date}T${slot.startTime}`);
    return now >= start;
}

export default function BookingPage() {
    const nav = useNavigate();
    const { fieldId } = useParams();
    const auth = parseAuthFromToken();
    const currentUserId = getCurrentUserId(auth);

    const [date, setDate] = useState(getTodayValue);
    const [draftDate, setDraftDate] = useState(getTodayValue);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const initial = parseDateString(getTodayValue());
        return new Date(initial.getFullYear(), initial.getMonth(), 1);
    });
    const [courts, setCourts] = useState([]);
    const [board, setBoard] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const [ownerManagedField, setOwnerManagedField] = useState(false);
    const [ownerActionMessage, setOwnerActionMessage] = useState('');
    const [ownerActionError, setOwnerActionError] = useState('');
    const [blockingSlots, setBlockingSlots] = useState(false);
    const [togglingCourtId, setTogglingCourtId] = useState(null);

    useEffect(() => {
        setSelectedSlots([]);
    }, [fieldId, date]);

    useEffect(() => {
        const parsed = parseDateString(date);
        setDraftDate(date);
        setCalendarMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }, [date]);

    useEffect(() => {
        let active = true;

        async function releaseAbandonedPendingPayment() {
            const pendingPayment = getPendingPayment();
            if (!pendingPayment?.bookingId) {
                return;
            }

            const sameField =
                pendingPayment.fieldId == null ||
                String(pendingPayment.fieldId) === String(fieldId);
            const sameDate =
                !pendingPayment.bookingDate || pendingPayment.bookingDate === date;

            if (!sameField || !sameDate) {
                return;
            }

            try {
                await cancelPendingPayment(pendingPayment.bookingId);
            } catch (error) {
                const message = getErrorMessage(
                    error,
                    'Không thể hủy phiên thanh toán đang treo.'
                );
                const normalizedMessage = String(message).toLowerCase();
                if (
                    !normalizedMessage.includes('already paid') &&
                    !normalizedMessage.includes('booking not found')
                ) {
                    setSubmitError(message);
                }
            } finally {
                clearPendingPayment();
                if (active) {
                    setSelectedSlots([]);
                    setRefreshKey((value) => value + 1);
                }
            }
        }

        const handlePageShow = () => {
            releaseAbandonedPendingPayment();
        };

        window.addEventListener('pageshow', handlePageShow);
        releaseAbandonedPendingPayment();
        return () => {
            active = false;
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, [date, fieldId]);

    useEffect(() => {
        let cancelled = false;

        async function loadBoard() {
            if (!fieldId) {
                setCourts([]);
                setBoard({});
                setError('Không tìm thấy fieldId để tải trang booking.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');
            setOwnerActionError('');
            setOwnerActionMessage('');

            try {
                let courtData = [];
                let canManageField = false;

                if (auth?.rawIsOwner && auth?.isAuthenticated) {
                    try {
                        const myFields = await ownerApi.getMyFields();
                        const ownsCurrentField = Array.isArray(myFields)
                            && myFields.some(
                                (field) => String(field?.id) === String(fieldId)
                            );

                        if (ownsCurrentField) {
                            courtData = await ownerApi.getFieldCourts(fieldId);
                            canManageField = true;
                        } else {
                            courtData = await bookingApi.getFieldCourts(fieldId);
                        }
                    } catch {
                        courtData = await bookingApi.getFieldCourts(fieldId);
                    }
                } else {
                    courtData = await bookingApi.getFieldCourts(fieldId);
                }
                if (cancelled) return;

                setOwnerManagedField(canManageField);

                const normalizedCourts = (Array.isArray(courtData) ? courtData : [])
                    .map(normalizeCourt)
                    .sort((a, b) => {
                        const groupCompare = String(a.courtGroup).localeCompare(
                            String(b.courtGroup)
                        );
                        if (groupCompare !== 0) return groupCompare;
                        return String(a.name).localeCompare(String(b.name));
                    });

                setCourts(normalizedCourts);

                if (normalizedCourts.length === 0) {
                    setBoard({});
                    return;
                }

                const slotResponses = await Promise.all(
                    normalizedCourts.map((court) =>
                        bookingApi.getCourtSlots(court.id, date)
                    )
                );

                if (cancelled) return;

                const nextBoard = {};
                normalizedCourts.forEach((court, index) => {
                    nextBoard[court.id] = (slotResponses[index] || [])
                        .map((slot) => normalizeSlot(slot, court))
                        .sort((a, b) => sortByTime(a.startTime, b.startTime));
                });

                setBoard(nextBoard);
            } catch (loadError) {
                if (cancelled) return;
                setCourts([]);
                setBoard({});
                setOwnerManagedField(false);
                setError(
                    getErrorMessage(
                        loadError,
                        'Không thể tải danh sách court và khung giờ.'
                    )
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadBoard();

        return () => {
            cancelled = true;
        };
    }, [auth?.isAuthenticated, auth?.rawIsOwner, fieldId, date, refreshKey]);

    const selectedSlotIds = useMemo(
        () => selectedSlots.map((slot) => slot.id).filter((value) => value != null),
        [selectedSlots]
    );

    const selectedSlotsSorted = useMemo(() => {
        return [...selectedSlots].sort((a, b) => {
            const courtCompare = String(a.courtName || '').localeCompare(
                String(b.courtName || '')
            );
            if (courtCompare !== 0) return courtCompare;
            return sortByTime(a.startTime, b.startTime);
        });
    }, [selectedSlots]);

    const totalPrice = useMemo(
        () => selectedSlots.reduce((sum, slot) => sum + (Number(slot?.price) || 0), 0),
        [selectedSlots]
    );

    const selectedCourtCount = useMemo(() => {
        return new Set(
            selectedSlots
                .map((slot) => Number(slot?.courtId))
                .filter((value) => Number.isFinite(value))
        ).size;
    }, [selectedSlots]);

    const timeColumns = useMemo(() => {
        const keys = new Set();
        Object.values(board).forEach((slots) => {
            (slots || []).forEach((slot) => {
                if (slot?.startTime) {
                    keys.add(slot.startTime);
                }
            });
        });
        return [...keys].sort(sortByTime);
    }, [board]);

    const slotLookup = useMemo(() => {
        const lookup = {};
        courts.forEach((court) => {
            const rowLookup = {};
            (board[court.id] || []).forEach((slot) => {
                rowLookup[slot.startTime] = slot;
            });
            lookup[court.id] = rowLookup;
        });
        return lookup;
    }, [board, courts]);

    const groupedCourts = useMemo(() => {
        return courts.reduce((groups, court) => {
            const groupName = court.courtGroup || 'Chưa phân nhóm';
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(court);
            return groups;
        }, {});
    }, [courts]);

    const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);

    const calendarTitle = useMemo(
        () => `Tháng ${calendarMonth.getMonth() + 1} năm ${calendarMonth.getFullYear()}`,
        [calendarMonth]
    );

    const canSubmit = selectedSlotIds.length > 0 && !submitting;
    const canBlockSelected = ownerManagedField && selectedSlotIds.length > 0 && !blockingSlots;
    const totalColumns = timeColumns.length + 1;
    const todayValue = getTodayValue();
    const todayDate = parseDateString(todayValue);
    const minCalendarMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);

    const toggleSlot = (slot) => {
        if (!slot?.id) return;
        setSelectedSlots((prev) => {
            const exists = prev.some((item) => item?.id === slot.id);
            if (exists) {
                return prev.filter((item) => item?.id !== slot.id);
            }
            return [...prev, slot];
        });
    };

    const handleOpenDatePicker = () => {
        const parsed = parseDateString(date);
        setDraftDate(date);
        setCalendarMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
        setIsDatePickerOpen(true);
    };

    const handleCloseDatePicker = () => {
        setDraftDate(date);
        setIsDatePickerOpen(false);
    };

    const handleConfirmDate = () => {
        if (draftDate < todayValue) {
            setDraftDate(todayValue);
            setDate(todayValue);
            setIsDatePickerOpen(false);
            return;
        }

        setDate(draftDate);
        setIsDatePickerOpen(false);
    };

    const handlePrevMonth = () => {
        setCalendarMonth((current) => {
            const previousMonth = new Date(
                current.getFullYear(),
                current.getMonth() - 1,
                1
            );

            return previousMonth < minCalendarMonth ? current : previousMonth;
        });
    };

    const handleNextMonth = () => {
        setCalendarMonth(
            (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
        );
    };

    const handleBlockSelectedSlots = async () => {
        if (!ownerManagedField || selectedSlotIds.length === 0) {
            return;
        }

        setBlockingSlots(true);
        setOwnerActionError('');
        setOwnerActionMessage('');

        try {
            const groupedSlots = selectedSlots.reduce((groups, slot) => {
                const courtId = Number(slot?.courtId);
                if (!Number.isFinite(courtId) || !slot?.id) {
                    return groups;
                }

                if (!groups[courtId]) {
                    groups[courtId] = [];
                }

                groups[courtId].push(slot.id);
                return groups;
            }, {});

            await Promise.all(
                Object.entries(groupedSlots).map(([courtId, slotIds]) =>
                    ownerApi.blockSlots(courtId, slotIds)
                )
            );

            setSelectedSlots([]);
            setOwnerActionMessage('Đã khóa slot thành công.');
            setRefreshKey((value) => value + 1);
        } catch (error) {
            setOwnerActionError(
                getErrorMessage(error, 'Không thể khóa slot đã chọn.')
            );
        } finally {
            setBlockingSlots(false);
        }
    };

    const handleToggleCourtStatus = async (court) => {
        if (!ownerManagedField || !court?.id) {
            return;
        }

        const nextStatus = court.status === 'MAINTENANCE' ? 'ACTIVE' : 'MAINTENANCE';
        setTogglingCourtId(court.id);
        setOwnerActionError('');
        setOwnerActionMessage('');

        try {
            await ownerApi.updateCourtStatus(court.id, nextStatus);
            setSelectedSlots((prev) =>
                prev.filter((slot) => String(slot?.courtId) !== String(court.id))
            );
            setOwnerActionMessage(
                nextStatus === 'MAINTENANCE'
                    ? `Đã khóa ${court.name}.`
                    : `Đã mở khóa ${court.name}.`
            );
            setRefreshKey((value) => value + 1);
        } catch (error) {
            setOwnerActionError(
                getErrorMessage(error, 'Không thể cập nhật trạng thái sân.')
            );
        } finally {
            setTogglingCourtId(null);
        }
    };

    const submit = async () => handleSubmit();

    const handleSubmit = async () => {
        if (selectedSlotIds.length === 0) {
            alert('Vui lòng chọn ít nhất 1 ô sân trống.');
            return;
        }

        if (!currentUserId) {
            alert('Vui lòng đăng nhập lại trước khi đặt sân.');
            nav('/auth?mode=login');
            return;
        }

        setSubmitting(true);
        setSubmitError('');
        const createdPendingPayments = [];

        try {
            const bookingsByCourt = selectedSlots.reduce((groups, slot) => {
                const courtId = Number(slot?.courtId);
                if (!Number.isFinite(courtId)) {
                    return groups;
                }

                if (!groups[courtId]) {
                    groups[courtId] = {
                        courtId,
                        customerId: currentUserId,
                        bookingDate: date,
                        startTimes: []
                    };
                }

                const startTime = formatTimeHHmm(slot?.startTime);
                if (startTime) {
                    groups[courtId].startTimes.push(startTime);
                }

                return groups;
            }, {});

            const requests = Object.values(bookingsByCourt)
                .map((payload) => ({
                    ...payload,
                    startTimes: [...new Set(payload.startTimes)].sort(sortByTime)
                }))
                .filter((payload) => payload.startTimes.length > 0);

            if (requests.length === 0) {
                throw new Error('Không tạo được dữ liệu đặt sân hợp lệ.');
            }

            for (const payload of requests) {
                const response = await bookingApi.createBooking(payload);
                const bookingId = getBookingId(response);

                if (!bookingId) {
                    throw new Error('Không lấy được bookingId để tạo thanh toán VNPay.');
                }

                createdPendingPayments.push({
                    bookingId,
                    fieldId,
                    bookingDate: date
                });
            }

            const bookingId = createdPendingPayments[0]?.bookingId;

            if (!bookingId) {
                throw new Error('Không lấy được bookingId để tạo thanh toán VNPay.');
            }

            rememberPendingPaymentQueue(createdPendingPayments);
            rememberPendingPayment(createdPendingPayments[0]);
            const payment = await createVnpayPayment(bookingId);
            window.location.assign(payment.paymentUrl);
            return;
        } catch (submitError) {
            clearPendingPayment();
            clearPendingPaymentQueue();

            if (createdPendingPayments.length > 0) {
                await Promise.allSettled(
                    createdPendingPayments.map((item) =>
                        cancelPendingPayment(item.bookingId)
                    )
                );
            }

            const rawMessage = getErrorMessage(submitError, 'Booking failed');
            setSubmitError(rawMessage);
            if (submitError?.response?.status === 409) {
                setSelectedSlots([]);
                setRefreshKey((value) => value + 1);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className='booking-shell'>
            <div className='booking-header'>
                <div className='booking-heading'>
                    <div className='booking-kicker'>Booking board</div>
                    <div className='booking-title'>Đặt lịch theo sân</div>
                    <div className='booking-sub'>
                        Field ID: <b>{fieldId}</b> · {courts.length} court
                    </div>
                </div>

                    <button className='btn-back' onClick={() => nav(-1)} type='button'>
                    ← Quay lại
                </button>
            </div>

            <div className='booking-card'>
                <div className='booking-topbar'>
                    <div className='booking-toolbar'>
                        <div className='form-group booking-date-group'>
                            <div className='label'>Ngày xem lịch</div>
                            <button
                                className='date-trigger'
                                onClick={handleOpenDatePicker}
                                type='button'
                            >
                                <span>{formatDateDisplay(date)}</span>
                                <span className='date-trigger-icon' aria-hidden='true'>
                                    CAL
                                </span>
                            </button>

                            {isDatePickerOpen ? (
                                <div
                                    className='date-picker-popover'
                                    role='dialog'
                                    aria-label='Chọn ngày booking'
                                >
                                    <div className='date-picker-header'>
                                        <button
                                            className='date-nav-btn'
                                            disabled={calendarMonth <= minCalendarMonth}
                                            onClick={handlePrevMonth}
                                            type='button'
                                        >
                                            &lt;
                                        </button>
                                        <div className='date-picker-title'>{calendarTitle}</div>
                                        <button
                                            className='date-nav-btn'
                                            onClick={handleNextMonth}
                                            type='button'
                                        >
                                            &gt;
                                        </button>
                                    </div>

                                    <div className='date-picker-weekdays'>
                                        {WEEKDAY_LABELS.map((dayLabel) => (
                                            <span key={dayLabel}>{dayLabel}</span>
                                        ))}
                                    </div>

                                    <div className='date-picker-grid'>
                                        {calendarDays.map((dayItem, index) => {
                                            if (!dayItem) {
                                                return (
                                                    <span
                                                        className='date-cell-empty'
                                                        key={`empty-${index}`}
                                                    />
                                                );
                                            }

                                            const dayValue = toDateValue(dayItem);
                                            const isActive = dayValue === draftDate;
                                            const isToday = dayValue === todayValue;
                                            const isPastDate = dayItem < todayDate;

                                            return (
                                                <button
                                                    className={`date-cell ${
                                                        isActive ? 'active' : ''
                                                    } ${isToday ? 'today' : ''} ${
                                                        isPastDate ? 'disabled' : ''
                                                    }`}
                                                    disabled={isPastDate}
                                                    key={dayValue}
                                                    onClick={() => {
                                                        if (isPastDate) return;
                                                        setDraftDate(dayValue);
                                                    }}
                                                    type='button'
                                                >
                                                    {dayItem.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className='date-picker-actions'>
                                        <button
                                            className='date-picker-cancel'
                                            onClick={handleCloseDatePicker}
                                            type='button'
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            className='date-picker-confirm'
                                            onClick={handleConfirmDate}
                                            type='button'
                                        >
                                            Xác nhận
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className='legend'>
                            <div className='label'>Ghi chú nhanh</div>
                            <div className='legend-items'>
                                {LEGEND_ORDER.map((status) => (
                                    <span className='chip' key={status}>
                                        <span className={`dot ${STATUS_META[status].className}`}></span>
                                        {STATUS_META[status].label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className='actions-wrapper'>
                        <div className='actions'>
                            <button
                                className='btn-subtle'
                                disabled={selectedSlotIds.length === 0}
                                onClick={() => setSelectedSlots([])}
                                type='button'
                            >
                                Xóa chọn
                            </button>

                            {ownerManagedField ? (
                                <button
                                    className={`btn-subtle ${!canBlockSelected ? 'disabled' : ''}`}
                                    disabled={!canBlockSelected}
                                    onClick={handleBlockSelectedSlots}
                                    type='button'
                                >
                                    {blockingSlots ? 'Đang khóa...' : 'Khóa slot đã chọn'}
                                </button>
                            ) : null}

                            <button
                                className={`btn-main ${!canSubmit ? 'disabled' : ''}`}
                                disabled={!canSubmit}
                                onClick={submit}
                                type='button'
                            >
                                {submitting
                                    ? ownerManagedField
                                        ? 'Đang đặt nội bộ...'
                                        : 'Đang đặt...'
                                    : ownerManagedField
                                      ? 'Owner tự đặt sân'
                                      : 'Đặt ngay'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className='booking-note'>
                    <span className='booking-note-label'>Lưu ý:</span>{' '}
                    {ownerManagedField
                        ? 'Bạn đang ở chế độ owner của chính field này: có thể tự đặt sân nội bộ, khóa 1 hoặc nhiều slot, và khóa từng court.'
                        : 'Nhấn vào ô sân trống để chọn nhanh khung giờ phù hợp.'}
                </div>

                {ownerActionMessage ? (
                    <div className='board-feedback board-success'>{ownerActionMessage}</div>
                ) : null}

                {ownerActionError ? (
                    <div className='board-feedback board-error'>{ownerActionError}</div>
                ) : null}

                {loading ? (
                    <div className='board-feedback'>Đang tải danh sách sân và khung giờ...</div>
                ) : null}

                {!loading && error ? (
                    <div className='board-feedback board-error'>{error}</div>
                ) : null}

                {!loading && !error && courts.length === 0 ? (
                    <div className='board-feedback'>Sân này chưa có court để đặt lịch.</div>
                ) : null}

                {!loading && !error && courts.length > 0 && timeColumns.length === 0 ? (
                    <div className='board-feedback'>Chưa có khung giờ nào cho ngày đã chọn.</div>
                ) : null}

                {!loading && !error && courts.length > 0 && timeColumns.length > 0 ? (
                    <div className='board-wrap'>
                        <div
                            className='board-grid'
                            style={{
                                gridTemplateColumns: `220px repeat(${timeColumns.length}, minmax(104px, 1fr))`
                            }}
                        >
                            <div className='board-head board-court-head'>Sân</div>
                            {timeColumns.map((time) => (
                                <div className='board-head board-time-head' key={time}>
                                    {formatTimeHHmm(time)}
                                </div>
                            ))}

                            {Object.entries(groupedCourts).flatMap(([groupName, groupCourts]) => [
                                <div
                                    className='board-group-row'
                                    key={`group-${groupName}`}
                                    style={{ gridColumn: `1 / span ${totalColumns}` }}
                                >
                                    {groupName}
                                </div>,
                                ...groupCourts.flatMap((court) => [
                                    <div className='board-court-cell' key={`court-${court.id}`}>
                                        <div className='court-name'>{court.name}</div>
                                        <div className='court-meta'>Court #{court.id}</div>
                                        <div className='court-meta'>
                                            Trạng thái:{' '}
                                            {court.status === 'MAINTENANCE'
                                                ? 'Đang khóa'
                                                : 'Hoạt động'}
                                        </div>
                                        {ownerManagedField ? (
                                            <button
                                                className={`court-lock-btn ${
                                                    court.status === 'MAINTENANCE'
                                                        ? 'unlock'
                                                        : 'lock'
                                                }`}
                                                disabled={togglingCourtId === court.id}
                                                onClick={() => handleToggleCourtStatus(court)}
                                                type='button'
                                            >
                                                {togglingCourtId === court.id
                                                    ? 'Đang cập nhật...'
                                                    : court.status === 'MAINTENANCE'
                                                      ? 'Mở khóa court'
                                                      : 'Khóa court'}
                                            </button>
                                        ) : null}
                                    </div>,
                                    ...timeColumns.map((time) => {
                                        const slot = slotLookup[court.id]?.[time] || null;
                                        const isExpired = slot ? isPastOrOngoing(slot, date) : false;
                                        const isCourtLocked =
                                            String(court.status).toUpperCase() === 'MAINTENANCE';
                                        const isAvailable =
                                            slot?.status === 'AVAILABLE' &&
                                            !isExpired &&
                                            !isCourtLocked;
                                        const isSelected = selectedSlotIds.includes(slot?.id);
                                        const statusMeta =
                                            STATUS_META[slot?.status] || STATUS_META.BLOCKED;

                                        if (!slot) {
                                            return (
                                                <div
                                                    className='board-slot board-slot-empty'
                                                    key={`${court.id}-${time}`}
                                                >
                                                    -
                                                </div>
                                            );
                                        }

                                        return (
                                            <button
                                                className={`board-slot ${statusMeta.className} ${
                                                    isExpired ? 'expired' : ''
                                                } ${isCourtLocked ? 'court-locked' : ''} ${
                                                    isSelected ? 'selected' : ''
                                                }`}
                                                disabled={!isAvailable}
                                                key={`${court.id}-${time}`}
                                                onClick={() => toggleSlot(slot)}
                                                type='button'
                                            >
                                                <span className='board-slot-time'>
                                                    {formatTimeHHmm(slot.startTime)} - {formatTimeHHmm(slot.endTime)}
                                                </span>
                                                <span className='board-slot-price'>
                                                    {formatVnd(slot.price)}
                                                </span>
                                                <span className='board-slot-status'>
                                                    {isCourtLocked
                                                        ? 'Court đang khóa'
                                                        : statusMeta.label}
                                                </span>
                                            </button>
                                        );
                                    })
                                ])
                            ])}
                        </div>
                    </div>
                ) : null}

                <div className='selected-card'>
                    <div className='selected-header'>
                        <div>
                            <div className='selected-title'>Khung giờ đã chọn</div>
                            <div className='selected-sub'>
                                {selectedSlotIds.length === 0
                                    ? 'Bạn chưa chọn khung giờ nào.'
                                    : `${selectedSlotIds.length} khung giờ · Tổng ${formatVnd(totalPrice)}`}
                            </div>
                        </div>
                    </div>

                    <div className='payment-methods'>
                        <div className='selected-title payment-method-title'>Thanh toán</div>
                        <div className='payment-method-options'>
                            <div className='payment-method-option active static'>
                                <span>
                                    {ownerManagedField
                                        ? 'Đặt nội bộ cho owner'
                                        : 'Thanh toán qua VNPay'}
                                </span>
                            </div>
                        </div>

                        {submitting ? (
                            <div className='payment-method-note'>
                                {selectedCourtCount > 1
                                    ? 'Đang tạo các booking và mở lần lượt phiên thanh toán VNPay cho từng court.'
                                    : 'Đang tạo kết nối VNPay... vui lòng giữ nguyên trang.'}
                            </div>
                        ) : null}

                        {submitError ? (
                            <>
                                <div className='payment-method-note' style={{ color: '#fca5a5' }}>
                                    {submitError}
                                </div>
                                {!ownerManagedField && isBookingPaymentValidationError(submitError) ? (
                                    <div className='payment-method-note'>
                                        <button
                                            className='btn-subtle'
                                            onClick={() => nav(`/booking/${fieldId}`)}
                                            type='button'
                                        >
                                            Quay lại chọn sân
                                        </button>
                                    </div>
                                ) : null}
                            </>
                        ) : null}
                    </div>

                    {selectedSlotIds.length > 0 ? (
                        <div className='selected-list'>
                            {selectedSlotsSorted.map((slot) => (
                                <button
                                    className='selected-chip'
                                    key={slot.id}
                                    onClick={() => toggleSlot(slot)}
                                    type='button'
                                >
                                    <b>{slot.courtName}</b>
                                    <span>
                                        {formatTimeHHmm(slot.startTime)} - {formatTimeHHmm(slot.endTime)}
                                    </span>
                                    <span>{formatVnd(slot.price)} ×</span>
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}




