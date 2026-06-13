"use client";

import dynamic from "next/dynamic";
import type { SafeRouteMapProps } from "./SafeRouteMapImpl";

const SafeRouteMapImpl = dynamic<SafeRouteMapProps>(() => import("./SafeRouteMapImpl"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center animate-pulse">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export type { SafeRouteMapProps };

export default function SafeRouteMap(props: SafeRouteMapProps) {
  return <SafeRouteMapImpl {...props} />;
}
