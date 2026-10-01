import { useEffect, useMemo, useState } from 'react';
import { ownerApi } from '../../api/ownerApi';
import { SPORT_TYPES, getSportLabel } from '../../constants/sportTypes';
import LocationPickerMap from '../map/LocationPickerMap';
import styles from './FormManageFields.module.scss';

const EMPTY_BASIC_FORM = {
    fieldName: '',
    address: '',
    sportType: 'FOOTBALL',
    latitude: '',
    longitude: ''
};

const EMPTY_DETAIL_FORM = {
    description: '',
    phone: '',
    openingHours: '',
    bookingPolicy: '',
    coverImageUrl: ''
};

function getStatusLabel(status) {
    switch (status) {
        case 'ACTIVE':
            return 'Đang hoạt động';
        case 'PENDING_VERIFICATION':
            return 'Chờ duyệt';
        case 'INACTIVE':
            return 'Tạm ngưng';
        default:
            return status || 'Không rõ';
    }
}

function normalizeBasicForm(field) {
    return {
        fieldName: field?.name ?? '',
        address: field?.address ?? '',
        sportType: field?.sportType ?? 'FOOTBALL',
        latitude:
            field?.latitude === null || field?.latitude === undefined
                ? ''
                : String(field.latitude),
        longitude:
            field?.longitude === null || field?.longitude === undefined
                ? ''
                : String(field.longitude)
    };
}

function normalizeDetailForm(field) {
    return {
        description: field?.description ?? '',
        phone: field?.phone ?? '',
        openingHours: field?.openingHours ?? '',
        bookingPolicy: field?.bookingPolicy ?? '',
        coverImageUrl: field?.coverImageUrl ?? ''
    };
}

function uploadResultUrl(response) {
    return response?.url || response?.data?.url || '';
}

