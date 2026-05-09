"use client";

import { useEffect, useRef, useCallback } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";

const DEFAULT_CENTER = { lat: -2.9761, lng: 104.7754 }; // Palembang
const DEFAULT_ZOOM = 14;

export interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  onMapClick: (lat: number, lng: number) => void;
}

/* ── Custom blue pin HTML ────────────────────────────────────────────────── */
function createPinElement(): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
  <filter id="ps" x="-30%" y="-20%" width="160%" height="160%">
    <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="rgba(0,0,0,0.4)"/>
  </filter>
  <circle cx="18" cy="18" r="16" fill="#0057d9" stroke="white" stroke-width="3" filter="url(#ps)"/>
  <text x="18" y="24" text-anchor="middle" font-family="Material Symbols Outlined" font-size="16" fill="white">location_on</text>
  <polygon points="11,31 25,31 18,47" fill="#0057d9"/>
</svg>`;
  return el;
}

export default function MapPicker({ latitude, longitude, onMapClick }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const initRef = useRef(false);

  // Keep callback ref fresh
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);

  /* ── Init map once ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    let cancelled = false;

    const init = async () => {
      const { mapsLib, markerLib } = await loadGoogleMaps();
      if (cancelled) return;

      const center =
        latitude && longitude ? { lat: latitude, lng: longitude } : DEFAULT_CENTER;

      const map = new mapsLib.Map(containerRef.current!, {
        center,
        zoom: DEFAULT_ZOOM,
        mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement; use Cloud Console ID in production
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
        draggableCursor: "crosshair",
      });

      mapRef.current = map;

      // Place initial marker if coords provided
      if (latitude && longitude) {
        markerRef.current = new markerLib.AdvancedMarkerElement({
          map,
          position: { lat: latitude, lng: longitude },
          content: createPinElement(),
          gmpDraggable: true,
        });

        const initialMarker = markerRef.current!;
        initialMarker.addListener("dragend", () => {
          const pos = (initialMarker as any).position as google.maps.LatLng;
          onMapClickRef.current(pos.lat(), pos.lng());
        });
      }

      // Click to place / move marker
      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        onMapClickRef.current(lat, lng);

        if (markerRef.current) {
          markerRef.current.position = { lat, lng };
        } else {
          markerRef.current = new markerLib.AdvancedMarkerElement({
            map,
            position: { lat, lng },
            content: createPinElement(),
            gmpDraggable: true,
          });
          const clickMarker = markerRef.current!;
          clickMarker.addListener("dragend", () => {
            const pos = (clickMarker as any).position as google.maps.LatLng;
            onMapClickRef.current(pos.lat(), pos.lng());
          });
        }
      });
    };

    init();

    return () => {
      cancelled = true;
      initRef.current = false; // reset so remount (React Strict Mode) re-inits correctly
      if (markerRef.current) { markerRef.current.map = null; markerRef.current = null; }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Pan / move marker when coords change externally ──────────────────── */
  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude) return;
    const pos = { lat: latitude, lng: longitude };
    mapRef.current.panTo(pos);
    mapRef.current.setZoom(16);

    if (markerRef.current) {
      markerRef.current.position = pos;
    }
  }, [latitude, longitude]);

  return (
    <div className="map-picker-container w-full" style={{ height: "320px" }}>
      <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />
    </div>
  );
}
