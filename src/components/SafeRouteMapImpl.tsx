"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface RoutePoint {
  lat: number;
  lng: number;
}
export interface FloodMarker {
  lat: number;
  lng: number;
  depth: string;
}

export interface SafeRouteMapProps {
  origin?: RoutePoint | null;
  destination?: RoutePoint | null;
  safeRoute?: RoutePoint[];
  floodedRoute?: RoutePoint[];
  floodMarkers?: FloodMarker[];
  isLoading?: boolean;
}

const PALEMBANG: [number, number] = [-2.9761, 104.7754];

function originMarkerHtml(): string {
  return `
<div style="animation:gmPulse 1.6s cubic-bezier(0,0,0.2,1) infinite;">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="#00236f" stroke="white" stroke-width="3"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>
</div>`;
}

function destMarkerHtml(): string {
  const iconStr = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="0"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`;
  return `
<div style="position:relative; width:36px; height:48px;">
  <svg style="position:absolute; inset:0;" xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
    <filter id="ds"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="rgba(0,0,0,0.4)"/></filter>
    <circle cx="18" cy="18" r="16" fill="#00236f" stroke="white" stroke-width="3" filter="url(#ds)"/>
    <polygon points="11,31 25,31 18,47" fill="#00236f"/>
  </svg>
  <div style="position:absolute; top:2px; left:0; right:0; height:32px; display:flex; align-items:center; justify-content:center;">
    ${iconStr}
  </div>
</div>`;
}

function floodMarkerHtml(depth: string): string {
  const depthNum = parseInt(depth) || 0;
  const isCritical = depthNum >= 50;
  const color = isCritical ? "#ba1a1a" : "#f59e0b";
  const iconType = isCritical ? "alert" : "droplet";

  const iconStr = iconType === "alert" 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`;

  const pulse = isCritical ? `<div style="position:absolute;inset:-10px;border-radius:50%;background:${color};opacity:0.25;animation:gmPing 1.6s cubic-bezier(0,0,0.2,1) infinite;pointer-events:none;"></div>` : '';

  return `
<div style="position:relative;display:flex;flex-direction:column;align-items:center;width:42px;height:70px;">
  <div style="position:relative; width:42px; height:54px;">
    ${pulse}
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
  <div style="background:${color};color:white;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.3);margin-top:-4px;">
    ${depth}
  </div>
</div>`;
}

function MapUpdater({ 
  points 
}: { 
  points: [number, number][];
}) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      if (points.length === 1) {
        map.flyTo(points[0], 15);
      } else {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    } else {
      map.flyTo(PALEMBANG, 13);
    }
  }, [points, map]);
  return null;
}

export default function SafeRouteMapImpl({
  origin,
  destination,
  safeRoute,
  floodedRoute,
  floodMarkers,
  isLoading,
}: SafeRouteMapProps) {

  // Icons
  const originIcon = useMemo(() => L.divIcon({
    className: 'custom-leaflet-icon',
    html: originMarkerHtml(),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }), []);

  const destIcon = useMemo(() => L.divIcon({
    className: 'custom-leaflet-icon',
    html: destMarkerHtml(),
    iconSize: [36, 48],
    iconAnchor: [18, 48],
  }), []);

  // Collect all points to fit bounds
  const allPoints = useMemo(() => {
    const pts: [number, number][] = [];
    if (origin) pts.push([origin.lat, origin.lng]);
    if (destination) pts.push([destination.lat, destination.lng]);
    if (safeRoute) pts.push(...safeRoute.map(p => [p.lat, p.lng] as [number, number]));
    if (floodedRoute) pts.push(...floodedRoute.map(p => [p.lat, p.lng] as [number, number]));
    return pts;
  }, [origin, destination, safeRoute, floodedRoute]);

  const safePositions = safeRoute ? safeRoute.map(p => [p.lat, p.lng] as [number, number]) : [];
  const floodPositions = floodedRoute ? floodedRoute.map(p => [p.lat, p.lng] as [number, number]) : [];

  return (
    <>
      <style>{`
        @keyframes gmPulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,35,111,.4); border-radius: 50%;}50%{box-shadow:0 0 0 12px rgba(0,35,111,0); border-radius: 50%;} }
        @keyframes gmPing { 75%,100%{transform:scale(2.2);opacity:0;} }
        .custom-leaflet-icon { background: transparent; border: none; }
      `}</style>
      <div className="relative w-full h-full z-[1]">
        <MapContainer center={PALEMBANG} zoom={13} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater points={allPoints} />

          {/* Paths */}
          {floodPositions.length > 0 && (
            <Polyline positions={floodPositions} color="#ba1a1a" weight={6} opacity={0.85} dashArray="10, 10" />
          )}

          {safePositions.length > 0 && (
            <>
              {/* Outline */}
              <Polyline positions={safePositions} color="#ffffff" weight={14} opacity={0.7} />
              {/* Inner */}
              <Polyline positions={safePositions} color="#00236f" weight={8} />
            </>
          )}

          {/* Markers */}
          {origin && <Marker position={[origin.lat, origin.lng]} icon={originIcon} />}
          {destination && <Marker position={[destination.lat, destination.lng]} icon={destIcon} />}

          {floodMarkers?.map((fm, i) => {
            const fi = L.divIcon({
              className: 'custom-leaflet-icon',
              html: floodMarkerHtml(fm.depth),
              iconSize: [42, 70],
              iconAnchor: [21, 54], // Anchor on the point of the pin
            });
            return <Marker key={i} position={[fm.lat, fm.lng]} icon={fi} />;
          })}

        </MapContainer>

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
    </>
  );
}
