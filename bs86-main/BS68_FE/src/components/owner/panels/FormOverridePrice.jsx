import { useEffect, useMemo, useState } from 'react';
import { ownerApi } from '../../../api/ownerApi';
import { postsApi } from '../../../api/postsApi';
import FormShell from './FormShell';
import FieldSummaryCard from './FieldSummaryCard';
import styles from '../../../pages/public/account/OwnerManagementPanels.module.scss';

const INITIAL_FORM = {
    fieldId: '',
    courtId: '',
    date: '',
    price: '',
    shouldPublishDeal: true,
    dealContent: ''
};

function toShortTime(value) {
    return String(value || '').slice(0, 5);
}

function buildDealContent({ fieldName, date, times, price }) {
    const ordered = [...times].sort();
    const shortTimes = ordered.map(toShortTime);

    if (shortTimes.length > 1) {
        const consecutive = ordered.every((time, index) => {
            if (index === 0) return true;
            const [prevHour, prevMinute] = ordered[index - 1].split(':').map(Number);
            const [hour, minute] = time.split(':').map(Number);
            return hour * 60 + minute === prevHour * 60 + prevMinute + 60;
        });

        if (consecutive) {
            const [lastHour, lastMinute] = ordered[ordered.length - 1].split(':').map(Number);
            const endMinutes = lastHour * 60 + lastMinute + 60;
            const endHour = String(Math.floor(endMinutes / 60)).padStart(2, '0');
            const endMinute = String(endMinutes % 60).padStart(2, '0');
            return `Ưu đãi ${fieldName} ngày ${date}, khung giờ ${shortTimes[0]} - ${endHour}:${endMinute}, giá chỉ ${price} VND. Bấm đặt lịch ngay.`;
        }

        return `Ưu đãi ${fieldName} ngày ${date} cho các khung giờ ${shortTimes.join(', ')}, giá chỉ ${price} VND/slot. Bấm đặt lịch ngay.`;
    }

    return `Ưu đãi ${fieldName} ngày ${date}, khung giờ ${shortTimes[0]}, giá chỉ ${price} VND. Bấm đặt lịch ngay.`;
}

function getCourtTemplateLabel(court) {
    const weekday = court?.hasWeekdayTemplate ? 'Weekday OK' : 'Weekday chưa có';
    const weekend = court?.hasWeekendTemplate ? 'Weekend OK' : 'Weekend chưa có';
    return `${weekday} · ${weekend}`;
}

