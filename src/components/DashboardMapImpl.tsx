"use client";

import { useEffect, useState } from "react";
import { api, MapReport } from "@/lib/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [-2.9761, 104.7754]; // Palembang
const DEFAULT_ZOOM = 13;

function severityColor(level: string): string {
  return level === "high" || level === "extreme" ? "#ba1a1a" : "#f59e0b";
}

function buildPinHtml(color: string, iconType: "alert" | "droplet", isCritical: boolean): string {
  const iconStr = iconType === "alert" 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`;

  const pulse = isCritical ? `<div style="position:absolute;inset:-10px;border-radius:50%;background:${color};opacity:0.25;animation:gmPing 1.6s cubic-bezier(0,0,0.2,1) infinite;pointer-events:none;"></div>` : '';

  return `
<div style="position:relative;display:flex;flex-direction:column;align-items:center;width:42px;height:54px;">
  ${pulse}
  <div style="position:relative; width:42px; height:54px;">
    <svg style="position:absolute; inset:0;" xmlns="http://www.w3.org/2000/svg" width="42" height="54" viewBox="0 0 42 54">
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.35)"/>
      </filter>
      <circle cx="21" cy="21" r="19" fill="${color}" stroke="white" stroke-width="2.5" filter="url(#shadow)"/>
      <polygon points="14,37 28,37 21,53" fill="${color}"/>
    </svg>
    <div style="position:absolute; top:2px; left:0; right:0; height:38px; display:flex; align-items:center; justify-content:center;">
      ${iconStr}
    </div>
  </div>
</div>`;
}

export interface DashboardMapProps {
  dateFrom?: string;
  dateTo?: string;
}

export default function DashboardMapImpl({ dateFrom, dateTo }: DashboardMapProps) {
  const [mapReports, setMapReports] = useState<MapReport[]>([]);

  useEffect(() => {
    api
      .getMapReports(dateFrom, dateTo)
      .then((res) => setMapReports(res.data))
      .catch((err) => console.error("Failed to load map reports:", err));
  }, [dateFrom, dateTo]);

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

  return (
    <>
      <style>{`
        @keyframes gmPing{75%,100%{transform:scale(2.2);opacity:0;}}
        .custom-leaflet-icon { background: transparent; border: none; }
      `}</style>
      <div className="w-full h-full">
        <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ width: '100%', height: '100%', zIndex: 1 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markersData.map((m, i) => {
            const color = severityColor(m.level);
            const isCritical = m.level === "high" || m.level === "extreme";
            const iconHtml = buildPinHtml(color, isCritical ? "alert" : "droplet", isCritical);
            const customIcon = L.divIcon({
              className: 'custom-leaflet-icon',
              html: iconHtml,
              iconSize: [42, 54],
              iconAnchor: [21, 54],
              popupAnchor: [0, -54]
            });

            return (
              <Marker key={i} position={[m.lat, m.lng]} icon={customIcon}>
                <Popup>
                  <div style={{ fontFamily: "'Public Sans',sans-serif", minWidth: "190px", padding: "4px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".06em", color: color, textTransform: "uppercase", marginBottom: "4px" }}>
                      {isCritical ? "⚠ KRITIS" : "⚠ WASPADA"}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1b21", lineHeight: 1.3, marginBottom: "6px" }}>{m.title}</div>
                    <div style={{ fontSize: "12px", color: "#555", lineHeight: 1.6 }}>
                      🌊 Kedalaman: <b>{m.depth}</b><br/>
                      📍 Area: {m.area}
                      {m.confirms > 0 ? <><br/>✅ <span style={{ color: "#00236f", fontWeight: 700 }}>{m.confirms} konfirmasi</span></> : ""}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </>
  );
}
