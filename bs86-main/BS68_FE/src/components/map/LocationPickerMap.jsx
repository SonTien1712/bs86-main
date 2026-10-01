import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix icon Leaflet cho Vite
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import marker1x from 'leaflet/dist/images/marker-icon.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconRetinaUrl: marker2x,
    iconUrl: marker1x,
    shadowUrl: shadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function ClickToSetMarker({ value, onChange }) {
    useMapEvents({
        click(e) {
            onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
    });
    return null;
}

export default function LocationPickerMap({
    value,
    onChange,
    center = [10.8231, 106.6297],
    zoom = 13
}) {
    const markerPos = useMemo(() => {
        if (!value) return null;
        return [value.lat, value.lng];
    }, [value]);

    return (
        <MapContainer
            center={markerPos ?? center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />

            <ClickToSetMarker value={value} onChange={onChange} />

            {markerPos && (
                <Marker
                    position={markerPos}
                    draggable
                    eventHandlers={{
                        dragend: e => {
                            const p = e.target.getLatLng();
                            onChange({ lat: p.lat, lng: p.lng });
                        }
                    }}
                />
            )}
        </MapContainer>
    );
}