export default function FormOverridePrice({ fields, loadingFields, fieldsError }) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [courts, setCourts] = useState([]);
    const [loadingCourts, setLoadingCourts] = useState(false);
    const [courtsError, setCourtsError] = useState('');
    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsError, setSlotsError] = useState('');
    const [selectedTimes, setSelectedTimes] = useState([]);
    const [st, setSt] = useState({ loading: false, msg: '', type: '' });
    const [dealStatus, setDealStatus] = useState({ loading: false, msg: '', type: '' });

    useEffect(() => {
        if (!form.fieldId && fields.length > 0) {
            setForm((current) => ({ ...current, fieldId: String(fields[0].id) }));
        }
    }, [fields, form.fieldId]);

    const selectedField = useMemo(
        () =>
            fields.find((field) => String(field.id) === String(form.fieldId)) || null,
        [fields, form.fieldId]
    );

    const selectedCourt = useMemo(
        () => courts.find((court) => String(court.id) === String(form.courtId)) || null,
        [courts, form.courtId]
    );

    useEffect(() => {
        let cancelled = false;

        async function loadCourts() {
            if (!form.fieldId) {
                setCourts([]);
                setCourtsError('');
                setLoadingCourts(false);
                return;
            }

            setCourts([]);
            setCourtsError('');
            setLoadingCourts(true);
            setSlots([]);
            setSlotsError('');
            setSelectedTimes([]);
            setForm((current) => ({ ...INITIAL_FORM, fieldId: current.fieldId }));

            try {
                const data = await ownerApi.getFieldCourts(Number(form.fieldId));
                if (!cancelled) {
                    setCourts(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                if (!cancelled) {
                    setCourts([]);
                    setCourtsError(
                        error?.response?.data?.message ||
                            error?.message ||
                            'Không tải được courts của field đang chọn.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingCourts(false);
                }
            }
        }

        loadCourts();

        return () => {
            cancelled = true;
        };
    }, [form.fieldId]);

    useEffect(() => {
        let cancelled = false;

        async function loadSlots() {
            if (!form.courtId || !form.date) {
                setSlots([]);
                setSelectedTimes([]);
                setSlotsError('');
                setSlotsLoading(false);
                return;
            }

            setSlotsLoading(true);
            setSlotsError('');
            setSelectedTimes([]);

            try {
                const data = await ownerApi.getCourtSlots(Number(form.courtId), form.date);
                if (!cancelled) {
                    const sorted = [...(Array.isArray(data) ? data : [])].sort((a, b) =>
                        String(a?.startTime || '').localeCompare(String(b?.startTime || ''))
                    );
                    setSlots(sorted);
                }
            } catch (error) {
                if (!cancelled) {
                    setSlots([]);
                    setSlotsError(
                        error?.response?.data?.message ||
                            error?.message ||
                            'Không tải được slot của court này.'
                    );
                }
            } finally {
                if (!cancelled) setSlotsLoading(false);
            }
        }

        loadSlots();
        return () => {
            cancelled = true;
        };
    }, [form.courtId, form.date]);

    useEffect(() => {
        if (
            !form.shouldPublishDeal ||
            !selectedField ||
            !form.date ||
            !form.price ||
            selectedTimes.length === 0
        ) {
            return;
        }

        setForm((current) => ({
            ...current,
            dealContent: buildDealContent({
                fieldName: selectedField.name,
                date: current.date,
                times: selectedTimes,
                price: current.price
            })
        }));
    }, [form.shouldPublishDeal, form.date, form.price, selectedField, selectedTimes]);

    const toggleSlotTime = (slot) => {
        const startTime = slot?.startTime;
        if (!startTime) return;

        setSelectedTimes((current) =>
            current.includes(startTime)
                ? current.filter((item) => item !== startTime)
                : [...current, startTime].sort()
        );
    };

    const formatSlotPrice = (value) => {
        const amount = Number(value);
        if (!Number.isFinite(amount)) return null;
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    const submit = async (event) => {
        event.preventDefault();

        const times = [...selectedTimes].sort();
        if (times.length === 0) {
            window.alert('Chọn ít nhất 1 slot');
            return;
        }

        if (!form.courtId) {
            setSt({
                loading: false,
                msg: 'Vui lòng chọn court thuộc field đang chọn.',
                type: 'error'
            });
            return;
        }

        if (!selectedField) {
            setSt({
                loading: false,
                msg: 'Vui lòng chọn field để đăng DEAL.',
                type: 'error'
            });
            return;
        }

        setSt({ loading: true, msg: '', type: '' });
        setDealStatus({ loading: false, msg: '', type: '' });

        try {
            await ownerApi.overridePrice(Number(form.courtId), {
                date: form.date,
                times,
                price: form.price === '' ? null : Number(form.price)
            });

            setSt({ loading: false, msg: 'Đã cập nhật giá ưu đãi.', type: 'success' });

            if (form.shouldPublishDeal) {
                setDealStatus({ loading: true, msg: '', type: '' });

                try {
                    await postsApi.createPost({
                        fieldId: Number(form.fieldId),
                        category: 'DEAL',
                        content:
                            form.dealContent ||
                            buildDealContent({
                                fieldName: selectedField.name,
                                date: form.date,
                                times,
                                price: form.price
                            })
                    });

                    setDealStatus({
                        loading: false,
                        msg: 'Đã đăng bài DEAL.',
                        type: 'success'
                    });
                } catch (error) {
                    setDealStatus({
                        loading: false,
                        msg:
                            error?.response?.data?.message ||
                            error?.message ||
                            'Đè giá thành công nhưng đăng DEAL thất bại.',
                        type: 'error'
                    });
                }
            }
        } catch (error) {
            setSt({
                loading: false,
                msg: error?.response?.data?.message || 'Có lỗi xảy ra',
                type: 'error'
            });
        }
    };

    return (
        <FormShell
            title='Ghi đè giá sân (khuyến mãi / ưu đãi)'
            desc='Court list và slot preview luôn phụ thuộc field đang chọn. Nếu slots trả [] thì UI chỉ hiển thị chưa có khung giờ, không coi là lỗi.'
            onSubmit={submit}
            loading={st.loading || dealStatus.loading}
            msgType={st.type}
            msgText={st.msg}
            submitDisabled={!selectedTimes.length || slotsLoading}
        >
            <div className={styles.inputGroup}>
                <label>Field của bạn</label>
                <select
                    value={form.fieldId}
                    disabled={loadingFields || fields.length === 0}
                    onChange={(e) =>
                        setForm((current) => ({ ...current, fieldId: e.target.value }))
                    }
                >
                    <option value=''>{loadingFields ? 'Đang tải field...' : 'Chọn field'}</option>
                    {fields.map((field) => (
                        <option key={field.id} value={field.id}>
                            {field.name}
                        </option>
                    ))}
                </select>
                {fieldsError ? <div className={styles.inlineHintError}>{fieldsError}</div> : null}
            </div>

            <div className={styles.inputGroup}>
                <label>Court của field đang chọn</label>
                <select
                    value={form.courtId}
                    disabled={!form.fieldId || loadingCourts || courts.length === 0}
                    onChange={(e) =>
                        setForm((current) => ({ ...current, courtId: e.target.value }))
                    }
                >
                    <option value=''>
                        {!form.fieldId
                            ? 'Chọn field trước'
                            : loadingCourts
                              ? 'Đang tải courts...'
                              : 'Chọn court'}
                    </option>
                    {courts.map((court) => (
                        <option key={court.id} value={court.id}>
                            {(court.name || `Court ${court.courtNumber}`)} - ID {court.id}
                        </option>
                    ))}
                </select>
                {courtsError ? <div className={styles.inlineHintError}>{courtsError}</div> : null}
            </div>

            <div className={styles.fullWidth}>
                <FieldSummaryCard
                    field={selectedField}
                    emptyText='Chưa có field nào để đăng ưu đãi.'
                    notice={
                        selectedCourt
                            ? `Đang chọn ${selectedCourt.name || `Court ${selectedCourt.courtNumber}`} · ${getCourtTemplateLabel(selectedCourt)}`
                            : 'Chọn một court thuộc đúng field để tải slot và ghi đè giá.'
                    }
                />
            </div>

            <div className={`${styles.fullWidth} ${styles.infoCard}`}>
                <div className={styles.infoTitle}>Courts của field đang chọn</div>
                {!form.fieldId ? (
                    <div className={styles.infoText}>Chọn field để xem courts.</div>
                ) : loadingCourts ? (
                    <div className={styles.infoText}>Đang tải courts...</div>
                ) : courtsError ? (
                    <div className={styles.inlineHintError}>{courtsError}</div>
                ) : courts.length === 0 ? (
                    <div className={styles.infoText}>Field này chưa có court nào.</div>
                ) : (
                    <div className={styles.courtList}>
                        {courts.map((court) => (
                            <button
                                className={`${styles.courtCard} ${
                                    String(court.id) === String(form.courtId)
                                        ? styles.courtCardActive
                                        : ''
                                }`}
                                key={court.id}
                                onClick={() =>
                                    setForm((current) => ({
                                        ...current,
                                        courtId: String(court.id)
                                    }))
                                }
                                type='button'
                            >
                                <div className={styles.courtCardTop}>
                                    <div className={styles.courtCardTitle}>
                                        {court.name || `Court ${court.courtNumber}`}
                                    </div>
                                    <span className={styles.courtStatusBadge}>
                                        {court.status || 'UNKNOWN'}
                                    </span>
                                </div>
                                <div className={styles.courtCardMeta}>
                                    <span>Court ID: {court.id}</span>
                                    <span>Số sân: {court.courtNumber ?? 'N/A'}</span>
                                    <span>{getCourtTemplateLabel(court)}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.inputGroup}>
                <label>Ngày áp dụng</label>
                <input
                    required
                    type='date'
                    value={form.date}
                    onChange={(e) =>
                        setForm((current) => ({ ...current, date: e.target.value }))
                    }
                />
            </div>

            <div className={styles.inputGroup}>
                <label>Giá mới (VND)</label>
                <input
                    required
                    type='number'
                    value={form.price}
                    onChange={(e) =>
                        setForm((current) => ({ ...current, price: e.target.value }))
                    }
                />
            </div>

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Chọn slot áp dụng ưu đãi</label>
                <div className={styles.slotPickerBox}>
                    {!form.courtId || !form.date ? (
                        <div className={styles.slotHint}>
                            Chọn court và ngày trước để tải danh sách slot.
                        </div>
                    ) : slotsLoading ? (
                        <div className={styles.slotHint}>Đang tải slot...</div>
                    ) : slotsError ? (
                        <div className={styles.slotError}>{slotsError}</div>
                    ) : slots.length === 0 ? (
                        <div className={styles.slotHint}>Court này chưa có khung giờ cho ngày đã chọn.</div>
                    ) : (
                        <div className={styles.slotList}>
                            {slots.map((slot) => {
                                const checked = selectedTimes.includes(slot?.startTime);
                                const hasOverride =
                                    slot?.overridePrice !== null &&
                                    slot?.overridePrice !== undefined &&
                                    Number(slot?.overridePrice) !== Number(slot?.price);

                                return (
                                    <label
                                        key={slot?.id || `${slot?.startTime}-${slot?.endTime}`}
                                        className={`${styles.slotOption} ${
                                            checked ? styles.slotOptionActive : ''
                                        }`}
                                    >
                                        <input
                                            type='checkbox'
                                            checked={checked}
                                            onChange={() => toggleSlotTime(slot)}
                                        />
                                        <div className={styles.slotOptionBody}>
                                            <div className={styles.slotOptionTop}>
                                                <span className={styles.slotOptionTime}>
                                                    {toShortTime(slot?.startTime)} -{' '}
                                                    {toShortTime(slot?.endTime)}
                                                </span>
                                                {hasOverride ? (
                                                    <span className={styles.slotBadge}>
                                                        Đang override
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className={styles.slotOptionMeta}>
                                                <span>{slot?.status || 'UNKNOWN'}</span>
                                                {formatSlotPrice(slot?.price) ? (
                                                    <span>
                                                        {formatSlotPrice(slot?.price)} VND
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className={styles.inlineHint}>
                    Submit sẽ gửi lên backend danh sách startTime của các slot được tick.
                </div>
            </div>

            <div className={`${styles.infoCard} ${styles.fullWidth}`}>
                <label className={styles.toggleRow}>
                    <input
                        type='checkbox'
                        checked={form.shouldPublishDeal}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                shouldPublishDeal: e.target.checked
                            }))
                        }
                    />
                    <span>Đăng bài ưu đãi luôn sau khi lưu giá</span>
                </label>

                {form.shouldPublishDeal ? (
                    <div className={styles.dealPreviewBox}>
                        <div className={styles.previewTitle}>Nội dung DEAL xem trước</div>
                        <textarea
                            rows={4}
                            className={styles.dealTextarea}
                            value={form.dealContent}
                            onChange={(e) =>
                                setForm((current) => ({
                                    ...current,
                                    dealContent: e.target.value
                                }))
                            }
                        />
                    </div>
                ) : null}
            </div>

            {dealStatus.msg ? (
                <div className={`${styles.msg} ${styles[dealStatus.type]}`}>
                    {dealStatus.msg}
                </div>
            ) : null}

            {!!form.courtId &&
            !!form.date &&
            !slotsLoading &&
            !slotsError &&
            !selectedTimes.length ? (
                <div className={`${styles.msg} ${styles.error}`}>
                    Chưa chọn slot nào để áp dụng ưu đãi.
                </div>
            ) : null}
        </FormShell>
    );
}
