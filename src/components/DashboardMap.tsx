"use client";

import { useEffect, useRef, useState } from "react";
import { api, MapReport } from "@/lib/api";
import { loadGoogleMaps } from "@/lib/googleMaps";

const DEFAULT_CENTER = { lat: -2.9761, lng: 104.7754 }; // Palembang
const DEFAULT_ZOOM = 13;

/* ── Severity colour helper ──────────────────────────────────────────────── */
function severityColor(level: string): string {
  return level === "high" || level === "extreme" ? "#ba1a1a" : "#f59e0b";
}

function buildPinSvg(color: string, iconType: "alert" | "droplet"): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:relative; width:42px; height:54px;";
  
  const iconStr = iconType === "alert" 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`;

  wrapper.innerHTML = `
<svg style="position:absolute; inset:0;" xmlns="http://www.w3.org/2000/svg" width="42" height="54" viewBox="0 0 42 54">
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.35)"/>
  </filter>
  <circle cx="21" cy="21" r="19" fill="${color}" stroke="white" stroke-width="2.5" filter="url(#shadow)"/>
  <polygon points="14,37 28,37 21,53" fill="${color}"/>
</svg>
<div style="position:absolute; top:2px; left:0; right:0; height:38px; display:flex; align-items:center; justify-content:center;">
  ${iconStr}
</div>`;
  return wrapper;
}

interface DashboardMapProps {
  dateFrom?: string;
  dateTo?: string;
}

export default function DashboardMap({ dateFrom, dateTo }: DashboardMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const initRef = useRef(false);
  const [mapReports, setMapReports] = useState<MapReport[]>([]);
  const [mapReady, setMapReady] = useState(false);

  /* ── Fetch reports ─────────────────────────────────────────────────────── */
  useEffect(() => {
    api
      .getMapReports(dateFrom, dateTo)
      .then((res) => setMapReports(res.data))
      .catch((err) => console.error("Failed to load map reports:", err));
  }, [dateFrom, dateTo]);

  /* ── Init Google Map ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    const init = async () => {
      const { mapsLib, markerLib } = await loadGoogleMaps();

      const map = new mapsLib.Map(containerRef.current!, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        mapId: "DEMO_MAP_ID",
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
          { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
        ],
      });

      mapRef.current = map;
      setMapReady(true);
    };

    init();

    return () => {
      initRef.current = false;
      markersRef.current.forEach((m) => (m.map = null));
      markersRef.current = [];
      mapRef.current = null;
    };
  }, []);

  /* ── Update markers ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    const markersData =
      mapReports.length > 0
        ? mapReports.map((r) => ({
            lat: r.latitude,
            lng: r.longitude,
            level: r.severityLevel,
            title: r.title,
            depth: `${r.waterDepthCm} cm`,
            area: r.district?.name ?? r.address ?? "—",
            confirms: r._count?.verifications ?? 0,
          }))
        : [
            { lat: -2.9681, lng: 104.7456, level: "high", title: "Jl. Sudirman – Charitas", depth: "~80 cm", area: "Ilir Timur I", confirms: 0 },
            { lat: -2.985,  lng: 104.728,  level: "medium", title: "Sekip Bendung",           depth: "~30 cm", area: "Kemuning",   confirms: 0 },
            { lat: -2.96,   lng: 104.765,  level: "medium", title: "Jl. R. Sukamto",          depth: "~40 cm", area: "Ilir Timur II", confirms: 0 },
          ];

    const infoWindow = new google.maps.InfoWindow();

    markersData.forEach(async (m) => {
      const color = severityColor(m.level);
      const isCritical = m.level === "high" || m.level === "extreme";

      // Glowing pulse wrapper
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:relative;display:flex;flex-direction:column;align-items:center;";

      if (isCritical) {
        const pulse = document.createElement("div");
        pulse.style.cssText = `position:absolute;inset:-10px;border-radius:50%;background:${color};opacity:0.25;animation:gmPing 1.6s cubic-bezier(0,0,0.2,1) infinite;pointer-events:none;`;
        wrapper.appendChild(pulse);
      }

      const pin = buildPinSvg(color, isCritical ? "alert" : "droplet");
      wrapper.appendChild(pin);

      // Inject ping keyframe once
      if (!document.getElementById("gm-ping-style")) {
        const s = document.createElement("style");
        s.id = "gm-ping-style";
        s.textContent = `@keyframes gmPing{75%,100%{transform:scale(2.2);opacity:0;}}`;
        document.head.appendChild(s);
      }

      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      const marker = new AdvancedMarkerElement({
        map: mapRef.current!,
        position: { lat: m.lat, lng: m.lng },
        content: wrapper,
        title: m.title,
      });

      marker.addListener("click", () => {
        infoWindow.setContent(`
          <div style="font-family:'Public Sans',sans-serif;min-width:190px;padding:4px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:.06em;color:${color};text-transform:uppercase;margin-bottom:4px;">
              ${isCritical ? "⚠ KRITIS" : "⚠ WASPADA"}
            </div>
            <div style="font-size:14px;font-weight:700;color:#1a1b21;line-height:1.3;margin-bottom:6px;">${m.title}</div>
            <div style="font-size:12px;color:#555;line-height:1.6;">
              🌊 Kedalaman: <b>${m.depth}</b><br/>
              📍 Area: ${m.area}
              ${m.confirms > 0 ? `<br/>✅ <span style="color:#00236f;font-weight:700;">${m.confirms} konfirmasi</span>` : ""}
            </div>
          </div>`);
        infoWindow.open(mapRef.current!, marker);
      });

      markersRef.current.push(marker);
    });
  }, [mapReady, mapReports]);

  return <div ref={containerRef} className="w-full h-full" />;
}
