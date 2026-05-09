"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import BottomNav from "@/components/BottomNav";
import DashboardMapClient from "@/components/DashboardMapClient";
import { api, FloodReport, timeAgo, severityColor } from "@/lib/api";

export default function Dashboard() {
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState<number | string>("—");
  const [highestRisk, setHighestRisk] = useState<string>("—");
  const [newReports, setNewReports] = useState<number | string>("—");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const today = new Date().toISOString().split("T")[0];
  const hasFilter = dateFrom || dateTo;

  const setRange = (from: string, to: string) => {
    if (dateFrom === from && dateTo === to) {
      setDateFrom(""); setDateTo("");
    } else {
      setDateFrom(from); setDateTo(to);
    }
  };

  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      try {
        const r = await api.getReports({ sort: "latest", limit: 3 });
        setReports(r.data);
        setNewReports(r.meta.total);

        // Try public stats (works for all users)
        try {
          const pub = await api.getPublicStats();
          setActiveCount(pub.activeReports);
          setHighestRisk(pub.highestRiskDistrict);
        } catch {
          // Fallback: use report data
          const activeReports = r.data.filter(
            (rr) => rr.status === "active" || rr.status === "surging"
          );
          setActiveCount(activeReports.length);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="bg-background text-on-background min-h-screen pb-[90px] md:pb-lg antialiased">
      <main className="px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto space-y-lg pt-lg">

        {/* Info Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="bg-surface-container-lowest p-md rounded-lg ambient-shadow-sm border-l-[4px] border-error flex flex-col justify-between min-h-[120px]">
            <div className="flex justify-between items-start mb-xs">
              <span className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider">Titik Banjir Aktif</span>
              <span className="material-symbols-outlined text-error text-[20px]">water_drop</span>
            </div>
            <div className="text-h1 font-bold text-on-surface">{loading ? "…" : activeCount}</div>
            <div className="text-body-sm text-on-surface-variant mt-xs">Data real-time dari laporan warga</div>
          </div>

          <div className="bg-surface-container-lowest p-md rounded-lg ambient-shadow-sm border-l-[4px] border-warning flex flex-col justify-between min-h-[120px]">
            <div className="flex justify-between items-start mb-xs">
              <span className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider">Area Rawan Tertinggi</span>
              <span className="material-symbols-outlined text-warning text-[20px]">warning</span>
            </div>
            <div className="text-h2 font-bold text-on-surface leading-tight mt-1">{loading ? "…" : highestRisk}</div>
            <div className="text-body-sm text-on-surface-variant mt-xs">Berdasarkan rata-rata kedalaman</div>
          </div>

          <div className="bg-surface-container-lowest p-md rounded-lg ambient-shadow-sm border-l-[4px] border-primary flex flex-col justify-between min-h-[120px]">
            <div className="flex justify-between items-start mb-xs">
              <span className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider">Total Laporan</span>
              <span className="material-symbols-outlined text-primary text-[20px]">add_alert</span>
            </div>
            <div className="text-h1 font-bold text-on-surface">{loading ? "…" : newReports}</div>
            <Link href="/laporan" className="text-body-sm text-primary font-medium mt-xs flex items-center gap-1">
              Lihat semua <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* Map */}
        <section className="bg-surface-container-lowest rounded-xl ambient-shadow-sm border border-outline-variant relative overflow-hidden">
          {/* Map filter bar */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-outline-variant bg-surface-container-low/50">
            <div className="flex items-center gap-2 mr-auto">
              <div className="w-3 h-3 rounded-full bg-error animate-pulse" />
              <span className="text-label-bold font-bold text-on-surface">Live Map</span>
              {hasFilter && (
                <span className="text-body-sm text-on-surface-variant ml-1">
                  — {dateFrom && dateTo ? `${dateFrom} s/d ${dateTo}` : dateFrom ? `Dari ${dateFrom}` : `Sampai ${dateTo}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Quick range buttons */}
              <button
                onClick={() => setRange(today, today)}
                className={`px-3 py-1.5 rounded-lg text-body-sm font-medium border transition-colors ${
                  dateFrom === today && dateTo === today
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container"
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setRange(daysAgo(7), today)}
                className={`px-3 py-1.5 rounded-lg text-body-sm font-medium border transition-colors ${
                  dateFrom === daysAgo(7) && dateTo === today
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container"
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setRange(daysAgo(30), today)}
                className={`px-3 py-1.5 rounded-lg text-body-sm font-medium border transition-colors ${
                  dateFrom === daysAgo(30) && dateTo === today
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container"
                }`}
              >
                30 Hari
              </button>

              {/* Date range inputs */}
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  max={dateTo || today}
                  className="px-2.5 py-1.5 rounded-lg text-body-sm border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 ring-primary outline-none w-[140px]"
                />
                <span className="text-on-surface-variant text-body-sm">—</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom || undefined}
                  max={today}
                  className="px-2.5 py-1.5 rounded-lg text-body-sm border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 ring-primary outline-none w-[140px]"
                />
              </div>

              {hasFilter && (
                <button
                  onClick={() => { setDateFrom(""); setDateTo(""); }}
                  className="px-3 py-1.5 rounded-lg text-body-sm font-medium border border-outline-variant bg-surface text-error hover:bg-error-container transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  Reset
                </button>
              )}
            </div>
          </div>
          <div className="relative h-[420px] md:h-[560px] w-full">
            <DashboardMapClient dateFrom={dateFrom || undefined} dateTo={dateTo || undefined} />
          </div>
        </section>

        {/* Feed Preview */}
        <section className="space-y-4">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-h2 font-bold text-on-surface m-0">Feed Laporan Terkini</h2>
              <p className="text-body-sm text-on-surface-variant mt-1">Laporan dari warga dan petugas di lapangan</p>
            </div>
            <Link href="/laporan" className="text-label-bold font-bold text-primary flex items-center gap-1 hover:underline underline-offset-4">
              Lihat Semua <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {[1,2,3].map(i => (
                <div key={i} className="bg-surface-container rounded-lg h-48 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {reports.map((card) => {
                const colorCls = severityColor(card.severityLevel);
                const borderCls = colorCls.split(" ")[1];
                const bgCls    = colorCls.split(" ")[0];
                const confirms = card._count?.verifications ?? 0;
                // Resolve display image: legacy photoUrl field OR first uploaded photo
                const displayPhoto = card.photoUrl || card.photos?.[0]?.imageUrl || null;
                return (
                  <Link key={card.id} href={`/laporan/${card.id}`} className="bg-surface-container-lowest rounded-lg ambient-shadow-sm border border-outline-variant flex flex-col overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="relative h-32 w-full overflow-hidden bg-surface-container flex items-center justify-center">
                      {displayPhoto ? (
                        <Image src={displayPhoto} alt={card.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                      ) : (
                        <span className="material-symbols-outlined text-[40px] text-outline-variant">image_not_supported</span>
                      )}
                      <div className={`absolute top-2 left-2 ${bgCls} text-white px-2 py-1 rounded text-[10px] tracking-wider uppercase ambient-shadow-sm flex items-center gap-1`}>
                        <span className="material-symbols-outlined text-[12px]">emergency</span>
                        {card.severityLevel === "high" || card.severityLevel === "extreme" ? "Kritis" : "Waspada"}
                      </div>
                    </div>
                    <div className={`p-md flex flex-col flex-1 border-l-[4px] ${borderCls}`}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-h3 font-semibold text-on-surface line-clamp-1 flex-1">{card.title}</h3>
                        <span className="text-body-sm text-on-surface-variant text-[12px] whitespace-nowrap ml-2">{timeAgo(card.createdAt)}</span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-3">{card.description}</p>
                      <div className="mt-auto pt-3 border-t border-surface-variant flex items-center justify-between">
                        <div className="flex gap-3">
                          <div className="flex items-center gap-1 text-on-surface-variant">
                            <span className="material-symbols-outlined text-[16px]">water_drop</span>
                            <span className="text-body-sm font-medium">{card.waterDepthCm}cm</span>
                          </div>
                          <div className="flex items-center gap-1 text-on-surface-variant">
                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                            <span className="text-body-sm font-medium">{card.district?.name ?? "—"}</span>
                          </div>
                        </div>
                        {confirms > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">
                            <span className="material-symbols-outlined text-[12px] mr-1">verified</span> {confirms} konfirmasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-surface text-outline border border-outline-variant text-[10px] font-bold">
                            <span className="material-symbols-outlined text-[12px] mr-1">pending</span> Menunggu
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* FAB */}
      <Link
        href="/buat-laporan"
        className="fixed bottom-[90px] md:bottom-lg right-margin-mobile md:right-margin-desktop z-[1100] bg-primary text-on-primary px-5 py-4 rounded-full ambient-shadow-md flex items-center gap-2 hover:bg-on-primary-fixed-variant transition-all hover:scale-105 active:scale-95 border-2 border-primary-container"
      >
        <span className="material-symbols-outlined text-[24px]">add_box</span>
        <span className="text-label-bold font-bold tracking-widest uppercase">Lapor Banjir</span>
      </Link>

      <BottomNav active="dashboard" />
    </div>
  );
}
