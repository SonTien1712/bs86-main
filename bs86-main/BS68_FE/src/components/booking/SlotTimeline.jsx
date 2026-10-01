import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import './SlotTimeline.css';

function formatTimeHHmm(timeStr) {
    if (!timeStr) return '';
    return String(timeStr).slice(0, 5);
}

function formatVnd(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return '';
    return `${new Intl.NumberFormat('vi-VN').format(n)}đ`;
}

export default function SlotTimeline({
    slots,
    courtId,
    date,
    refreshKey,
    selectedSlotIds,
    onToggleSlot,
    allowMulti = false
}) {
    const [fetchedSlots, setFetchedSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorText, setErrorText] = useState('');

    const isPastOrOngoing = (slot) => {
        if (!slot || !slot.startTime || !slot.endTime || !date) return true;
        const now = new Date();
        const start = new Date(`${date}T${slot.startTime}`);
        return now >= start;
    };

    useEffect(() => {
        let cancelled = false;
        async function run() {
            if (!courtId || !date || slots?.length) {
                // ⚡ chỉ fetch nếu không có slots từ parent
                if (!slots?.length) setFetchedSlots([]);
                return;
            }

            setLoading(true);
            setErrorText('');
            try {
                const json = await axiosClient
                    .get(`/api/courts/${courtId}/slots`, { params: { date } })
                    .then((r) => r.data);

                const data = Array.isArray(json?.data) ? json.data : [];
                if (!cancelled) setFetchedSlots(data);
            } catch (e) {
                if (!cancelled) {
                    setFetchedSlots([]);
                    const httpStatus = e?.response?.status;
                    const serverMsg =
                        e?.response?.data?.message ||
                        e?.response?.data?.error ||
                        e?.message ||
                        'Failed to load slots';
                    setErrorText(
                        httpStatus
                            ? `HTTP ${httpStatus} — ${serverMsg}`
                            : serverMsg
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        run();
        return () => {
            cancelled = true;
        };
    }, [courtId, date, refreshKey, slots]);

    const sortedSlots = useMemo(() => {
        const allSlots = slots?.length ? slots : fetchedSlots;
        return [...allSlots].sort((a, b) =>
            String(a?.startTime || '').localeCompare(String(b?.startTime || ''))
        );
    }, [slots, fetchedSlots]);

    const getStatusClass = (slot) => {
        if (!slot) return 'slot';
        if (isPastOrOngoing(slot)) return 'slot disabled';
        switch (slot.status) {
            case 'AVAILABLE':
                return 'slot available';
            case 'BOOKED':
                return 'slot booked';
            case 'BLOCKED':
                return 'slot blocked';
            default:
                return 'slot';
        }
    };

    return (
        <div className='timeline-container'>
            <div className='timeline-header'>
                <div className='title'>Booking timeline</div>
                <div className='count'>
                    {loading ? 'Loading...' : `${sortedSlots.length} slot(s)`}
                </div>
            </div>

            {errorText ? (
                <div className='error'>Failed to load slots: {errorText}</div>
            ) : !courtId || !date ? (
                <div className='hint'>
                    Enter <b>Court ID</b> and <b>Date</b> to view slots.
                </div>
            ) : loading ? (
                <div className='hint'>Loading slots…</div>
            ) : sortedSlots.length === 0 ? (
                <div className='hint'>No slots for this date.</div>
            ) : (
                <div className='timeline-wrap'>
                    <div className='timeline-row'>
                        {sortedSlots.map((slot) => {
                            if (!slot) return null;
                            const isAvailable =
                                slot?.status === 'AVAILABLE' &&
                                !isPastOrOngoing(slot);
                            const isSelected = Array.isArray(selectedSlotIds)
                                ? selectedSlotIds.includes(slot?.id)
                                : false;
                            const timeLabel = `${formatTimeHHmm(slot?.startTime)} - ${formatTimeHHmm(slot?.endTime)}`;

                            return (
                                <div
                                    key={slot?.id}
                                    className={`${getStatusClass(slot)} ${isSelected ? 'selected' : ''}`}
                                    onClick={() => {
                                        if (!isAvailable) return;
                                        if (allowMulti) onToggleSlot?.(slot);
                                    }}
                                >
                                    <div>
                                        <div className='time'>{timeLabel}</div>
                                        <div className='meta'>
                                            <span className='price'>
                                                {formatVnd(slot?.price)}
                                            </span>
                                            <span className='pill'>
                                                {slot?.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className='slot-id'>
                                        ID: {slot?.id}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
