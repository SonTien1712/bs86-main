import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import { getAccountLandingRoute, parseAuthFromToken } from '../../../utils/auth';
import { getServerOrigin } from '../../../config/runtime';

import BookingTypeModal from '../../../components/booking/BookingTypeModal';
// ✅ Demo fallback nếu BE lỗi / chưa có data
const demoCourts = [
    {
        id: 1,
        name: 'Viễn Đông Pickleball Nha Trang',
        address: '65 Lê Thành Tôn, Lộc Thọ, Nha Trang, Khánh Hoà',
        distance: '380.4m',
        time: '05:00 - 23:00',
        image: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?q=80&w=1200&auto=format&fit=crop',
        tag1: 'Đơn ngày',
        tag2: 'Sự kiện',
        rating: 5
    },
    {
        id: 2,
        name: 'Pickleball Sư Đoàn 305',
        address: 'Khách sạn Regalia, 39 Nguyễn Thị Minh Khai',
        distance: '476.2m',
        time: '05:00 - 23:00',
        image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop',
        tag1: 'Đơn ngày',
        tag2: 'Sự kiện',
        rating: 5
    },
    {
        id: 3,
        name: 'Đa Quốc Pickleball',
        address: '75 Nguyễn Thị Minh Khai, Tân Tiến, Nha Trang',
        distance: '942.7m',
        time: '06:00 - 23:00',
        image: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?q=80&w=1200&auto=format&fit=crop',
        tag1: 'Đơn ngày',
        tag2: 'Sự kiện',
        rating: 5
    },
    {
        id: 4,
        name: 'Sân Pickleball Trung Tâm Đà Nẵng',
        address: '123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
        distance: '1.2km',
        time: '05:30 - 22:30',
        image: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?q=80&w=1200&auto=format&fit=crop',
        tag1: 'Đơn ngày',
        tag2: 'Giải đấu',
        rating: 4.8
    }
];

// Tabs bottom
const bottomTabs = [
    { key: 'home', label: 'Trang chủ', icon: '🏠' },
    { key: 'map', label: 'Bản đồ', icon: '🗺️' },
    { key: 'explore', label: 'Khám phá', icon: '🧭' },
    { key: 'hot', label: 'Nổi bật', icon: '🔥' },
    { key: 'account', label: 'Tài khoản', icon: '👤' }
];

// Tabs môn thể thao (trên header)
const sportTabs = [
    { key: 'PICKLEBALL', label: 'Pickleball', icon: '🏓' },
    { key: 'FOOTBALL', label: 'Bóng đá', icon: '⚽' },
    { key: 'VOLLEYBALL', label: 'Bóng chuyền', icon: '🏐' },
    { key: 'BASKETBALL', label: 'Bóng rổ', icon: '🏀' }
];

// ✅ API base
const API_BASE = getServerOrigin();

// ✅ Map API key -> enum/string bên BE nếu bạn muốn filter
// (Nếu BE chưa hỗ trợ filter type thì tạm không dùng)
const SPORT_TO_BE = {
    pickleball: 'PICKLEBALL',
    badminton: 'BADMINTON',
    football: 'FOOTBALL',
    tennis: 'TENNIS',
    volleyball: 'VOLLEYBALL'
};

// ✅ Helper tạo bbox mặc định (HCM) để gọi /api/public/fields/map
function defaultBoxHCM() {
    // quanh TP.HCM
    return {
        minLat: 10.7,
        maxLat: 10.9,
        minLng: 106.55,
        maxLng: 106.8
    };
}

// ✅ Helper convert field marker -> card UI
function toCard(item, sportKey) {
    return {
        id: item.id,
        name: item.name ?? 'Sân',
        address: item.address ?? 'Chưa có địa chỉ',
        distance: '',
        time: '05:00 - 23:00', // bạn có thể thay bằng data thật sau
        image: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?q=80&w=1200&auto=format&fit=crop',
        tag1: 'Đơn ngày',
        tag2: 'Sự kiện',
        rating: 5,
        sportKey,
        latitude: item.latitude,
        longitude: item.longitude
    };
}

