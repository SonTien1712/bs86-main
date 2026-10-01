import { useEffect, useMemo, useState } from 'react';
import { ownerApi } from '../../../api/ownerApi';
import FormShell from './FormShell';
import FieldSummaryCard from './FieldSummaryCard';
import styles from '../../../pages/public/account/OwnerManagementPanels.module.scss';

const INITIAL_FORM = {
    fieldId: '',
    from: 1,
    to: 5
};

function getCourtTemplateLabel(court) {
    const weekday = court?.hasWeekdayTemplate ? 'Weekday OK' : 'Weekday chưa có';
    const weekend = court?.hasWeekendTemplate ? 'Weekend OK' : 'Weekend chưa có';
    return `${weekday} · ${weekend}`;
}

export default function FormAddCourts({ fields, loadingFields, fieldsError }) {
    const [form, setForm] = useState(INITIAL_FORM);
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

        if (!form.fieldId) {
            setSt({
                loading: false,
                msg: 'Vui lòng chọn field cần tạo courts.',
                type: 'error'
            });
            return;
        }

        setSt({ loading: true, msg: '', type: '' });

        try {
            await ownerApi.addCourts(Number(form.fieldId), Number(form.from), Number(form.to));

            const nextCourts = await ownerApi.getFieldCourts(Number(form.fieldId));
            setCourts(Array.isArray(nextCourts) ? nextCourts : []);

            setSt({
                loading: false,
                msg: 'Đã tạo courts và tải lại đúng danh sách court của field đang chọn.',
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
            title='Tạo courts (sân lẻ) cho field'
            desc='Chọn field của bạn, tạo thêm courts, sau đó UI sẽ tải lại đúng danh sách court của field đó.'
            onSubmit={submit}
            loading={st.loading}
            msgType={st.type}
            msgText={st.msg}
        >
            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
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

            <div className={styles.fullWidth}>
                <FieldSummaryCard field={selectedField} emptyText='Chưa có field nào để tạo courts.' />
            </div>

            <div className={styles.inputGroup}>
                <label>Từ court số</label>
                <input
                    min='1'
                    required
                    type='number'
                    value={form.from}
                    onChange={(e) =>
                        setForm((current) => ({ ...current, from: e.target.value }))
                    }
                />
            </div>

            <div className={styles.inputGroup}>
                <label>Đến court số</label>
                <input
                    min='1'
                    required
                    type='number'
                    value={form.to}
                    onChange={(e) =>
                        setForm((current) => ({ ...current, to: e.target.value }))
                    }
                />
            </div>

            <div className={`${styles.fullWidth} ${styles.infoCard}`}>
                <div className={styles.infoTitle}>Danh sách courts của field đang chọn</div>

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
                            <div className={styles.courtCard} key={court.id}>
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
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </FormShell>
    );
}
