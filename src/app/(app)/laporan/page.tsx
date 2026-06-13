"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { api, FloodReport, timeAgo, resolveImageUrl } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { useRouter } from "next/navigation";
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Filter, MoreVertical, Calendar, X, Droplet, MapPin, AlertTriangle, Waves, ImageOff, ThumbsUp, ThumbsDown, ExternalLink, Flag } from 'lucide-react';

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
  const { user } = useAuth();
  const confirmDialog = useConfirm();
  const router = useRouter();
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
    if (!user) {
      const ok = await confirmDialog({
        title: "Perhatian",
        description: "Kamu harus login terlebih dahulu untuk memberikan konfirmasi. Menuju halaman login?",
        confirmText: "Ke Halaman Login",
        cancelText: "Kembali",
        isDanger: false,
      });
      if (ok) router.push("/login");
      return;
    }
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
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          {/* Sort buttons */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar flex-1 min-w-0">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className={`whitespace-nowrap px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[12px] md:text-[14px] font-bold transition-colors ${
                  sort === opt.key
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface text-on-surface border border-outline-variant hover:bg-surface-variant"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          
          {/* Filter Popover */}
          <Popover className="relative shrink-0 flex items-center">
            {({ open }) => (
              <>
                <PopoverButton
                  className={`p-2 rounded-full flex items-center justify-center transition-all outline-none focus:outline-none relative ${
                    hasDateFilter || open ? "bg-primary-container text-on-primary-container shadow-sm" : "bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-variant"
                  }`}
                  title="Filter Tanggal"
                >
                  {hasDateFilter ? <Filter className="w-5 h-5 transition-transform" /> : <MoreVertical className="w-5 h-5 transition-transform" />}
                  {hasDateFilter && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-error rounded-full border-2 border-white" />}
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
                        Rentang Waktu
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
                        {hasDateFilter && (
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
      </div>

      <main className="max-w-3xl mx-auto md:mt-4 md:px-gutter">
        <div className="flex flex-col gap-margin-mobile px-margin-mobile md:px-0">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-xl h-64 animate-pulse border border-surface-variant" />
            ))
          ) : feed.length === 0 ? (
            <div className="text-center py-xl text-on-surface-variant">
              <Droplet className="w-12 h-12 block mx-auto mb-md" />
              <p className="text-body-lg">Belum ada laporan banjir aktif</p>
            </div>
          ) : feed.map((item) => {
            const borderColor = STATUS_BORDER[item.status] ?? "bg-outline";
            const badgeCls    = STATUS_BADGE[item.status] ?? "";
            const iconColor   = ICON_COLOR[item.status] ?? "text-on-surface";
            const confirms    = item._count?.verifications ?? 0;
            // Resolve display image: legacy photoUrl field OR first uploaded photo
            const displayPhoto = resolveImageUrl(item.photoUrl || item.photos?.[0]?.imageUrl || null);
            return (
              <article key={item.id} className="bg-surface rounded-xl shadow-card overflow-hidden border border-surface-variant relative">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderColor}`} />
                <div className="pl-3 pr-4 py-4 flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex justify-between items-start pl-2 gap-2">
                    <div className="flex items-start gap-2 text-on-surface min-w-0">
                      <MapPin className={`w-5 h-5 flex-shrink-0 ${iconColor} mt-0.5`} />
                      <div className="min-w-0">
                        <h3 className="text-h3 font-semibold truncate">{item.title}</h3>
                        <p className="text-body-sm text-on-surface-variant line-clamp-2">
                          {item.district?.name ?? item.address ?? "—"} • {timeAgo(item.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded ${badgeCls} text-[10px] sm:text-xs font-bold gap-1 whitespace-nowrap flex-shrink-0`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{STATUS_LABEL[item.status]}</span>
                      <span className="sm:hidden">{item.status === 'active' ? 'Aktif' : item.status === 'surging' ? 'Naik' : 'Surut'}</span>
                    </span>
                  </div>

                  {/* Photo */}
                  {displayPhoto ? (
                    <div className="rounded-lg overflow-hidden relative mt-1 aspect-video bg-surface-container-highest">
                      <Image src={displayPhoto} alt={item.title} fill className="object-cover" unoptimized />
                      <div className="absolute bottom-2 left-2 bg-inverse-surface/80 text-inverse-on-surface px-2 py-1 rounded backdrop-blur-sm text-label-bold font-bold flex items-center gap-1">
                        <Waves className="w-4 h-4" />
                        Kedalaman: {item.waterDepthCm} cm
                        {(item._count?.photos ?? 0) > 1 && (
                          <span className="ml-1 opacity-80">+{(item._count!.photos) - 1} foto</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-surface-container-highest aspect-video flex items-center justify-center text-on-surface-variant mt-1">
                      <div className="text-center">
                        <ImageOff className="w-10 h-10 mx-auto mb-1 block" />
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
                  <div className="flex flex-wrap sm:flex-nowrap gap-2 mt-2 pt-3 border-t border-surface-variant pl-2">
                    <button
                      onClick={() => handleVote(item.id, "confirm")}
                      disabled={voting[item.id]}
                      className="flex-1 min-w-[120px] bg-primary text-on-primary text-[11px] sm:text-xs font-bold py-2 px-2 sm:px-3 rounded flex items-center justify-center gap-1 hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-60"
                    >
                      <ThumbsUp className="w-4 h-4 md:w-5 md:h-5" />
                      Konfirmasi
                    </button>
                    <Link
                      href={`/laporan/${item.id}`}
                      className="flex-1 min-w-[100px] bg-secondary-container text-on-secondary-container text-[11px] sm:text-xs font-bold py-2 px-2 sm:px-3 rounded flex items-center justify-center gap-1 hover:bg-secondary-fixed-dim transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                      Detail
                    </Link>
                    <button
                      onClick={() => handleVote(item.id, "reject")}
                      disabled={voting[item.id]}
                      className="bg-surface text-on-surface-variant border border-outline-variant text-[11px] sm:text-xs font-bold py-2 px-3 rounded flex items-center justify-center hover:bg-surface-variant transition-colors disabled:opacity-60 shrink-0"
                      title="Laporkan tidak akurat"
                    >
                      <Flag className="w-4 h-4 md:w-5 md:h-5" />
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
