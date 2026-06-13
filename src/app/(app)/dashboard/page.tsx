"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import BottomNav from "@/components/BottomNav";
import DashboardMapClient from "@/components/DashboardMapClient";
import { api, FloodReport, timeAgo, severityColor, resolveImageUrl } from "@/lib/api";
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Droplet, AlertTriangle, BellPlus, ArrowRight, Filter, MoreVertical, Calendar, X, ChevronRight, ImageOff, MapPin, CheckCircle, Clock, PlusSquare } from "lucide-react";

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
              <Droplet className="w-5 h-5 text-error" />
            </div>
            <div className="text-h1 font-bold text-on-surface">{loading ? "…" : activeCount}</div>
            <div className="text-body-sm text-on-surface-variant mt-xs">Data real-time dari laporan warga</div>
          </div>

          <div className="bg-surface-container-lowest p-md rounded-lg ambient-shadow-sm border-l-[4px] border-warning flex flex-col justify-between min-h-[120px]">
            <div className="flex justify-between items-start mb-xs">
              <span className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider">Area Rawan Tertinggi</span>
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div className="text-h2 font-bold text-on-surface leading-tight mt-1">{loading ? "…" : highestRisk}</div>
            <div className="text-body-sm text-on-surface-variant mt-xs">Berdasarkan rata-rata kedalaman</div>
          </div>

          <div className="bg-surface-container-lowest p-md rounded-lg ambient-shadow-sm border-l-[4px] border-primary flex flex-col justify-between min-h-[120px]">
            <div className="flex justify-between items-start mb-xs">
              <span className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider">Total Laporan</span>
              <BellPlus className="w-5 h-5 text-primary" />
            </div>
            <div className="text-h1 font-bold text-on-surface">{loading ? "…" : newReports}</div>
            <Link href="/laporan" className="text-body-sm text-primary font-medium mt-xs flex items-center gap-1">
               Lihat semua <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </section>

        {/* Map */}
        <section className="bg-surface-container-lowest rounded-xl ambient-shadow-sm border border-outline-variant relative overflow-hidden">
          {/* Map filter bar */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-outline-variant bg-surface-container-low/50 relative z-40">
            <div className="flex items-center gap-2 mr-auto">
              <div className="w-3 h-3 rounded-full bg-error animate-pulse" />
              <span className="text-label-bold font-bold text-on-surface">Live Map</span>
              {hasFilter && (
                <span className="text-body-sm text-on-surface-variant ml-1 hidden sm:inline">
                  — {dateFrom && dateTo ? `${dateFrom} s/d ${dateTo}` : dateFrom ? `Dari ${dateFrom}` : `Sampai ${dateTo}`}
                </span>
              )}
            </div>

            <Popover className="relative shrink-0 flex items-center">
              {({ open }) => (
                <>
                  <PopoverButton
                    className={`p-2 rounded-full flex items-center justify-center transition-all outline-none focus:outline-none relative ${
                      hasFilter || open ? "bg-primary-container text-on-primary-container shadow-sm" : "bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-variant"
                    }`}
                    title="Filter Tanggal"
                  >
                    {hasFilter ? <Filter className="w-5 h-5 transition-transform" /> : <MoreVertical className="w-5 h-5 transition-transform" />}
                    {hasFilter && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-error rounded-full border-2 border-white" />}
                  </PopoverButton>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1 scale-95"
                    enterTo="opacity-100 translate-y-0 scale-100"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0 scale-100"
                    leaveTo="opacity-0 translate-y-1 scale-95"
                  >
                  <PopoverPanel className="absolute right-0 top-full mt-3 w-[300px] sm:w-[360px] bg-surface rounded-2xl shadow-xl border border-outline-variant p-4 z-50 origin-top-right ring-1 ring-black ring-opacity-5">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-h3 font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/30 pb-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          Rentang Waktu Peta
                        </h3>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => setRange(today, today)} className={`py-2 rounded-lg text-[13px] font-semibold border transition-colors ${dateFrom === today && dateTo === today ? "bg-primary text-on-primary border-primary shadow-sm" : "bg-surface text-on-surface border-outline-variant hover:bg-surface-container"}`}>Hari Ini</button>
                          <button onClick={() => setRange(daysAgo(7), today)} className={`py-2 rounded-lg text-[13px] font-semibold border transition-colors ${dateFrom === daysAgo(7) && dateTo === today ? "bg-primary text-on-primary border-primary shadow-sm" : "bg-surface text-on-surface border-outline-variant hover:bg-surface-container"}`}>7 Hari</button>
                          <button onClick={() => setRange(daysAgo(30), today)} className={`py-2 rounded-lg text-[13px] font-semibold border transition-colors ${dateFrom === daysAgo(30) && dateTo === today ? "bg-primary text-on-primary border-primary shadow-sm" : "bg-surface text-on-surface border-outline-variant hover:bg-surface-container"}`}>30 Hari</button>
                        </div>
                        
                        <div className="flex flex-col gap-2 mt-2">
                          <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Kustom Waktu</label>
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} max={dateTo || today} className="w-full sm:flex-1 px-2.5 py-2 rounded-lg text-body-sm border border-outline-variant bg-surface text-on-surface focus:border-primary outline-none" />
                            <span className="text-on-surface-variant hidden sm:block">—</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} min={dateFrom || undefined} max={today} className="w-full sm:flex-1 px-2.5 py-2 rounded-lg text-body-sm border border-outline-variant bg-surface text-on-surface focus:border-primary outline-none" />
                          </div>
                          {hasFilter && (
                            <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="mt-2 w-full py-2 rounded-lg text-label-bold font-bold bg-error/10 text-error hover:bg-error-container transition-colors flex items-center justify-center gap-1 border border-error/20">
                              <X className="w-4 h-4" /> Reset Filter
                            </button>
                          )}
                        </div>
                      </div>
                    </PopoverPanel>
                  </Transition>
                </>
              )}
            </Popover>
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
              Lihat Semua <ChevronRight className="w-4 h-4" />
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
                const displayPhoto = resolveImageUrl(card.photoUrl || card.photos?.[0]?.imageUrl || null);
                return (
                  <Link key={card.id} href={`/laporan/${card.id}`} className="bg-surface-container-lowest rounded-lg ambient-shadow-sm border border-outline-variant flex flex-col overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="relative h-32 w-full overflow-hidden bg-surface-container flex items-center justify-center">
                      {displayPhoto ? (
                        <Image src={displayPhoto} alt={card.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                      ) : (
                        <ImageOff className="w-10 h-10 text-outline-variant" />
                      )}
                      <div className={`absolute top-2 left-2 ${bgCls} text-white px-2 py-1 rounded text-[10px] tracking-wider uppercase ambient-shadow-sm flex items-center gap-1`}>
                        <AlertTriangle className="w-3 h-3" />
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
                            <Droplet className="w-4 h-4" />
                            <span className="text-body-sm font-medium">{card.waterDepthCm}cm</span>
                          </div>
                          <div className="flex items-center gap-1 text-on-surface-variant">
                            <MapPin className="w-4 h-4" />
                            <span className="text-body-sm font-medium">{card.district?.name ?? "—"}</span>
                          </div>
                        </div>
                        {confirms > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3 mr-1" /> {confirms} konfirmasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-surface text-outline border border-outline-variant text-[10px] font-bold">
                            <Clock className="w-3 h-3 mr-1" /> Menunggu
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
        <PlusSquare className="w-6 h-6" />
        <span className="text-label-bold font-bold tracking-widest uppercase">Lapor Banjir</span>
      </Link>

      <BottomNav active="dashboard" />
    </div>
  );
}
