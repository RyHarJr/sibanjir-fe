"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [-2.9761, 104.7754]; // Palembang
const DEFAULT_ZOOM = 14;

export interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  onMapClick: (lat: number, lng: number) => void;
}

function createPinHtml(): string {
  const iconStr = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#0057d9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
  return `
<div style="position:relative; width:36px; height:48px;">
  <svg style="position:absolute; inset:0;" xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
    <filter id="ps" x="-30%" y="-20%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="rgba(0,0,0,0.4)"/>
    </filter>
    <circle cx="18" cy="18" r="16" fill="#0057d9" stroke="white" stroke-width="3" filter="url(#ps)"/>
    <polygon points="11,31 25,31 18,47" fill="#0057d9"/>
  </svg>
  <div style="position:absolute; top:2px; left:0; right:0; height:32px; display:flex; align-items:center; justify-content:center;">
    ${iconStr}
  </div>
</div>`;
}

// Handle clicks explicitly separate
function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Move map based on props explicitly
function MapUpdater({ latitude, longitude }: { latitude?: number; longitude?: number }) {
  const map = useMap();
  useEffect(() => {
    if (latitude && longitude) {
      map.flyTo([latitude, longitude], 16);
    }
  }, [latitude, longitude, map]);
  return null;
}

export default function MapPickerImpl({ latitude, longitude, onMapClick }: MapPickerProps) {
  const markerRef = useRef<L.Marker>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latlng = marker.getLatLng();
          onMapClick(latlng.lat, latlng.lng);
        }
      },
    }),
    [onMapClick],
  );

  const customIcon = L.divIcon({
    className: 'custom-leaflet-icon',
    html: createPinHtml(),
    iconSize: [36, 48],
    iconAnchor: [18, 48],
  });

  const center: [number, number] = latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER;

  return (
    <>
      <style>{`
        .custom-leaflet-icon { background: transparent; border: none; }
        .leaflet-container { cursor: crosshair !important; }
      `}</style>
      <div className="map-picker-container w-full" style={{ height: "320px" }}>
        <div className="w-full h-full rounded-xl overflow-hidden z-[1] relative">
          <MapContainer center={center} zoom={DEFAULT_ZOOM} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents onMapClick={onMapClick} />
            <MapUpdater latitude={latitude} longitude={longitude} />
            {latitude && longitude && (
              <Marker
                draggable={true}
                eventHandlers={eventHandlers}
                position={[latitude, longitude]}
                icon={customIcon}
                ref={markerRef}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </>
  );
}
