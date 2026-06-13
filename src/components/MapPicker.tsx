"use client";

import dynamic from "next/dynamic";
import type { MapPickerProps } from "./MapPickerImpl";

const MapPickerImpl = dynamic<MapPickerProps>(() => import("./MapPickerImpl"), {
  ssr: false,
  loading: () => <div className="w-full h-[320px] bg-slate-100 animate-pulse rounded-xl" />,
});

export type { MapPickerProps };

export default function MapPicker(props: MapPickerProps) {
  return <MapPickerImpl {...props} />;
}
