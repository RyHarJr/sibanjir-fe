"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { api, FloodReport, timeAgo } from "@/lib/api";
import { toast } from "react-hot-toast";

type SortType = "latest" | "deepest" | "confidence";

const SORT_OPTIONS: { key: SortType; label: string }[] = [
  { key: "latest", label: "Terbaru" },
  { key: "deepest", label: "Terparah" },
  { key: "confidence", label: "Terverifikasi" },
];

const STATUS_BORDER: Record<string, string> = {
  active: "bg-error", surging: "bg-warning", receded: "bg-secondary",
};
const STATUS_BADGE: Record<string, string> = {
  active: "bg-error-container text-on-error-container",
  surging: "bg-tertiary-container text-on-tertiary-container",
  receded: "bg-surface-container text-on-surface-variant",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Masih aktif", surging: "Meningkat", receded: "Sudah surut",
};
const ICON_COLOR: Record<string, string> = {
  active: "text-error", surging: "text-warning", receded: "text-secondary",
};

export default function FeedLaporan() {
  const [feed, setFeed]       = useState<FloodReport[]>([]);
  const [sort, setSort]       = useState<SortType>("latest");
  const [loading, setLoading] = useState(true);
  const [voting, setVoting]   = useState<Record<number, boolean>>({});
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo]     = useState<string>("");

  const today = new Date().toISOString().split("T")[0];
  const hasDateFilter = dateFrom || dateTo;
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().split("T")[0];

  const load = useCallback((s: SortType, from?: string, to?: string) => {
    setLoading(true);
    api.getReports({ sort: s, limit: 20, dateFrom: from || undefined, dateTo: to || undefined })
      .then(r => setFeed(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(sort, dateFrom, dateTo); }, [sort, dateFrom, dateTo, load]);

  const handleVote = async (id: number, vote: "confirm" | "reject") => {
    if (voting[id]) return;
    setVoting(v => ({ ...v, [id]: true }));
    try {
      await api.verifyReport(id, vote);
      load(sort, dateFrom, dateTo);
      toast.success("Berhasil memberikan vote");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setVoting(v => ({ ...v, [id]: false }));
    }
  };

  const setRange = (from: string, to: string) => {
    if (dateFrom === from && dateTo === to) {
      setDateFrom(""); setDateTo("");
    } else {
      setDateFrom(from); setDateTo(to);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen pb-20">
      {/* Sticky filters */}
      <div className="sticky top-16 z-40 bg-background/90 backdrop-blur-sm py-3 px-margin-mobile md:px-0 border-b border-surface-variant mb-4">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Sort buttons */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-label-bold font-bold transition-colors ${
                  sort === opt.key
                    ? "bg-primary text-on-primary"
                    : "bg-surface text-on-surface border border-outline-variant hover:bg-surface-variant"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Date range filter */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant flex-shrink-0">calendar_month</span>
            <button onClick={() => setRange(today, today)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-body-sm font-medium border transition-colors ${dateFrom === today && dateTo === today ? "bg-primary text-on-primary border-primary" : "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container"}`}>Hari Ini</button>
            <button onClick={() => setRange(daysAgo(7), today)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-body-sm font-medium border transition-colors ${dateFrom === daysAgo(7) && dateTo === today ? "bg-primary text-on-primary border-primary" : "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container"}`}>7 Hari</button>
            <button onClick={() => setRange(daysAgo(30), today)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-body-sm font-medium border transition-colors ${dateFrom === daysAgo(30) && dateTo === today ? "bg-primary text-on-primary border-primary" : "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container"}`}>30 Hari</button>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} max={dateTo || today} className="px-2 py-1.5 rounded-lg text-body-sm border border-outline-variant bg-surface text-on-surface focus:border-primary outline-none w-[130px] flex-shrink-0" />
            <span className="text-on-surface-variant text-body-sm flex-shrink-0">—</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} min={dateFrom || undefined} max={today} className="px-2 py-1.5 rounded-lg text-body-sm border border-outline-variant bg-surface text-on-surface focus:border-primary outline-none w-[130px] flex-shrink-0" />
            {hasDateFilter && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="whitespace-nowrap px-2.5 py-1.5 rounded-lg text-body-sm font-medium border border-outline-variant bg-surface text-error hover:bg-error-container transition-colors flex items-center gap-1 flex-shrink-0">
                <span className="material-symbols-outlined text-[14px]">close</span>Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto md:mt-4 md:px-gutter">
        <div className="flex flex-col gap-margin-mobile px-margin-mobile md:px-0">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-xl h-64 animate-pulse border border-surface-variant" />
            ))
          ) : feed.length === 0 ? (
            <div className="text-center py-xl text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] mb-md block">water_drop</span>
              <p className="text-body-lg">Belum ada laporan banjir aktif</p>
            </div>
          ) : feed.map((item) => {
            const borderColor = STATUS_BORDER[item.status] ?? "bg-outline";
            const badgeCls    = STATUS_BADGE[item.status] ?? "";
            const iconColor   = ICON_COLOR[item.status] ?? "text-on-surface";
            const confirms    = item._count?.verifications ?? 0;
            // Resolve display image: legacy photoUrl field OR first uploaded photo
            const displayPhoto = item.photoUrl || item.photos?.[0]?.imageUrl || null;
            return (
              <article key={item.id} className="bg-surface rounded-xl shadow-card overflow-hidden border border-surface-variant relative">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderColor}`} />
                <div className="pl-3 pr-4 py-4 flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex justify-between items-start pl-2">
                    <div className="flex items-center gap-2 text-on-surface">
                      <span className={`material-symbols-outlined ${iconColor}`}>location_on</span>
                      <div>
                        <h3 className="text-h3 font-semibold">{item.title}</h3>
                        <p className="text-body-sm text-on-surface-variant">
                          {item.district?.name ?? item.address ?? "—"} • {timeAgo(item.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded ${badgeCls} text-label-bold font-bold gap-1 whitespace-nowrap ml-2`}>
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>

                  {/* Photo */}
                  {displayPhoto ? (
                    <div className="rounded-lg overflow-hidden relative mt-1 aspect-video bg-surface-container-highest">
                      <Image src={displayPhoto} alt={item.title} fill className="object-cover" unoptimized />
                      <div className="absolute bottom-2 left-2 bg-inverse-surface/80 text-inverse-on-surface px-2 py-1 rounded backdrop-blur-sm text-label-bold font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">water</span>
                        Kedalaman: {item.waterDepthCm} cm
                        {(item._count?.photos ?? 0) > 1 && (
                          <span className="ml-1 opacity-80">+{(item._count!.photos) - 1} foto</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-surface-container-highest aspect-video flex items-center justify-center text-on-surface-variant mt-1">
                      <div className="text-center">
                        <span className="material-symbols-outlined text-[40px] block mb-1">image_not_supported</span>
                        <span className="text-body-sm">Kedalaman: {item.waterDepthCm} cm</span>
                      </div>
                    </div>
                  )}

                  {/* Confirm count */}
                  <div className="flex items-center gap-2 pl-2 mt-1">
                    <span className="text-body-sm text-on-surface-variant">
                      {confirms > 0 ? `Dikonfirmasi ${confirms} warga` : "Belum ada konfirmasi"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-2 pt-3 border-t border-surface-variant pl-2">
                    <button
                      onClick={() => handleVote(item.id, "confirm")}
                      disabled={voting[item.id]}
                      className="flex-1 bg-primary text-on-primary text-label-bold font-bold py-2 px-3 rounded flex items-center justify-center gap-1 hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                      Konfirmasi
                    </button>
                    <Link
                      href={`/laporan/${item.id}`}
                      className="flex-1 bg-secondary-container text-on-secondary-container text-label-bold font-bold py-2 px-3 rounded flex items-center justify-center gap-1 hover:bg-secondary-fixed-dim transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      Detail
                    </Link>
                    <button
                      onClick={() => handleVote(item.id, "reject")}
                      disabled={voting[item.id]}
                      className="bg-surface text-on-surface-variant border border-outline-variant text-label-bold font-bold py-2 px-3 rounded flex items-center justify-center hover:bg-surface-variant transition-colors disabled:opacity-60"
                      title="Laporkan tidak akurat"
                    >
                      <span className="material-symbols-outlined text-[18px]">flag</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
      <BottomNav active="laporan" />
    </div>
  );
}
