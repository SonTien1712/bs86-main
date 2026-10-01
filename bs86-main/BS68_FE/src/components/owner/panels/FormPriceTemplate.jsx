import { useEffect, useMemo, useState } from 'react';
import { ownerApi } from '../../../api/ownerApi';
import FormShell from './FormShell';
import FieldSummaryCard from './FieldSummaryCard';
import styles from '../../../pages/public/account/OwnerManagementPanels.module.scss';

const INITIAL_TEMPLATE_FORM = {
    fieldId: '',
    courtId: '',
    dayType: 'WEEKDAY',
    openTime: '06:00',
    closeTime: '22:00',
    duration: 60,
    price: 100000
};

function getTemplateSummary(court) {
    const badges = [];
    badges.push(court?.hasWeekdayTemplate ? 'Weekday OK' : 'Weekday chưa có');
    badges.push(court?.hasWeekendTemplate ? 'Weekend OK' : 'Weekend chưa có');
    return badges.join(' | ');
}

export default function FormPriceTemplate({ fields, loadingFields, fieldsError }) {
    const [form, setForm] = useState(INITIAL_TEMPLATE_FORM);
    const [courts, setCourts] = useState([]);
    const [loadingCourts, setLoadingCourts] = useState(false);
    const [courtsError, setCourtsError] = useState('');
    const [st, setSt] = useState({ loading: false, msg: '', type: '' });

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
            setForm((current) => ({
                ...INITIAL_TEMPLATE_FORM,
                fieldId: current.fieldId
            }));
            setSt({ loading: false, msg: '', type: '' });

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

    const submit = async (event) => {
        event.preventDefault();

        if (!form.fieldId || !form.courtId) {
            setSt({
                loading: false,
                msg: 'Vui lòng chọn court thuộc đúng field đang chọn.',
                type: 'error'
            });
            return;
        }

        setSt({ loading: true, msg: '', type: '' });

        try {
            await ownerApi.addPriceTemplate(Number(form.fieldId), Number(form.courtId), {
                dayType: form.dayType,
                openTime: form.openTime,
                closeTime: form.closeTime,
                slotMinutes: Number(form.duration),
                basePrice: Number(form.price)
            });

            const nextCourts = await ownerApi.getFieldCourts(Number(form.fieldId));
            setCourts(Array.isArray(nextCourts) ? nextCourts : []);

            if (!nextCourts.some((court) => String(court.id) === String(form.courtId))) {
                setForm((current) => ({ ...current, courtId: '' }));
            }

            setSt({
                loading: false,
                msg: 'Đã lưu template vào đúng court của field đang chọn.',
                type: 'success'
            });
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
            title='Cấu hình bảng giá / template'
            desc='Danh sách court được fetch theo field đang chọn. Lưu template sẽ gửi đúng fieldId + courtId để tránh lưu nhầm vào court cũ.'
            onSubmit={submit}
            loading={st.loading}
            msgType={st.type}
            msgText={st.msg}
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
                    emptyText='Chưa có field nào để cấu hình bảng giá.'
                    notice={
                        selectedCourt
                            ? `Đang chọn ${selectedCourt.name || `Court ${selectedCourt.courtNumber}`} | ${getTemplateSummary(selectedCourt)}`
                            : 'Chọn một court thuộc đúng field để lưu template.'
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
                                    <span>{getTemplateSummary(court)}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.inputGroup}>
                <label>Loại ngày</label>
                <select
                    value={form.dayType}
                    onChange={(e) =>
                        setForm((current) => ({ ...current, dayType: e.target.value }))
                    }
                >
                    <option value='WEEKDAY'>Ngày thường (T2 - T6)</option>
                    <option value='WEEKEND'>Cuối tuần (T7 - CN)</option>
                    <option value='HOLIDAY'>Ngày lễ</option>
                </select>
            </div>

            <div className={styles.inputGroup}>
                <label>Phút / ca thuê</label>
                <select
                    value={form.duration}
                    onChange={(e) =>
                        setForm((current) => ({ ...current, duration: e.target.value }))
                    }
                >
                    <option value={15}>15 phút</option>
                    <option value={30}>30 phút</option>
                    <option value={45}>45 phút</option>
                    <option value={60}>60 phút</option>
                    <option value={90}>90 phút</option>
                    <option value={120}>120 phút</option>
                </select>
            </div>

            <div className={styles.inputGroup}>
                <label>Giờ mở cửa</label>
                <input
                    required
                    type='time'
                    value={form.openTime}
                    onChange={(e) =>
                        setForm((current) => ({ ...current, openTime: e.target.value }))
                    }
                />
            </div>

            <div className={styles.inputGroup}>
                <label>Giờ đóng cửa</label>
                <input
                    required
                    type='time'
                    value={form.closeTime}
                    onChange={(e) =>
                        setForm((current) => ({ ...current, closeTime: e.target.value }))
                    }
                />
            </div>

            <div className={styles.inputGroup}>
                <label>Giá mặc định (VND)</label>
                <input
                    required
                    type='number'
                    value={form.price}
                    onChange={(e) =>
                        setForm((current) => ({ ...current, price: e.target.value }))
                    }
                />
            </div>
        </FormShell>
    );
}
