"use client";

import dynamic from "next/dynamic";
import type { DashboardMapProps } from "./DashboardMapImpl";

const DashboardMapImpl = dynamic<DashboardMapProps>(() => import("./DashboardMapImpl"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />,
});

export type { DashboardMapProps }

export default function DashboardMap(props: DashboardMapProps) {
  return <DashboardMapImpl {...props} />;
}