export default function HomePage() {
    const nav = useNavigate();
    const auth = parseAuthFromToken();

    const [query, setQuery] = useState('');
    const [activeBottom, setActiveBottom] = useState('home');
    const [sportType, setSportType] = useState('pickleball');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [items, setItems] = useState([]); // data thật từ BE

    //booking modal
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedCourt, setSelectedCourt] = useState('');

    const openMapForCourt = (court) => {
        nav('/map', {
            state: {
                focusField: {
                    id: court.id,
                    name: court.name,
                    address: court.address,
                    latitude: court.latitude,
                    longitude: court.longitude,
                    sportType: court.sportKey
                }
            }
        });
    };

    // ✅ Load data từ BE
    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            setLoading(true);
            setError('');

            try {
                // OPTION 1: dùng endpoint bạn đã có: GET /api/public/fields/map?minLat..maxLng
                // (home list sẽ hiện sân trong bbox mặc định)
                const box = defaultBoxHCM();

                // Nếu BE sau này hỗ trợ filter type, bạn có thể thêm &type=...
                // const type = SPORT_TO_BE[sportType];

                const url =
                    `${API_BASE}/api/public/fields/map` +
                    `?minLat=${box.minLat}&maxLat=${box.maxLat}&minLng=${box.minLng}&maxLng=${box.maxLng}`;

                const res = await fetch(url, { signal: controller.signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                const arr = Array.isArray(data) ? data : [];
                setItems(arr.map((x) => toCard(x, sportType)));
            } catch (e) {
                if (e?.name === 'AbortError') return;
                setError(e?.message || 'Không load được dữ liệu');
                // fallback demo
                setItems(demoCourts);
            } finally {
                setLoading(false);
            }
        }

        load();
        return () => controller.abort();
    }, [sportType]);

    // Filter theo search
    const list = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter(
            (x) =>
                (x.name || '').toLowerCase().includes(q) ||
                (x.address || '').toLowerCase().includes(q)
        );
    }, [query, items]);

    const goBottomTab = (key) => {
        setActiveBottom(key);
        if (key === 'map') nav('/map', { state: { autoLocate: true } });
        if (key === 'explore') nav('/explore');
        if (key === 'account') nav(getAccountLandingRoute(auth));
    };

    return (
        <div className='homeShell'>
            {/* Top header */}
            <div className='homeHeader'>
                <div className='homeHeaderRow'>
                    <div className='dateLine'>
                        {new Date().toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        })}
                    </div>
                    <button className='favDot' title='Yêu thích'>
                        ★
                    </button>
                </div>

                <div className='authButtons'>
                    <button className='authBtn' onClick={() => nav('/auth')}>
                        Đăng nhập
                    </button>
                    <button
                        className='authBtn primary'
                        onClick={() => nav('/auth')}
                    >
                        Đăng kí
                    </button>
                </div>

                {/* Sport tabs (giống ảnh dạng nút) */}
                <div className='sportRow'>
                    {sportTabs.map((s) => (
                        <button
                            key={s.key}
                            className={`sportChip ${sportType === s.key ? 'active' : ''}`}
                            onClick={() => setSportType(s.key)}
                        >
                            <span className='sportIcon' aria-hidden='true'>
                                {s.icon}
                            </span>
                            <span className='sportText'>{s.label}</span>
                        </button>
                    ))}
                </div>

                <div className='searchBar'>
                    <div className='searchLeft'>
                        <span className='searchIcon' aria-hidden='true'>
                            🔎
                        </span>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder='Tìm kiếm'
                        />
                    </div>

                    <div className='searchRight'>
                        <button
                            className='chipTop'
                            onClick={() => nav('/map', { state: { autoLocate: true } })}
                        >
                            🗺️ <span>Bản đồ</span>
                        </button>
                        <button className='chipTop'>
                            ✅ <span>Sân đã đặt</span>
                        </button>
                        <button className='chipTop'>
                            ❤ <span>Yêu thích</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className='homeContent'>
                {loading && (
                    <div className='homeNotice'>Đang tải danh sách sân…</div>
                )}

                {!loading && error && (
                    <div className='homeNotice warn'>
                        Không load được từ BE: <b>{error}</b> — đang hiển thị
                        demo.
                    </div>
                )}

                <div className='grid3'>
                    {list.map((c) => (
                        <div key={c.id} className='courtCard'>
                            <div
                                className='cardCover'
                                style={{ backgroundImage: `url(${c.image})` }}
                            >
                                <div className='tagRow'>
                                    <span className='starTag'>
                                        ★ {c.rating}
                                    </span>
                                    <span className='pill green'>{c.tag1}</span>
                                    <span className='pill pink'>{c.tag2}</span>
                                </div>

                                <div className='cardActions'>
                                    <button
                                        className='iconRound'
                                        title='Yêu thích'
                                    >
                                        ♡
                                    </button>
                                    <button
                                        className='iconRound'
                                        title='Chia sẻ'
                                    >
                                        ⤴
                                    </button>
                                </div>
                            </div>

                            <div className='cardBody'>
                                <div className='cardTitleRow'>
                                    <div className='avatar'>
                                        {sportTabs.find(
                                            (x) => x.key === sportType
                                        )?.icon ?? '🏟️'}
                                    </div>

                                    <div className='titleWrap'>
                                        <div className='name'>{c.name}</div>
                                        <div className='metaLine'>
                                            {c.distance ? (
                                                <span className='distance'>
                                                    ({c.distance})
                                                </span>
                                            ) : null}{' '}
                                            <span className='addr'>
                                                {c.address}
                                            </span>
                                        </div>
                                        <div className='timeLine'>
                                            🕒 {c.time}
                                        </div>
                                    </div>

                                    <div className='cardButtonStack'>
                                        <button
                                            className='mapBtn'
                                            onClick={() => openMapForCourt(c)}
                                            type='button'
                                        >
                                            XEM BẢN ĐỒ
                                        </button>
                                        <button
                                            className='bookBtn'
                                            onClick={() => {
                                                setSelectedCourt(c.id);
                                                setShowBookingModal(true);
                                            }}
                                            type='button'
                                        >
                                            ĐẶT LỊCH
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Floating center */}
                <button className='floatingCenter' title='Khám phá'>
                    🧾
                </button>
            </div>

            {/* Bottom nav */}
            <div className='bottomNav'>
                {bottomTabs.map((t) => (
                    <button
                        key={t.key}
                        className={`navItem ${activeBottom === t.key ? 'active' : ''}`}
                        onClick={() => goBottomTab(t.key)}
                    >
                        <div className='navIcon'>{t.icon}</div>
                        <div className='navLabel'>{t.label}</div>
                    </button>
                ))}
            </div>
            <BookingTypeModal
                open={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                onVisual={() => {
                    setShowBookingModal(false);
                    nav(`/booking/${selectedCourt}`);
                }}
            />
        </div>
    );
}