export default function FormManageFields() {
    const [fields, setFields] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [selectedField, setSelectedField] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [basicForm, setBasicForm] = useState(EMPTY_BASIC_FORM);
    const [detailForm, setDetailForm] = useState(EMPTY_DETAIL_FORM);
    const [savingBasic, setSavingBasic] = useState(false);
    const [savingDetail, setSavingDetail] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [deletingField, setDeletingField] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const sportOptions = useMemo(() => SPORT_TYPES, []);
    const mapValue = useMemo(() => {
        if (!basicForm.latitude || !basicForm.longitude) return null;

        return {
            lat: Number(basicForm.latitude),
            lng: Number(basicForm.longitude)
        };
    }, [basicForm.latitude, basicForm.longitude]);

    async function loadFields(preferredSelectedId) {
        setLoadingList(true);
        setErrorMsg('');

        try {
            const data = await ownerApi.getMyFields();
            const nextFields = Array.isArray(data) ? data : [];
            setFields(nextFields);

            const resolvedSelectedId =
                preferredSelectedId ?? selectedFieldId ?? nextFields[0]?.id ?? null;

            setSelectedFieldId(resolvedSelectedId);
        } catch (error) {
            setFields([]);
            setSelectedFieldId(null);
            setErrorMsg(
                error?.response?.data?.message ||
                    error?.message ||
                    'Không tải được danh sách field.'
            );
        } finally {
            setLoadingList(false);
        }
    }

    useEffect(() => {
        loadFields();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedFieldId) {
            setSelectedField(null);
            setBasicForm(EMPTY_BASIC_FORM);
            setDetailForm(EMPTY_DETAIL_FORM);
            return;
        }

        let cancelled = false;

        async function loadDetail() {
            setLoadingDetail(true);
            setErrorMsg('');

            try {
                const data = await ownerApi.getMyFieldDetail(selectedFieldId);
                if (cancelled) return;

                setSelectedField(data);
                setBasicForm(normalizeBasicForm(data));
                setDetailForm(normalizeDetailForm(data));
            } catch (error) {
                if (cancelled) return;

                setSelectedField(null);
                setErrorMsg(
                    error?.response?.data?.message ||
                        error?.message ||
                        'Không tải được chi tiết field.'
                );
            } finally {
                if (!cancelled) {
                    setLoadingDetail(false);
                }
            }
        }

        loadDetail();

        return () => {
            cancelled = true;
        };
    }, [selectedFieldId]);

    function resetMessages() {
        setErrorMsg('');
        setSuccessMsg('');
    }

    function handleBasicChange(key, value) {
        resetMessages();
        setBasicForm((current) => ({
            ...current,
            [key]: value
        }));
    }

    function handleDetailChange(key, value) {
        resetMessages();
        setDetailForm((current) => ({
            ...current,
            [key]: value
        }));
    }

    function handleMapChange(value) {
        resetMessages();
        setBasicForm((current) => ({
            ...current,
            latitude: String(value.lat),
            longitude: String(value.lng)
        }));
    }

    async function handleUploadCover(event) {
        const file = event.target.files?.[0];
        if (!file || !selectedFieldId) return;

        setUploadingCover(true);
        resetMessages();

        try {
            const response = await ownerApi.uploadMedia(file, 'FIELD', selectedFieldId, 'IMAGE');
            const url = uploadResultUrl(response);

            if (!url) {
                throw new Error('Upload ảnh thành công nhưng không nhận được URL.');
            }

            setDetailForm((current) => ({
                ...current,
                coverImageUrl: url
            }));
            setSuccessMsg('Đã upload ảnh cover. Nhấn lưu thông tin chi tiết để cập nhật field.');
        } catch (error) {
            setErrorMsg(
                error?.response?.data?.message ||
                    error?.message ||
                    'Upload ảnh cover thất bại.'
            );
        } finally {
            setUploadingCover(false);
            event.target.value = '';
        }
    }

    async function handleSaveBasic() {
        if (!selectedFieldId) return;

        if (!basicForm.fieldName.trim()) {
            setErrorMsg('Tên field không được để trống.');
            return;
        }

        if (!basicForm.address.trim()) {
            setErrorMsg('Địa chỉ không được để trống.');
            return;
        }

        const latitude = Number(basicForm.latitude);
        const longitude = Number(basicForm.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            setErrorMsg('Latitude và longitude phải là số hợp lệ.');
            return;
        }

        setSavingBasic(true);
        resetMessages();

        try {
            const updated = await ownerApi.updateField(selectedFieldId, {
                fieldName: basicForm.fieldName.trim(),
                address: basicForm.address.trim(),
                sportType: basicForm.sportType,
                latitude,
                longitude
            });

            setSelectedField((current) => ({
                ...(current ?? {}),
                ...updated
            }));
            setSuccessMsg('Đã cập nhật thông tin cơ bản của field.');
            await loadFields(selectedFieldId);
        } catch (error) {
            setErrorMsg(
                error?.response?.data?.message ||
                    error?.message ||
                    'Cập nhật thông tin cơ bản thất bại.'
            );
        } finally {
            setSavingBasic(false);
        }
    }

    async function handleSaveDetail() {
        if (!selectedFieldId) return;

        setSavingDetail(true);
        resetMessages();

        try {
            const updated = await ownerApi.updateFieldDetail(selectedFieldId, {
                description: detailForm.description.trim(),
                phone: detailForm.phone.trim(),
                openingHours: detailForm.openingHours.trim(),
                bookingPolicy: detailForm.bookingPolicy.trim(),
                coverImageUrl: detailForm.coverImageUrl.trim()
            });

            setSelectedField((current) => ({
                ...(current ?? {}),
                ...updated
            }));
            setSuccessMsg('Đã cập nhật thông tin chi tiết của field.');
            await loadFields(selectedFieldId);
        } catch (error) {
            setErrorMsg(
                error?.response?.data?.message ||
                    error?.message ||
                    'Cập nhật thông tin chi tiết thất bại.'
            );
        } finally {
            setSavingDetail(false);
        }
    }

    async function handleDeleteField() {
        if (!selectedFieldId || !selectedField) return;

        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa field "${selectedField.name}" không?`
        );
        if (!confirmed) return;

        setDeletingField(true);
        resetMessages();

        try {
            await ownerApi.deleteField(selectedFieldId);
            setSuccessMsg('Đã xóa field thành công.');
            setSelectedField(null);
            setBasicForm(EMPTY_BASIC_FORM);
            setDetailForm(EMPTY_DETAIL_FORM);
            await loadFields(null);
        } catch (error) {
            setErrorMsg(
                error?.response?.data?.message ||
                    error?.message ||
                    'Xóa field thất bại.'
            );
        } finally {
            setDeletingField(false);
        }
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.header}>
                <div>
                    <div className={styles.title}>Quản lý field của owner</div>
                    <div className={styles.subtitle}>
                        Chỉnh sửa đầy đủ thông tin cơ bản, vị trí map và phần chi tiết của từng field.
                    </div>
                </div>
            </div>

            {errorMsg ? <div className={`${styles.message} ${styles.error}`}>{errorMsg}</div> : null}
            {successMsg ? (
                <div className={`${styles.message} ${styles.success}`}>{successMsg}</div>
            ) : null}

            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarTitle}>Danh sách field</div>

                    {loadingList ? (
                        <div className={styles.stateCard}>Đang tải danh sách field...</div>
                    ) : null}

                    {!loadingList && fields.length === 0 ? (
                        <div className={styles.stateCard}>Bạn chưa có field nào để quản lý.</div>
                    ) : null}

                    {!loadingList && fields.length > 0 ? (
                        <div className={styles.fieldList}>
                            {fields.map((field) => {
                                const isActive = field.id === selectedFieldId;

                                return (
                                    <button
                                        className={`${styles.fieldCard} ${isActive ? styles.fieldCardActive : ''}`}
                                        key={field.id}
                                        onClick={() => {
                                            resetMessages();
                                            setSelectedFieldId(field.id);
                                        }}
                                        type='button'
                                    >
                                        <div className={styles.fieldCardHeader}>
                                            <div className={styles.fieldCardTitle}>{field.name}</div>
                                            <span className={styles.statusBadge}>
                                                {getStatusLabel(field.status)}
                                            </span>
                                        </div>

                                        <div className={styles.fieldCardMeta}>
                                            {getSportLabel(field.sportType)}
                                        </div>
                                        <div className={styles.fieldCardAddress}>{field.address}</div>
                                        <div className={styles.fieldCardFooter}>
                                            <span>Slug: {field.slug || 'Chưa có'}</span>
                                            <span>{field.openingHours || 'Chưa có giờ mở cửa'}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : null}
                </aside>

                <section className={styles.editor}>
                    {!selectedFieldId ? (
                        <div className={styles.stateCard}>
                            Chọn một field ở cột bên trái để xem và chỉnh sửa thông tin.
                        </div>
                    ) : null}

                    {selectedFieldId && loadingDetail ? (
                        <div className={styles.stateCard}>Đang tải chi tiết field...</div>
                    ) : null}

                    {selectedFieldId && !loadingDetail && selectedField ? (
                        <div className={styles.editorStack}>
                            <div className={styles.summaryCard}>
                                <div>
                                    <div className={styles.summaryLabel}>Field đang chọn</div>
                                    <h3>{selectedField.name}</h3>
                                    <p>{selectedField.address}</p>
                                </div>

                                <div className={styles.summaryMeta}>
                                    <span>{getSportLabel(selectedField.sportType)}</span>
                                    <span>{getStatusLabel(selectedField.status)}</span>
                                    <span>Slug: {selectedField.slug || 'Chưa có'}</span>
                                </div>
                            </div>

                            <div className={styles.editorCard}>
                                <div className={styles.sectionHeader}>
                                    <div>
                                        <div className={styles.sectionLabel}>Thông tin cơ bản</div>
                                        <h4>Basic info + vị trí</h4>
                                    </div>

                                    <button
                                        className={styles.primaryButton}
                                        disabled={savingBasic}
                                        onClick={handleSaveBasic}
                                        type='button'
                                    >
                                        {savingBasic ? 'Đang lưu...' : 'Lưu thông tin cơ bản'}
                                    </button>
                                </div>

                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup}>
                                        <label>Tên field</label>
                                        <input
                                            onChange={(event) =>
                                                handleBasicChange('fieldName', event.target.value)
                                            }
                                            value={basicForm.fieldName}
                                        />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>Slug</label>
                                        <input readOnly value={selectedField.slug || 'Slug do backend quản lý'} />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>Môn thể thao</label>
                                        <select
                                            onChange={(event) =>
                                                handleBasicChange('sportType', event.target.value)
                                            }
                                            value={basicForm.sportType}
                                        >
                                            {sportOptions.map((item) => (
                                                <option key={item.key} value={item.key}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>Trạng thái</label>
                                        <input readOnly value={getStatusLabel(selectedField.status)} />
                                    </div>

                                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                        <label>Địa chỉ</label>
                                        <input
                                            onChange={(event) =>
                                                handleBasicChange('address', event.target.value)
                                            }
                                            value={basicForm.address}
                                        />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>Latitude</label>
                                        <input
                                            onChange={(event) =>
                                                handleBasicChange('latitude', event.target.value)
                                            }
                                            type='number'
                                            value={basicForm.latitude}
                                        />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>Longitude</label>
                                        <input
                                            onChange={(event) =>
                                                handleBasicChange('longitude', event.target.value)
                                            }
                                            type='number'
                                            value={basicForm.longitude}
                                        />
                                    </div>

                                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                        <label>Chọn lại vị trí trên bản đồ</label>
                                        <div className={styles.mapBox}>
                                            <LocationPickerMap onChange={handleMapChange} value={mapValue} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.editorCard}>
                                <div className={styles.sectionHeader}>
                                    <div>
                                        <div className={styles.sectionLabel}>Thông tin chi tiết</div>
                                        <h4>Detail info + cover image</h4>
                                    </div>

                                    <button
                                        className={styles.primaryButton}
                                        disabled={savingDetail}
                                        onClick={handleSaveDetail}
                                        type='button'
                                    >
                                        {savingDetail ? 'Đang lưu...' : 'Lưu thông tin chi tiết'}
                                    </button>
                                </div>

                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup}>
                                        <label>Số điện thoại</label>
                                        <input
                                            onChange={(event) =>
                                                handleDetailChange('phone', event.target.value)
                                            }
                                            value={detailForm.phone}
                                        />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>Giờ mở cửa</label>
                                        <input
                                            onChange={(event) =>
                                                handleDetailChange('openingHours', event.target.value)
                                            }
                                            placeholder='VD: 06:00 - 23:00'
                                            value={detailForm.openingHours}
                                        />
                                    </div>

                                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                        <label>Mô tả sân</label>
                                        <textarea
                                            onChange={(event) =>
                                                handleDetailChange('description', event.target.value)
                                            }
                                            rows={4}
                                            value={detailForm.description}
                                        />
                                    </div>

                                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                        <label>Chính sách đặt sân</label>
                                        <textarea
                                            onChange={(event) =>
                                                handleDetailChange('bookingPolicy', event.target.value)
                                            }
                                            rows={4}
                                            value={detailForm.bookingPolicy}
                                        />
                                    </div>

                                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                        <label>Cover image URL</label>
                                        <input
                                            onChange={(event) =>
                                                handleDetailChange('coverImageUrl', event.target.value)
                                            }
                                            placeholder='https://...'
                                            value={detailForm.coverImageUrl}
                                        />
                                    </div>

                                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                        <label>Upload cover image</label>
                                        <div className={styles.uploadRow}>
                                            <label className={styles.uploadButton}>
                                                {uploadingCover ? 'Đang upload...' : 'Chọn ảnh cover'}
                                                <input
                                                    accept='image/*'
                                                    onChange={handleUploadCover}
                                                    style={{ display: 'none' }}
                                                    type='file'
                                                />
                                            </label>
                                            <div className={styles.uploadHint}>
                                                Upload xong sẽ tự điền `coverImageUrl`, sau đó anh chỉ cần lưu phần detail.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {detailForm.coverImageUrl ? (
                                    <div className={styles.previewCard}>
                                        <div className={styles.previewLabel}>Preview cover</div>
                                        <img
                                            alt={selectedField.name}
                                            className={styles.previewImage}
                                            src={detailForm.coverImageUrl}
                                        />
                                    </div>
                                ) : null}
                            </div>

                            <div className={styles.dangerZone}>
                                <div>
                                    <div className={styles.sectionLabel}>Danger zone</div>
                                    <h4>Xóa field</h4>
                                    <p>
                                        Thao tác này sẽ xóa field khỏi danh sách quản lý của owner.
                                    </p>
                                </div>

                                <button
                                    className={styles.dangerButton}
                                    disabled={deletingField}
                                    onClick={handleDeleteField}
                                    type='button'
                                >
                                    {deletingField ? 'Đang xóa...' : 'Xóa field'}
                                </button>
                            </div>
                        </div>
                    ) : null}
                </section>
            </div>
        </div>
    );
}
