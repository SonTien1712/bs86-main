import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateFieldMapStep from './CreateFieldMapStep';
import { reverseGeocodeNominatim } from '@services/geocodeService';
import { fieldsApi } from '@/api/fieldsApi';
import s from './CreateFieldPage.module.scss';

export default function CreateFieldPage() {
    const nav = useNavigate();

    const [address, setAddress] = useState(
        '12 Nguyễn Văn Linh, Hải Châu, Đà Nẵng'
    );
    const [pos, setPos] = useState({
        lat: 15.979296315818678,
        lng: 108.26131967151423
    });

    const latText = useMemo(() => (pos?.lat ?? '').toString(), [pos]);
    const lngText = useMemo(() => (pos?.lng ?? '').toString(), [pos]);

    const [loadingAddr, setLoadingAddr] = useState(false);
    const [creating, setCreating] = useState(false);

    const handleMyLocation = () => {
        if (!navigator.geolocation) {
            alert('Trình duyệt không hỗ trợ định vị.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (p) => {
                setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
            },
            () => alert('Không lấy được vị trí. Hãy cấp quyền location.'),
            { enableHighAccuracy: true }
        );
    };

    const handleGetAddressFromPin = async () => {
        try {
            setLoadingAddr(true);
            const text = await reverseGeocodeNominatim(pos.lat, pos.lng);
            if (text) setAddress(text);
        } catch (e) {
            console.error(e);
            alert('Không lấy được địa chỉ từ pin. Thử lại sau.');
        } finally {
            setLoadingAddr(false);
        }
    };

    const handleCreate = async () => {
        // bạn thay body theo BE của bạn
        const body = {
            fieldName: 'Sân mới',
            address,
            latitude: pos.lat,
            longitude: pos.lng,
            sportType: 'PICKLEBALL',
            landCertificateUrl: 'https://example.com/land.pdf',
            fieldImagesUrl: 'https://example.com/field.jpg'
        };

        try {
            setCreating(true);
            await fieldsApi.createField(body);
            alert('Tạo sân thành công!');
            nav('/home');
        } catch (e) {
            console.error(e);
            alert('Tạo sân thất bại. Kiểm tra token / API.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className={s.page}>
            <div className={s.left}>
                <div className={s.card}>
                    <div className={s.title}>Bước 2: Chọn vị trí sân</div>

                    <label className={s.label}>Địa chỉ</label>
                    <textarea
                        className={s.textarea}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                    />

                    <div className={s.row2}>
                        <div>
                            <label className={s.label}>Latitude</label>
                            <input
                                className={s.input}
                                value={latText}
                                readOnly
                            />
                        </div>
                        <div>
                            <label className={s.label}>Longitude</label>
                            <input
                                className={s.input}
                                value={lngText}
                                readOnly
                            />
                        </div>
                    </div>

                    <div className={s.btnRow}>
                        <button
                            className={s.btnGhost}
                            onClick={() => nav(-1)}
                            type='button'
                        >
                            ← Quay lại
                        </button>

                        <button
                            className={s.btnGhost}
                            onClick={handleMyLocation}
                            type='button'
                        >
                            📍 Vị trí của tôi
                        </button>
                    </div>

                    <div className={s.btnRow}>
                        <button
                            className={s.btnPrimaryOutline}
                            onClick={handleGetAddressFromPin}
                            disabled={loadingAddr}
                            type='button'
                        >
                            {loadingAddr
                                ? 'Đang lấy...'
                                : '🧾 Lấy địa chỉ từ pin'}
                        </button>

                        <button
                            className={s.btnPrimary}
                            onClick={handleCreate}
                            disabled={creating}
                            type='button'
                        >
                            {creating ? 'Đang tạo...' : 'Tạo sân'}
                        </button>
                    </div>

                    <div className={s.tip}>
                        Tip: Click vào bản đồ để đặt pin. Bạn có thể kéo pin để
                        chỉnh chính xác vị trí.
                    </div>
                </div>
            </div>

            <div className={s.right}>
                <CreateFieldMapStep
                    value={pos}
                    onChange={setPos}
                    allowClick
                    allowDrag
                />
            </div>
        </div>
    );
}
