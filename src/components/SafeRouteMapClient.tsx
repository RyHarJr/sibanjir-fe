"use client";
import dynamic from "next/dynamic";

const SafeRouteMap = dynamic(() => import("./SafeRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface-container flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-on-surface-variant">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-body-sm">Memuat peta...</span>
      </div>
    </div>
  ),
});

interface RoutePoint {
  lat: number;
  lng: number;
}

interface SafeRouteMapClientProps {
  origin?: RoutePoint | null;
  destination?: RoutePoint | null;
  safeRoute?: RoutePoint[];
  floodedRoute?: RoutePoint[];
  floodMarkers?: { lat: number; lng: number; depth: string }[];
  isLoading?: boolean;
}

export default function SafeRouteMapClient(props: SafeRouteMapClientProps) {
  return <SafeRouteMap {...props} />;
}
