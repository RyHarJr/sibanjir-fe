"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";

const DEFAULT_CENTER = { lat: -2.9761, lng: 104.7754 }; // Palembang
const DEFAULT_ZOOM = 14;

export interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  onMapClick: (lat: number, lng: number) => void;
}

function createPinElement(): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = "position:relative; width:36px; height:48px;";
  const iconStr = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#0057d9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
  el.innerHTML = `
<svg style="position:absolute; inset:0;" xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
  <filter id="ps" x="-30%" y="-20%" width="160%" height="160%">
    <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="rgba(0,0,0,0.4)"/>
  </filter>
  <circle cx="18" cy="18" r="16" fill="#0057d9" stroke="white" stroke-width="3" filter="url(#ps)"/>
  <polygon points="11,31 25,31 18,47" fill="#0057d9"/>
</svg>
<div style="position:absolute; top:2px; left:0; right:0; height:32px; display:flex; align-items:center; justify-content:center;">
  ${iconStr}
</div>`;
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
          const pos = (initialMarker as any).position;
          const lat = typeof pos.lat === "function" ? pos.lat() : pos.lat;
          const lng = typeof pos.lng === "function" ? pos.lng() : pos.lng;
          if (lat !== undefined && lng !== undefined) onMapClickRef.current(lat, lng);
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
            const pos = (clickMarker as any).position;
            const lat = typeof pos.lat === "function" ? pos.lat() : pos.lat;
            const lng = typeof pos.lng === "function" ? pos.lng() : pos.lng;
            if (lat !== undefined && lng !== undefined) onMapClickRef.current(lat, lng);
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
