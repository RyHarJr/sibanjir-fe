"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import SafeRouteMapClient from "@/components/SafeRouteMapClient";
import { api, SafeRouteData } from "@/lib/api";

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface GeoSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface Coords {
  lat: number;
  lng: number;
}
// Palembang center + bounding box
const PLB_CENTER = { lat: -2.9761, lng: 104.7754 };
const PALEMBANG_VIEWBOX = "104.6,-2.85,104.95,-3.1";

/* ── Nominatim search (addresses + some POIs) ─────────────────────────────── */
async function searchNominatim(query: string): Promise<GeoSuggestion[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "6",
      countrycodes: "id",
      viewbox: PALEMBANG_VIEWBOX,
      bounded: "0",
      addressdetails: "1",
    });
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { "User-Agent": "SiBanjir-Palembang/1.0" } }
    );
    if (!res.ok) return [];
    const data: any[] = await res.json();
    return data.map((d) => ({
      display_name: d.display_name,
      lat: d.lat,
      lon: d.lon,
    }));
  } catch {
    return [];
  }
}

/* ── Photon search (fuzzy text, better ranking for businesses) ────────────── */
async function searchPhoton(query: string): Promise<GeoSuggestion[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      lat: String(PLB_CENTER.lat),
      lon: String(PLB_CENTER.lng),
      limit: "6",
      lang: "default",
    });
    const res = await fetch(`https://photon.komoot.io/api/?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features ?? []).map((f: any) => {
      const props = f.properties || {};
      const [lon, lat] = f.geometry?.coordinates ?? [0, 0];
      const parts = [props.name, props.street, props.city, props.state].filter(Boolean);
      return {
        display_name: parts.join(", ") || props.label || `${lat}, ${lon}`,
        lat: String(lat),
        lon: String(lon),
      };
    });
  } catch {
    return [];
  }
}

/* ── Deduplicate by proximity (within ~200m) ─────────────────────────────── */
function dedupeResults(results: GeoSuggestion[]): GeoSuggestion[] {
  const out: GeoSuggestion[] = [];
  for (const r of results) {
    const dup = out.some(
      (o) =>
        Math.abs(parseFloat(o.lat) - parseFloat(r.lat)) < 0.002 &&
        Math.abs(parseFloat(o.lon) - parseFloat(r.lon)) < 0.002
    );
    if (!dup) out.push(r);
  }
  return out;
}

/* ── Combined multi-source search ────────────────────────────────────────── */
async function geocodeMultiSource(query: string): Promise<GeoSuggestion[]> {
  if (query.length < 3) return [];

  // Build multiple queries for better coverage
  const baseQuery = query.trim();
  const palembangQuery = baseQuery.toLowerCase().includes("palembang")
    ? baseQuery
    : `${baseQuery} Palembang`;

  // Search in parallel: Nominatim (biased + unbiased) + Photon
  const [nominatimBiased, photonResults] = await Promise.all([
    searchNominatim(palembangQuery),
    searchPhoton(baseQuery),
  ]);

  // Merge: Photon results first (usually better for businesses), then Nominatim
  const merged = [...photonResults, ...nominatimBiased];
  return dedupeResults(merged).slice(0, 8);
}

/* ── Reverse-geocode with Nominatim ──────────────────────────────────────── */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "User-Agent": "SiBanjir-Palembang/1.0" } }
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}


/* ── Helpers ───────────────────────────────────────────────────────────────── */
function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} mnt`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs} jam ${rem} mnt` : `${hrs} jam`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function SafeRoutePage() {
  // ── Input state ──────────────────────────────────────────────────────────
  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");
  const [originCoords, setOriginCoords] = useState<Coords | null>(null);
  const [destCoords, setDestCoords] = useState<Coords | null>(null);

  // ── Suggestion dropdowns ─────────────────────────────────────────────────
  const [originSuggestions, setOriginSuggestions] = useState<GeoSuggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<GeoSuggestion[]>([]);
  const [showOriginList, setShowOriginList] = useState(false);
  const [showDestList, setShowDestList] = useState(false);

  // ── Route data ───────────────────────────────────────────────────────────
  const [routeData, setRouteData] = useState<SafeRouteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Date filter ─────────────────────────────────────────────────────────
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const today = new Date().toISOString().split("T")[0];
  const hasDateFilter = dateFrom || dateTo;
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().split("T")[0];
  const setRange = (from: string, to: string) => {
    if (dateFrom === from && dateTo === to) { setDateFrom(""); setDateTo(""); }
    else { setDateFrom(from); setDateTo(to); }
  };

  // ── Initial flood markers (shown before route search) ───────────────────
  const [initialFloodMarkers, setInitialFloodMarkers] = useState<
    { lat: number; lng: number; depth: string }[]
  >([]);

  // ── Debounce timers ──────────────────────────────────────────────────────
  const originTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const destTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Fetch active flood reports (re-fetch when date filter changes) ──────
  useEffect(() => {
    api.getMapReports(dateFrom || undefined, dateTo || undefined)
      .then((res) => {
        const markers = res.data
          .filter((r) => r.status === "active" || r.status === "surging")
          .map((r) => ({
            lat: r.latitude,
            lng: r.longitude,
            depth: `${r.waterDepthCm}cm`,
          }));
        setInitialFloodMarkers(markers);
      })
      .catch(() => {});
  }, [dateFrom, dateTo]);


  // ── Geocode with debounce ────────────────────────────────────────────────
  const handleOriginChange = useCallback((value: string) => {
    setOriginText(value);
    setOriginCoords(null);
    setRouteData(null);
    setError(null);
    clearTimeout(originTimerRef.current);
    if (value.length >= 3) {
      originTimerRef.current = setTimeout(async () => {
        const results = await geocodeMultiSource(value);
        setOriginSuggestions(results);
        setShowOriginList(true);
      }, 300);
    } else {
      setOriginSuggestions([]);
      setShowOriginList(false);
    }
  }, []);

  const handleDestChange = useCallback((value: string) => {
    setDestText(value);
    setDestCoords(null);
    setRouteData(null);
    setError(null);
    clearTimeout(destTimerRef.current);
    if (value.length >= 3) {
      destTimerRef.current = setTimeout(async () => {
        const results = await geocodeMultiSource(value);
        setDestSuggestions(results);
        setShowDestList(true);
      }, 300);
    } else {
      setDestSuggestions([]);
      setShowDestList(false);
    }
  }, []);

  // ── Select suggestion ────────────────────────────────────────────────────
  const selectOrigin = useCallback((s: GeoSuggestion) => {
    const shortName = s.display_name.split(",").slice(0, 3).join(",").trim();
    setOriginText(shortName);
    setOriginSuggestions([]);
    setShowOriginList(false);
    setOriginCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
  }, []);

  const selectDest = useCallback((s: GeoSuggestion) => {
    const shortName = s.display_name.split(",").slice(0, 3).join(",").trim();
    setDestText(shortName);
    setDestSuggestions([]);
    setShowDestList(false);
    setDestCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
  }, []);

  // ── Use my location ─────────────────────────────────────────────────────
  const useMyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung oleh browser Anda.");
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setOriginCoords({ lat, lng });
        const name = await reverseGeocode(lat, lng);
        const shortName = name.split(",").slice(0, 3).join(",").trim();
        setOriginText(shortName);
        setIsLocating(false);
      },
      (err) => {
        setError("Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── Swap origin ↔ destination ────────────────────────────────────────────
  const swapLocations = useCallback(() => {
    const tmpText = originText;
    const tmpCoords = originCoords;
    setOriginText(destText);
    setOriginCoords(destCoords);
    setDestText(tmpText);
    setDestCoords(tmpCoords);
    setRouteData(null);
  }, [originText, originCoords, destText, destCoords]);

  // ── Search route ─────────────────────────────────────────────────────────
  const searchRoute = useCallback(async () => {
    if (!originCoords || !destCoords) {
      setError("Pilih lokasi awal dan tujuan terlebih dahulu.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setRouteData(null);
    try {
      const res = await api.getSafeRoute(
        originCoords.lat,
        originCoords.lng,
        destCoords.lat,
        destCoords.lng
      );
      setRouteData(res.data);
    } catch (err: any) {
      setError(err.message || "Gagal menghitung rute. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, [originCoords, destCoords]);

  // ── Open Google Maps navigation ──────────────────────────────────────────
  const startNavigation = useCallback(() => {
    if (!originCoords || !destCoords || !routeData?.safeRoute) return;

    // Sample waypoints from the safe route to guide Google Maps along the flood-free path
    const routePoints = routeData.safeRoute.points;
    const waypointCount = Math.min(8, Math.max(2, Math.floor(routePoints.length / 50)));
    const step = Math.floor(routePoints.length / (waypointCount + 1));
    const waypoints = [];
    for (let i = 1; i <= waypointCount; i++) {
      const idx = Math.min(i * step, routePoints.length - 1);
      waypoints.push(`${routePoints[idx].lat},${routePoints[idx].lng}`);
    }

    const waypointStr = waypoints.length > 0 ? `/${waypoints.join("/")}` : "";
    const url = `https://www.google.com/maps/dir/${originCoords.lat},${originCoords.lng}${waypointStr}/${destCoords.lat},${destCoords.lng}`;
    window.open(url, "_blank");
  }, [originCoords, destCoords, routeData]);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      setTimeout(() => {
        setShowOriginList(false);
        setShowDestList(false);
      }, 200);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  /* ── Render ─────────────────────────────────────────────────────────────── */
  const canSearch = !!originCoords && !!destCoords && !isLoading;
  const safe = routeData?.safeRoute;
  const flooded = routeData?.floodedRoute;

  return (
    <div className="bg-surface text-on-surface antialiased h-screen overflow-hidden flex flex-col">
      <main className="relative flex-1 w-full mb-[72px] md:mb-0 flex flex-col bg-surface-container">
        {/* ── Toggle Button ───────────────────────────────────────────── */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className={`absolute z-30 flex items-center gap-1.5 bg-surface/90 backdrop-blur-md text-on-surface px-3 py-2.5 shadow-lg border border-outline-variant/50 hover:bg-surface-container-high transition-all duration-300 active:scale-95 ${
            sidebarOpen
              ? "top-3 right-3 rounded-lg md:top-4 md:left-[436px] md:right-auto md:rounded-r-xl md:rounded-l-none"
              : "top-3 left-3 rounded-lg"
          }`}
          title={sidebarOpen ? "Tutup panel" : "Buka panel navigasi"}
        >
          <span className="material-symbols-outlined text-[20px] text-primary">
            {sidebarOpen ? "close" : "directions"}
          </span>
          {!sidebarOpen && (
            <span className="text-label-bold font-bold text-[12px] tracking-wide hidden md:inline">NAVIGASI</span>
          )}
        </button>

        {/* ── Left Panel (floating) ──────────────────────────────────── */}
        <section className={`z-20 w-full md:w-[420px] flex flex-col bg-surface/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] absolute top-0 left-0 h-auto max-h-[80vh] md:max-h-full md:h-full overflow-hidden rounded-b-2xl md:rounded-none md:rounded-r-2xl border-b md:border-b-0 md:border-r border-outline-variant/30 transition-all duration-300 ease-in-out ${
          sidebarOpen
            ? "translate-y-0 md:translate-x-0 opacity-100"
            : "-translate-y-full md:translate-y-0 md:-translate-x-full opacity-0 pointer-events-none"
        }`}>
          <div className="p-md flex flex-col gap-md flex-shrink-0 bg-surface z-10">
            <h1 className="text-h2 font-bold text-on-surface">Navigasi Darurat</h1>

            {/* ── Date filter ─────────────────────────────────────────── */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar -mt-1">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant flex-shrink-0">calendar_month</span>
              <button onClick={() => setRange(today, today)} className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${dateFrom === today && dateTo === today ? "bg-primary text-on-primary border-primary" : "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container"}`}>Hari Ini</button>
              <button onClick={() => setRange(daysAgo(7), today)} className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${dateFrom === daysAgo(7) && dateTo === today ? "bg-primary text-on-primary border-primary" : "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container"}`}>7 Hari</button>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} max={dateTo || today} className="px-1.5 py-1 rounded-md text-[11px] border border-outline-variant bg-surface text-on-surface focus:border-primary outline-none w-[115px] flex-shrink-0" />
              <span className="text-on-surface-variant text-[11px]">—</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} min={dateFrom || undefined} max={today} className="px-1.5 py-1 rounded-md text-[11px] border border-outline-variant bg-surface text-on-surface focus:border-primary outline-none w-[115px] flex-shrink-0" />
              {hasDateFilter && (
                <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="p-1 rounded-md border border-outline-variant bg-surface text-error hover:bg-error-container transition-colors flex-shrink-0" title="Reset filter">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* ── Location inputs ───────────────────────────────────────── */}
            <div className="bg-surface-container-low p-md rounded-xl flex flex-col gap-sm relative shadow-sm border border-outline-variant">
              {/* Origin */}
              <div className="relative">
                <div className="flex items-center gap-sm bg-surface p-sm rounded border border-outline-variant focus-within:border-primary focus-within:ring-1 ring-primary transition-all">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    my_location
                  </span>
                  <input
                    type="text"
                    placeholder="Masukkan lokasi awal..."
                    value={originText}
                    onChange={(e) => handleOriginChange(e.target.value)}
                    onFocus={() => originSuggestions.length > 0 && setShowOriginList(true)}
                    className="w-full bg-transparent border-none outline-none text-body-md text-on-surface placeholder:text-on-surface-variant/50"
                  />
                  {originCoords && (
                    <span className="material-symbols-outlined text-[18px] text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                </div>
                {/* Origin suggestions dropdown */}
                {showOriginList && originSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant rounded-lg shadow-lg z-50 max-h-[200px] overflow-y-auto">
                    {originSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => selectOrigin(s)}
                        className="w-full text-left px-3 py-2.5 text-body-sm hover:bg-surface-container-high transition-colors flex items-start gap-2 border-b border-outline-variant/30 last:border-b-0"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5 flex-shrink-0">
                          location_on
                        </span>
                        <span className="text-on-surface line-clamp-2">{s.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Connector line */}
              <div className="absolute left-[36px] top-[52px] bottom-[52px] w-[2px] bg-outline-variant z-0" />

              {/* Swap button */}
              <button
                onClick={swapLocations}
                className="absolute right-md top-[50%] -translate-y-1/2 w-[32px] h-[32px] bg-surface rounded-full flex items-center justify-center border border-outline-variant hover:bg-surface-container-high transition-colors z-10 shadow-sm text-secondary active:scale-90"
              >
                <span className="material-symbols-outlined text-[18px]">swap_vert</span>
              </button>

              {/* Destination */}
              <div className="relative">
                <div className="flex items-center gap-sm bg-surface p-sm rounded border border-outline-variant focus-within:border-primary focus-within:ring-1 ring-primary transition-all z-10">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    location_on
                  </span>
                  <input
                    type="text"
                    placeholder="Masukkan tujuan..."
                    value={destText}
                    onChange={(e) => handleDestChange(e.target.value)}
                    onFocus={() => destSuggestions.length > 0 && setShowDestList(true)}
                    className="w-full bg-transparent border-none outline-none text-body-md text-on-surface placeholder:text-on-surface-variant/50"
                  />
                  {destCoords && (
                    <span className="material-symbols-outlined text-[18px] text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                </div>
                {/* Destination suggestions dropdown */}
                {showDestList && destSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant rounded-lg shadow-lg z-50 max-h-[200px] overflow-y-auto">
                    {destSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => selectDest(s)}
                        className="w-full text-left px-3 py-2.5 text-body-sm hover:bg-surface-container-high transition-colors flex items-start gap-2 border-b border-outline-variant/30 last:border-b-0"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary mt-0.5 flex-shrink-0">
                          location_on
                        </span>
                        <span className="text-on-surface line-clamp-2">{s.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Action buttons ────────────────────────────────────────── */}
            <div className="flex gap-sm">
              <button
                onClick={useMyLocation}
                disabled={isLocating}
                className="flex-1 flex items-center justify-center gap-xs bg-surface-container-high text-on-surface-variant text-body-sm font-medium py-2 px-3 rounded-lg border border-outline-variant hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isLocating ? "hourglass_top" : "gps_fixed"}
                </span>
                {isLocating ? "Mencari..." : "Lokasi Saya"}
              </button>
              <button
                onClick={searchRoute}
                disabled={!canSearch}
                className="flex-[2] flex items-center justify-center gap-xs bg-primary text-on-primary text-body-sm font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                {isLoading ? "Menghitung..." : "Cari Rute Aman"}
              </button>
            </div>

            {/* ── Error message ─────────────────────────────────────────── */}
            {error && (
              <div className="bg-error-container text-on-error-container text-body-sm p-sm rounded-lg flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}
          </div>

          {/* ── Route results ─────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-md pt-0 flex flex-col gap-md hide-scrollbar">
            {routeData && (
              <>
                <h3 className="text-h3 font-semibold text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[20px]">alt_route</span>
                  Pilihan Rute
                </h3>

                {/* ── Warning Banner ──────────────────────────────────── */}
                {routeData.warningMessage && (
                  <div className={`p-sm rounded-xl flex items-start gap-sm text-body-sm font-medium border ${
                    routeData.safeRoute.isSafe
                      ? "bg-green-50 text-green-800 border-green-200"
                      : routeData.safeRoute.isDetour
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-red-50 text-red-800 border-red-200"
                  }`}>
                    <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-[1px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {routeData.safeRoute.isSafe ? "check_circle" : routeData.safeRoute.isDetour ? "detour" : "flood"}
                    </span>
                    {routeData.warningMessage}
                  </div>
                )}

                {/* ── Safe Route Card ──────────────────────────────────── */}
                {safe && (
                  <div className="bg-primary-container text-on-primary-container p-md rounded-xl border-2 border-primary cursor-pointer shadow-sm relative overflow-hidden flex flex-col gap-xs transition-transform active:scale-[0.98]">
                    <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary" />
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-[2px]">
                        <div className="flex items-center gap-xs flex-wrap">
                          <span className="text-label-bold font-bold text-primary flex items-center gap-xs">
                            <span
                              className="material-symbols-outlined text-[16px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              verified
                            </span>
                            RUTE AMAN
                          </span>
                          {safe.isDetour && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-[2px] rounded-full text-[9px] font-bold tracking-wide flex items-center gap-[3px]">
                              <span className="material-symbols-outlined text-[11px]">alt_route</span>
                              DETOUR
                            </span>
                          )}
                        </div>
                        <span className="text-h2 font-bold mt-xs text-on-primary-container">
                          {formatDuration(safe.duration)}
                        </span>
                      </div>
                      <span className="text-body-md font-medium">
                        {formatDistance(safe.distance)}
                      </span>
                    </div>
                    {safe.summary && (
                      <p className="text-body-sm opacity-90">
                        Via {safe.summary}
                      </p>
                    )}
                    <div className="mt-xs flex gap-sm flex-wrap">
                      <span className={`px-2 py-1 rounded-lg text-label-bold font-bold text-[10px] flex items-center gap-[4px] border ${safe.isSafe ? "bg-green-100 text-green-800 border-green-300" : "bg-surface/50 text-on-primary-container border-primary/20"}`}>
                        <span className="material-symbols-outlined text-[14px]">{safe.isSafe ? "check_circle" : "water_drop"}</span>
                        {safe.isSafe ? "BEBAS BANJIR" : "SEMINIMAL MUNGKIN BANJIR"}
                      </span>
                      {safe.nearbyFloods && safe.nearbyFloods.length > 0 && (
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-[4px]">
                          <span className="material-symbols-outlined text-[12px]">warning</span>
                          {safe.nearbyFloods.length} titik banjir di sekitar rute
                        </span>
                      )}
                    </div>
                  </div>
                )}


                {/* ── Flooded Route Card ───────────────────────────────── */}
                {flooded && (
                  <div className="bg-error-container text-on-error-container p-md rounded-xl border border-error/30 cursor-pointer shadow-sm relative overflow-hidden flex flex-col gap-xs opacity-90 hover:opacity-100 transition-opacity">
                    <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-error" />
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-label-bold font-bold text-error flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[16px]">warning</span>
                          TERDAMPAK BANJIR
                        </span>
                        <span className="text-h2 font-bold mt-xs text-on-error-container">
                          {formatDuration(flooded.duration)}
                        </span>
                      </div>
                      <span className="text-body-md font-medium text-error">
                        {formatDistance(flooded.distance)}
                      </span>
                    </div>
                    {flooded.summary && (
                      <p className="text-body-sm mt-xs opacity-90">
                        Via {flooded.summary}
                      </p>
                    )}
                    <div className="mt-sm flex gap-sm flex-wrap">
                      {flooded.nearbyFloods?.slice(0, 2).map((f, i) => (
                        <span
                          key={i}
                          className="bg-error/10 text-error px-2 py-1 rounded-lg text-label-bold font-bold text-[10px] flex items-center gap-[4px] border border-error/20"
                        >
                          <span className="material-symbols-outlined text-[14px]">waves</span>
                          GENANGAN {f.depth}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── No flooded alternative ───────────────────────────── */}
                {!flooded && safe && (
                  <div className="bg-surface-container text-on-surface-variant p-md rounded-xl border border-outline-variant text-body-sm flex items-center gap-sm">
                    <span className="material-symbols-outlined text-[20px] text-primary">info</span>
                    Hanya 1 rute ditemukan. Tidak ada rute alternatif untuk dibandingkan.
                  </div>
                )}

                {/* ── Navigate button ──────────────────────────────────── */}
                <button
                  onClick={startNavigation}
                  className="w-full mt-sm bg-primary text-on-primary text-h3 font-semibold py-sm rounded-full shadow-md flex items-center justify-center gap-sm hover:bg-on-primary-fixed-variant transition-colors active:scale-[0.97]"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    navigation
                  </span>
                  Mulai Navigasi
                </button>

                {/* ── Flood reports info ────────────────────────────────── */}
                {routeData.totalFloodReports > 0 && (
                  <p className="text-body-sm text-on-surface-variant text-center opacity-70">
                    Berdasarkan {routeData.totalFloodReports} laporan banjir aktif
                  </p>
                )}
              </>
            )}

            {/* ── Empty state ──────────────────────────────────────────── */}
            {!routeData && !isLoading && !error && (
              <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant py-8 gap-3">
                <span className="material-symbols-outlined text-[48px] opacity-30">
                  route
                </span>
                <p className="text-body-sm text-center opacity-60 max-w-[250px]">
                  Masukkan lokasi awal dan tujuan, lalu tekan <strong>Cari Rute Aman</strong> untuk menemukan jalan yang aman dari banjir.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Map Canvas ─────────────────────────────────────────────── */}
        <section className="absolute inset-0 w-full h-full bg-surface-container-highest overflow-hidden">
          <SafeRouteMapClient
            origin={originCoords}
            destination={destCoords}
            safeRoute={routeData?.safeRoute?.points}
            floodedRoute={routeData?.floodedRoute?.points}
            floodMarkers={routeData?.floodMarkers ?? initialFloodMarkers}
            isLoading={isLoading}
          />
        </section>
      </main>

      <BottomNav active="rute" />
    </div>
  );
}
