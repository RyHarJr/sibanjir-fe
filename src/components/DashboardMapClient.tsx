"use client";
import dynamic from "next/dynamic";

const DashboardMap = dynamic(() => import("./DashboardMap"), {
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

interface DashboardMapClientProps {
  dateFrom?: string;
  dateTo?: string;
}

export default function DashboardMapClient({ dateFrom, dateTo }: DashboardMapClientProps) {
  return <DashboardMap dateFrom={dateFrom} dateTo={dateTo} />;
}
