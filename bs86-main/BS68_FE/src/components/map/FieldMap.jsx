import { useEffect, useMemo } from 'react';
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap,
    useMapEvents
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const WORLD_BOUNDS = [
    [-85, -180],
    [85, 180]
];

function createMarkerIcon(color, selected) {
    const size = selected ? 34 : 28;
    const dotSize = selected ? 10 : 8;

    return L.divIcon({
        className: '',
        html: `
            <div style="position: relative; width: ${size}px; height: ${size + 12}px;">
                <span style="
                    position: absolute;
                    inset: 0;
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 999px;
                    background: ${color};
                    border: 3px solid #ffffff;
                    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.24);
                "></span>
                <span style="
                    position: absolute;
                    left: 50%;
                    bottom: 2px;
                    width: 12px;
                    height: 12px;
                    background: ${color};
                    transform: translateX(-50%) rotate(45deg);
                    border-right: 3px solid #ffffff;
                    border-bottom: 3px solid #ffffff;
                "></span>
                <span style="
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: ${dotSize}px;
                    height: ${dotSize}px;
                    border-radius: 999px;
                    background: #ffffff;
                    transform: translate(-50%, -50%);
                "></span>
            </div>
        `,
        iconSize: [size, size + 12],
        iconAnchor: [size / 2, size + 8],
        popupAnchor: [0, -(size + 6)]
    });
}

function FixLeafletResize() {
    const map = useMap();

    useEffect(() => {
        const timer = window.setTimeout(() => map.invalidateSize(), 0);
        return () => window.clearTimeout(timer);
    }, [map]);

    return null;
}

function BoundsWatcher({ onBoundsChange = () => {} }) {
    const map = useMap();

    const pushBounds = () => {
        const bounds = map.getBounds();
        onBoundsChange({
            minLat: bounds.getSouth(),
            minLng: bounds.getWest(),
            maxLat: bounds.getNorth(),
            maxLng: bounds.getEast()
        });
    };

    useEffect(() => {
        pushBounds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useMapEvents({
        moveend: pushBounds,
        zoomend: pushBounds
    });

    return null;
}

function FocusController({ focusMarker, onFocusHandled }) {
    const map = useMap();

    useEffect(() => {
        const latitude = Number(focusMarker?.latitude ?? focusMarker?.lat);
        const longitude = Number(focusMarker?.longitude ?? focusMarker?.lng);

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) return;

        const targetZoom = Math.max(map.getZoom(), 15);
        map.flyTo([latitude, longitude], targetZoom, {
            animate: true,
            duration: 0.8
        });
        onFocusHandled?.();
    }, [focusMarker, map]);

    return null;
}

export default function FieldMap({
    markers = [],
    onBoundsChange = () => {},
    defaultCenter = [10.7769, 106.7009],
    defaultZoom = 13,
    onSelect,
    selectedMarkerId,
    focusMarker,
    userLocation,
    onFocusHandled
}) {
    const markerIcons = useMemo(() => {
        const cache = new Map();

        for (const marker of markers) {
            const color = marker?.markerColor ?? '#0f766e';
            const normalKey = `${color}-normal`;
            const activeKey = `${color}-active`;

            if (!cache.has(normalKey)) {
                cache.set(normalKey, createMarkerIcon(color, false));
            }

            if (!cache.has(activeKey)) {
                cache.set(activeKey, createMarkerIcon(color, true));
            }
        }

        return cache;
    }, [markers]);

    return (
        <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            maxBounds={WORLD_BOUNDS}
            maxBoundsViscosity={1.0}
            scrollWheelZoom
            style={{ height: '100%', width: '100%' }}
        >
            <FixLeafletResize />
            <BoundsWatcher onBoundsChange={onBoundsChange} />
            <FocusController
                focusMarker={focusMarker}
                onFocusHandled={onFocusHandled}
            />

            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                noWrap
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />

            {markers.map((marker) => {
                const latitude = Number(marker?.latitude ?? marker?.lat);
                const longitude = Number(marker?.longitude ?? marker?.lng);

                if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
                    return null;
                }

                const color = marker?.markerColor ?? '#0f766e';
                const selected = marker?.id === selectedMarkerId;
                const icon = markerIcons.get(
                    `${color}-${selected ? 'active' : 'normal'}`
                );

                return (
                    <Marker
                        eventHandlers={{
                            click: () => onSelect?.(marker)
                        }}
                        icon={icon}
                        key={marker.id ?? `${latitude}-${longitude}`}
                        position={[latitude, longitude]}
                    >
                        <Popup autoPan={false}>
                            <div style={{ minWidth: 220 }}>
                                <div
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 800,
                                        color: '#0f172a'
                                    }}
                                >
                                    {marker.name ?? 'Sân'}
                                </div>
                                <div
                                    style={{
                                        marginTop: 6,
                                        color: '#475569',
                                        fontSize: 12,
                                        lineHeight: 1.5
                                    }}
                                >
                                    {marker.address ??
                                        `${latitude}, ${longitude}`}
                                </div>
                                <div
                                    style={{
                                        marginTop: 8,
                                        color: marker.markerColor ?? '#0f766e',
                                        fontSize: 12,
                                        fontWeight: 700
                                    }}
                                >
                                    {marker.sportLabel ?? marker.sportType ?? 'Khác'}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {userLocation ? (
                <Marker
                    icon={createMarkerIcon('#2563eb', true)}
                    position={[userLocation.lat, userLocation.lng]}
                >
                    <Popup autoPan={false}>
                        <div style={{ minWidth: 180 }}>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: '#0f172a'
                                }}
                            >
                                Vi tri cua ban
                            </div>
                            <div
                                style={{
                                    marginTop: 6,
                                    color: '#475569',
                                    fontSize: 12,
                                    lineHeight: 1.5
                                }}
                            >
                                {userLocation.lat.toFixed(6)},{' '}
                                {userLocation.lng.toFixed(6)}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ) : null}
        </MapContainer>
    );
}
