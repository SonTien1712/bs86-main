import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import s from './CreateFieldMapStep.module.scss';

// ✅ Fix icon marker mặc định (Leaflet + Vite hay bị mất icon)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

const DEFAULT_CENTER = { lat: 16.047079, lng: 108.20623 }; // Đà Nẵng
const DEFAULT_ZOOM = 13;

function ClickToPick({ onPick }) {
    useMapEvents({
        click(e) {
            onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
    });
    return null;
}

function Recenter({ lat, lng, zoom = 16 }) {
    const map = useMapEvents({}); // lấy map instance
    useEffect(() => {
        if (typeof lat !== 'number' || typeof lng !== 'number') return;
        // ✅ map đã có center+zoom từ đầu -> setView an toàn
        map.setView([lat, lng], zoom, { animate: true });
    }, [lat, lng, zoom, map]);
    return null;
}

export default function CreateFieldMap({
    value, // {lat, lng}
    onChange, // (next) => void
    allowClick = true,
    allowDrag = true
}) {
    const center = useMemo(() => {
        if (value?.lat != null && value?.lng != null) return value;
        return DEFAULT_CENTER;
    }, [value]);

    const [ready, setReady] = useState(false);

    return (
        <div className={s.mapWrap}>
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={DEFAULT_ZOOM}
                className={s.map}
                whenReady={() => setReady(true)}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                />

                {/* ✅ Chỉ recenter khi map ready */}
                {ready && value?.lat != null && value?.lng != null && (
                    <Recenter lat={value.lat} lng={value.lng} zoom={16} />
                )}

                {/* Click map để đặt pin */}
                {allowClick && <ClickToPick onPick={onChange} />}

                {/* Marker */}
                {value?.lat != null && value?.lng != null && (
                    <Marker
                        position={[value.lat, value.lng]}
                        draggable={allowDrag}
                        eventHandlers={{
                            dragend(e) {
                                const latlng = e.target.getLatLng();
                                onChange({ lat: latlng.lat, lng: latlng.lng });
                            }
                        }}
                    />
                )}
            </MapContainer>
        </div>
    );
}
