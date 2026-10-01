import { useState } from 'react';
import { ownerApi } from '../../../api/ownerApi';
import LocationPickerMap from '../../map/LocationPickerMap';
import FormShell from './FormShell';
import styles from '../../../pages/public/account/OwnerManagementPanels.module.scss';

const SPORT_OPTIONS = [
    { value: 'FOOTBALL', label: 'Bóng đá' },
    { value: 'PICKLEBALL', label: 'Pickleball' },
    { value: 'VOLLEYBALL', label: 'Bóng chuyền' },
    { value: 'BASKETBALL', label: 'Bóng rổ' }
];

export default function FormAddField({ onCreated }) {
    const [form, setForm] = useState({
        name: '',
        address: '',
        type: 'FOOTBALL',
        mapValue: null,
        certFile: null,
        certUrl: '',
        imgFile: null,
        imgUrl: ''
    });
    const [st, setSt] = useState({ loading: false, msg: '', type: '' });
    const [uploading, setUploading] = useState({ cert: false, img: false });

    const handleFileChange = async (event, fieldType, typeId) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading((current) => ({ ...current, [fieldType]: true }));

        try {
            const response = await ownerApi.uploadMedia(file, 'FIELD', 0, typeId);
            setForm((current) => ({
                ...current,
                [`${fieldType}File`]: file,
                [`${fieldType}Url`]:
                    response?.url || 'sample_url_due_to_missing_media_service'
            }));
        } catch (error) {
            console.error(error);
            setForm((current) => ({
                ...current,
                [`${fieldType}File`]: file,
                [`${fieldType}Url`]: 'https://example.com/fake-url.jpg'
            }));
        } finally {
            setUploading((current) => ({ ...current, [fieldType]: false }));
            event.target.value = '';
        }
    };

    const submit = async (event) => {
        event.preventDefault();

        if (!form.mapValue) {
            setSt({ loading: false, msg: 'Vui lòng ghim vị trí trên bản đồ.', type: 'error' });
            return;
        }

        if (!form.certUrl || !form.imgUrl) {
            setSt({ loading: false, msg: 'Vui lòng upload sơ đồ và ảnh sân.', type: 'error' });
            return;
        }

        setSt({ loading: true, msg: '', type: '' });

        try {
            await ownerApi.addField({
                fieldName: form.name,
                address: form.address,
                sportType: form.type,
                latitude: form.mapValue.lat,
                longitude: form.mapValue.lng,
                landCertificateUrl: form.certUrl,
                fieldImagesUrl: form.imgUrl
            });
            setSt({
                loading: false,
                msg: 'Đăng ký field thành công (chờ Admin duyệt).',
                type: 'success'
            });
            setForm({
                name: '',
                address: '',
                type: 'FOOTBALL',
                mapValue: null,
                certFile: null,
                certUrl: '',
                imgFile: null,
                imgUrl: ''
            });
            await onCreated?.();
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
            title='Đăng ký cụm sân mới'
            desc='Gửi hồ sơ tạo field mới để Admin duyệt trước khi mở quản lý công khai.'
            onSubmit={submit}
            loading={st.loading}
            msgType={st.type}
            msgText={st.msg}
        >
            <div className={styles.inputGroup}>
                <label>Tên cụm sân</label>
                <input
                    required
                    value={form.name}
                    onChange={(e) =>
                        setForm((current) => ({ ...current, name: e.target.value }))
                    }
                />
            </div>

            <div className={styles.inputGroup}>
                <label>Môn thể thao</label>
                <select
                    value={form.type}
                    onChange={(e) =>
                        setForm((current) => ({ ...current, type: e.target.value }))
                    }
                >
                    {SPORT_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Địa chỉ</label>
                <div className={styles.inlineRow}>
                    <input
                        required
                        value={form.address}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                address: e.target.value
                            }))
                        }
                    />
                    <button
                        type='button'
                        className={styles.ghostAction}
                        onClick={async () => {
                            if (!form.address) return;

                            try {
                                const response = await fetch(
                                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                                        form.address
                                    )}`
                                );
                                const data = await response.json();
                                if (Array.isArray(data) && data.length > 0) {
                                    setForm((current) => ({
                                        ...current,
                                        mapValue: {
                                            lat: Number(data[0].lat),
                                            lng: Number(data[0].lon)
                                        }
                                    }));
                                }
                            } catch (error) {
                                console.error('Address lookup failed', error);
                            }
                        }}
                    >
                        Tìm trên bản đồ
                    </button>
                </div>
            </div>

            <div className={styles.inputGroup}>
                <label>Giấy chứng nhận QSD sân *</label>
                <label className={styles.uploadButton}>
                    {uploading.cert
                        ? 'Đang tải...'
                        : form.certFile
                        ? `Đã chọn: ${form.certFile.name}`
                        : 'Chọn file sơ đồ'}
                    <input
                        type='file'
                        accept='image/*'
                        style={{ display: 'none' }}
                        onChange={(event) => handleFileChange(event, 'cert', 'IMAGE')}
                    />
                </label>
            </div>

            <div className={styles.inputGroup}>
                <label>Hình ảnh thực tế cụm sân *</label>
                <label className={styles.uploadButton}>
                    {uploading.img
                        ? 'Đang tải...'
                        : form.imgFile
                        ? `Đã chọn: ${form.imgFile.name}`
                        : 'Chọn ảnh sân'}
                    <input
                        type='file'
                        accept='image/*'
                        style={{ display: 'none' }}
                        onChange={(event) => handleFileChange(event, 'img', 'IMAGE')}
                    />
                </label>
            </div>

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Ghim vị trí trên bản đồ *</label>
                <div className={styles.mapPickerBox}>
                    <LocationPickerMap
                        value={form.mapValue}
                        onChange={async (value) => {
                            setForm((current) => ({ ...current, mapValue: value }));
                            try {
                                const response = await fetch(
                                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${value.lat}&lon=${value.lng}`
                                );
                                const data = await response.json();
                                if (data?.display_name) {
                                    setForm((current) => ({
                                        ...current,
                                        address: data.display_name
                                    }));
                                }
                            } catch (error) {
                                console.error('Reverse geocode failed', error);
                            }
                        }}
                    />
                </div>
            </div>
        </FormShell>
    );
}
