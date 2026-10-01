import { useEffect, useState } from 'react';

export const SPORT_FILTERS = [
    { key: 'ALL', label: 'Tất cả', shortLabel: 'Tất cả', icon: '◎', color: '#334155' },
    { key: 'PICKLEBALL', label: 'Sân pickleball', shortLabel: 'Pickleball', icon: 'P', color: '#3b82f6' },
    { key: 'BADMINTON', label: 'Sân cầu lông', shortLabel: 'Cầu lông', icon: 'B', color: '#10b981' },
    { key: 'FOOTBALL', label: 'Sân bóng đá', shortLabel: 'Bóng đá', icon: 'F', color: '#16a34a' },
    { key: 'TENNIS', label: 'Sân tennis', shortLabel: 'Tennis', icon: 'T', color: '#d97706' },
    { key: 'VOLLEYBALL', label: 'Sân bóng chuyền', shortLabel: 'Bóng chuyền', icon: 'V', color: '#eab308' },
    { key: 'BASKETBALL', label: 'Sân bóng rổ', shortLabel: 'Bóng rổ', icon: 'R', color: '#f97316' }
];

export const DEFAULT_CENTER = [10.7769, 106.7009];
export const DEFAULT_SEARCH_PLACEHOLDER = 'Tìm kiếm sân quanh đây';
export const DEFAULT_NEARBY_LIMIT = 8;
export const FALLBACK_IMAGE =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#0f766e"/>
                    <stop offset="100%" stop-color="#1d4ed8"/>
                </linearGradient>
            </defs>
            <rect width="1200" height="720" fill="url(#bg)"/>
            <circle cx="1030" cy="110" r="170" fill="rgba(255,255,255,0.12)"/>
            <circle cx="150" cy="590" r="220" fill="rgba(255,255,255,0.08)"/>
            <text x="78" y="330" fill="#ffffff" font-family="Arial, sans-serif" font-size="82" font-weight="700">Map preview</text>
            <text x="78" y="420" fill="#dbeafe" font-family="Arial, sans-serif" font-size="34">Hình ảnh sân đang được cập nhật</text>
        </svg>
    `);

export function useDebounce(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebounced(value), delay);
        return () => window.clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}

export function getSafeValue(value, fallback) {
    return value ? value : fallback;
}

export function getSportMeta(type) {
    return (
        SPORT_FILTERS.find((item) => item.key === type) || {
            key: type || 'OTHER',
            label: type || 'Khác',
            shortLabel: type || 'Khác',
            icon: '•',
            color: '#64748b'
        }
    );
}

export function normalizeMarker(field) {
    const sportType = field?.sportType ?? 'OTHER';
    const meta = getSportMeta(sportType);

    return {
        id: field?.id,
        name: getSafeValue(field?.name, 'Sân đang cập nhật tên'),
        slug: field?.slug ?? '',
        sportType,
        sportLabel: meta.shortLabel,
        sportIcon: meta.icon,
        markerColor: meta.color,
        address: getSafeValue(field?.address, 'Địa chỉ đang được cập nhật'),
        latitude: field?.latitude,
        longitude: field?.longitude,
        openingHours: getSafeValue(field?.openingHours, 'Giờ hoạt động đang được cập nhật'),
        phone: getSafeValue(field?.phone, 'Chưa cập nhật số điện thoại'),
        coverImageUrl: field?.coverImageUrl ?? '',
        description: field?.description ?? '',
        bookingPolicy: field?.bookingPolicy ?? ''
    };
}

export function normalizeDetail(field) {
    return {
        ...normalizeMarker(field),
        description: getSafeValue(field?.description, 'Mô tả sân đang được cập nhật.'),
        bookingPolicy: getSafeValue(field?.bookingPolicy, 'Chính sách đặt sân sẽ được bổ sung sau.')
    };
}

export function isValidBounds(bounds) {
    return (
        bounds &&
        typeof bounds.minLat === 'number' &&
        typeof bounds.maxLat === 'number' &&
        typeof bounds.minLng === 'number' &&
        typeof bounds.maxLng === 'number'
    );
}

function toRadians(value) {
    return (value * Math.PI) / 180;
}

export function calculateDistanceKm(from, to) {
    const fromLat = Number(from?.latitude ?? from?.lat);
    const fromLng = Number(from?.longitude ?? from?.lng);
    const toLat = Number(to?.latitude ?? to?.lat);
    const toLng = Number(to?.longitude ?? to?.lng);

    if ([fromLat, fromLng, toLat, toLng].some((value) => Number.isNaN(value))) {
        return null;
    }

    const earthRadiusKm = 6371;
    const deltaLat = toRadians(toLat - fromLat);
    const deltaLng = toRadians(toLng - fromLng);
    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(toRadians(fromLat)) *
            Math.cos(toRadians(toLat)) *
            Math.sin(deltaLng / 2) *
            Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
}

export function formatDistance(distanceKm) {
    if (distanceKm == null) return '';
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
    return `${distanceKm.toFixed(1)} km`;
}

export function getNearbyAnchor(bounds, userLocation) {
    if (userLocation) return userLocation;
    if (isValidBounds(bounds)) {
        return {
            latitude: (bounds.minLat + bounds.maxLat) / 2,
            longitude: (bounds.minLng + bounds.maxLng) / 2
        };
    }

    return { latitude: DEFAULT_CENTER[0], longitude: DEFAULT_CENTER[1] };
}
