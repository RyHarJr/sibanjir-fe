"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";

interface RoutePoint { lat: number; lng: number; }
interface FloodMarker  { lat: number; lng: number; depth: string; }

interface SafeRouteMapProps {
  origin?:       RoutePoint | null;
  destination?:  RoutePoint | null;
  safeRoute?:    RoutePoint[];
  floodedRoute?: RoutePoint[];
  floodMarkers?: FloodMarker[];
  isLoading?:    boolean;
}

const PALEMBANG: google.maps.LatLngLiteral = { lat: -2.9761, lng: 104.7754 };

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function latLng(p: RoutePoint): google.maps.LatLngLiteral {
  return { lat: p.lat, lng: p.lng };
}

function originMarkerEl(): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="11" fill="#00236f" stroke="white" stroke-width="3"/>
  <circle cx="12" cy="12" r="5" fill="white"/>
</svg>`;
  el.style.cssText = "animation:gmPulse 1.6s cubic-bezier(0,0,0.2,1) infinite;";
  return el;
}

function destMarkerEl(): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
  <filter id="ds"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="rgba(0,0,0,0.4)"/></filter>
  <circle cx="18" cy="18" r="16" fill="#00236f" stroke="white" stroke-width="3" filter="url(#ds)"/>
  <text x="18" y="24" text-anchor="middle" font-family="Material Symbols Outlined" font-size="16" fill="white">flag</text>
  <polygon points="11,31 25,31 18,47" fill="#00236f"/>
</svg>`;
  return el;
}

/* ── SVG pin builder (same as DashboardMap) ────────────────────────────── */
function buildPinSvg(color: string, icon: string): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="42" height="54" viewBox="0 0 42 54">
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.35)"/>
  </filter>
  <circle cx="21" cy="21" r="19" fill="${color}" stroke="white" stroke-width="2.5" filter="url(#shadow)"/>
  <text x="21" y="28" text-anchor="middle" font-family="Material Symbols Outlined" font-size="18" fill="white">${icon}</text>
  <polygon points="14,37 28,37 21,53" fill="${color}"/>
</svg>`;
}

function floodMarkerEl(depth: string): HTMLElement {
  // Determine severity from depth value
  const depthNum = parseInt(depth) || 0;
  const isCritical = depthNum >= 50;
  const color = isCritical ? "#ba1a1a" : "#f59e0b";

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:relative;display:flex;flex-direction:column;align-items:center;";

  // Glowing pulse for critical floods
  if (isCritical) {
    const pulse = document.createElement("div");
    pulse.style.cssText = `position:absolute;inset:-10px;border-radius:50%;background:${color};opacity:0.25;animation:gmPing 1.6s cubic-bezier(0,0,0.2,1) infinite;pointer-events:none;`;
    wrapper.appendChild(pulse);
  }

  const pin = document.createElement("div");
  pin.innerHTML = buildPinSvg(color, isCritical ? "flood" : "water_drop");
  wrapper.appendChild(pin);

  // Depth label badge
  const badge = document.createElement("div");
  badge.textContent = depth;
  badge.style.cssText = `background:${color};color:white;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.3);margin-top:-4px;`;
  wrapper.appendChild(badge);

  return wrapper;
}

export default function SafeRouteMap({
  origin, destination, safeRoute, floodedRoute, floodMarkers, isLoading,
}: SafeRouteMapProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<google.maps.Map | null>(null);
  const polyRef       = useRef<google.maps.Polyline[]>([]);
  const markerRef     = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const initRef       = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  /* ── Inject pulse style once ─────────────────────────────────────────── */
  useEffect(() => {
    if (document.getElementById("sr-pulse-style")) return;
    const s = document.createElement("style");
    s.id = "sr-pulse-style";
    s.textContent = `
      @keyframes gmPulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,35,111,.4);}50%{box-shadow:0 0 0 12px rgba(0,35,111,0);} }
      @keyframes gmPing { 75%,100%{transform:scale(2.2);opacity:0;} }
    `;
    document.head.appendChild(s);
  }, []);

  /* ── Init map once ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    const init = async () => {
      const { mapsLib } = await loadGoogleMaps();

      const map = new mapsLib.Map(containerRef.current!, {
        center: PALEMBANG,
        zoom: 13,
        mapId: "DEMO_MAP_ID",
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        ],
      });

      mapRef.current = map;
      setMapReady(true);
    };

    init();

    return () => {
      initRef.current = false; // reset so remount (React Strict Mode) re-inits correctly
      polyRef.current.forEach((p) => p.setMap(null));
      markerRef.current.forEach((m) => (m.map = null));
      polyRef.current = [];
      markerRef.current = [];
      mapRef.current = null;
    };
  }, []);

  /* ── Update layers when data changes ─────────────────────────────────── */
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    // Clear previous
    polyRef.current.forEach((p) => p.setMap(null));
    markerRef.current.forEach((m) => (m.map = null));
    polyRef.current = [];
    markerRef.current = [];

    const map = mapRef.current;
    const bounds = new google.maps.LatLngBounds();
    let hasBounds = false;

    const addBounds = (points: RoutePoint[]) => {
      points.forEach((p) => { bounds.extend(latLng(p)); hasBounds = true; });
    };

    // ── Flooded route (dashed red) ─────────────────────────────────────
    if (floodedRoute?.length) {
      polyRef.current.push(
        new google.maps.Polyline({
          map,
          path: floodedRoute.map(latLng),
          strokeColor: "#ba1a1a",
          strokeWeight: 6,
          strokeOpacity: 0.85,
          icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 4 }, offset: "0", repeat: "16px" }],
        })
      );
      addBounds(floodedRoute);
    }

    // ── Safe route (white outline + navy) ──────────────────────────────
    if (safeRoute?.length) {
      polyRef.current.push(
        new google.maps.Polyline({ map, path: safeRoute.map(latLng), strokeColor: "#ffffff", strokeWeight: 14, strokeOpacity: 0.7 })
      );
      polyRef.current.push(
        new google.maps.Polyline({ map, path: safeRoute.map(latLng), strokeColor: "#00236f", strokeWeight: 8 })
      );
      addBounds(safeRoute);
    }

    // ── Origin marker ──────────────────────────────────────────────────
    if (origin) {
      const m = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: latLng(origin),
        content: originMarkerEl(),
        title: "Lokasi Awal",
      });
      markerRef.current.push(m);
      bounds.extend(latLng(origin));
      hasBounds = true;
    }

    // ── Destination marker ─────────────────────────────────────────────
    if (destination) {
      const m = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: latLng(destination),
        content: destMarkerEl(),
        title: "Tujuan",
      });
      markerRef.current.push(m);
      bounds.extend(latLng(destination));
      hasBounds = true;
    }

    // ── Flood warning markers ──────────────────────────────────────────
    floodMarkers?.forEach((fm) => {
      const m = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: fm.lat, lng: fm.lng },
        content: floodMarkerEl(fm.depth),
      });
      markerRef.current.push(m);
    });

    // ── Fit bounds ────────────────────────────────────────────────────
    if (hasBounds) {
      if (markerRef.current.length === 1 && !safeRoute?.length) {
        map.panTo(bounds.getCenter());
        map.setZoom(15);
      } else {
        map.fitBounds(bounds, 60);
      }
    } else {
      map.panTo(PALEMBANG);
      map.setZoom(13);
    }
  }, [mapReady, origin, destination, safeRoute, floodedRoute, floodMarkers]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 bg-surface/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-body-sm font-medium text-on-surface-variant">
              Menghitung rute aman...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
