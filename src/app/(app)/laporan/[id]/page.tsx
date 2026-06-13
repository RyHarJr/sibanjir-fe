"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { api, FloodReportDetail, timeAgo, roadAccessLabel, resolveImageUrl } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import { AlertCircle, ArrowLeft, AlertTriangle, Clock, MapPin, User, ThumbsUp, ThumbsDown, AlertOctagon, Car, Waves, Eye, LogIn, Activity, Check, X } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  active: "Aktif", surging: "Meningkat", receded: "Sudah Surut",
};
const STATUS_COLOR: Record<string, string> = {
  active: "bg-error text-on-error",
  surging: "bg-warning text-white",
  receded: "bg-secondary text-on-secondary",
};
const SEVERITY_LABEL: Record<string, string> = {
  low: "Aman", medium: "Waspada", high: "Kritis", extreme: "Bahaya",
};
const CURRENT_LABEL: Record<string, string> = {
  calm: "Tenang", slow: "Lambat", moderate: "Sedang", fast: "Deras",
};

export default function DetailLaporan() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [report, setReport] = useState<FloodReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = async () => {
    try {
      const res = await api.getReport(id);
      setReport(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerify = async (vote: "confirm" | "reject") => {
    if (voting) return;
    setVoting(true);
    try {
      await api.verifyReport(id, vote);
      await fetchReport();
      toast.success("Vote berhasil disimpan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memverifikasi");
    } finally {
      setVoting(false);
    }
  };

  const handleStatusUpdate = async (status: "active" | "surging" | "receded", depthCm: number) => {
    if (updating) return;
    setUpdating(true);
    try {
      await api.updateReport(id, { waterDepthCm: depthCm, status });
      await fetchReport();
      toast.success("Status pembaruan berhasil dikirim");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background text-on-background min-h-screen pb-24">
        <main className="max-w-5xl mx-auto px-margin-mobile md:px-margin-desktop py-md space-y-md">
          <div className="h-8 bg-surface-container rounded animate-pulse w-2/3" />
          <div className="h-4 bg-surface-container rounded animate-pulse w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mt-lg">
            <div className="md:col-span-8 h-64 bg-surface-container rounded-xl animate-pulse" />
            <div className="md:col-span-4 space-y-sm">
              <div className="h-48 bg-surface-container rounded-xl animate-pulse" />
              <div className="h-32 bg-surface-container rounded-xl animate-pulse" />
            </div>
          </div>
        </main>
        <BottomNav active="laporan" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-background text-on-background min-h-screen pb-24 flex flex-col items-center justify-center">
        <AlertCircle className="w-16 h-16 text-outline-variant mb-md" />
        <p className="text-h3 font-semibold text-on-surface mb-sm">{error || "Laporan tidak ditemukan"}</p>
        <Link href="/laporan" className="text-primary font-bold">← Kembali ke Feed</Link>
        <BottomNav active="laporan" />
      </div>
    );
  }

  const roadAccessValue = (access: string): string => {
    const map: Record<string, string> = {
      passable: "Bisa Dilalui",
      motorcycle_only: "Motor Saja",
      difficult: "Sulit Dilalui",
      impassable: "Tidak Bisa",
    };
    return map[access] ?? access;
  };

  const roadAccessColor = (access: string): string => {
    const map: Record<string, string> = {
      passable: "text-on-surface",
      motorcycle_only: "text-on-tertiary-container bg-tertiary-fixed",
      difficult: "text-warning",
      impassable: "text-error bg-error-container",
    };
    return map[access] ?? "text-on-surface";
  };

  const confirms = report.verifications.filter(v => v.vote === "confirm").length;
  const rejects = report.verifications.filter(v => v.vote === "reject").length;
  const isOwner = user?.id === report.userId;

  return (
    <div className="bg-background text-on-background pb-24 md:pb-0">
      <main className="max-w-5xl mx-auto px-margin-mobile md:px-margin-desktop py-md">
        {/* Header */}
        <div className="mb-lg">
          <div className="flex items-center gap-2 mb-sm">
            <Link href="/laporan" className="text-on-surface-variant hover:text-primary transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
          </div>
          <div className="flex justify-between items-start mb-sm">
            <h1 className="text-h1 font-bold text-on-surface">{report.title}</h1>
            <div className={`${STATUS_COLOR[report.status] ?? "bg-outline text-white"} px-3 py-1 rounded-full text-label-bold font-bold flex items-center gap-1 shrink-0 ml-4`}>
              <AlertTriangle className="w-4 h-4" />
              {STATUS_LABEL[report.status] ?? report.status}
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Update terakhir: {timeAgo(report.updatedAt)}
          </p>
          {report.address && (
            <p className="text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {report.address}
              {report.district && ` • ${report.district.name}`}
            </p>
          )}
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {/* Description card */}
          <div className="md:col-span-8 bg-surface rounded-xl p-md shadow-card border border-outline-variant/30">
            <h2 className="text-h3 font-semibold text-on-surface mb-sm">Deskripsi</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">{report.description}</p>
            <div className="mt-md flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                <User className="w-4 h-4" />
                Dilaporkan oleh <span className="font-semibold text-on-surface">{report.user?.name ?? "Anonim"}</span>
              </div>
              <span className="text-body-sm text-on-surface-variant">• {timeAgo(report.createdAt)}</span>
            </div>
            <div className="mt-sm flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded bg-primary-container/10 text-primary text-label-bold font-bold gap-1">
                <ThumbsUp className="w-3.5 h-3.5" /> {confirms}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded bg-error-container text-on-error-container text-label-bold font-bold gap-1">
                <ThumbsDown className="w-3.5 h-3.5" /> {rejects}
              </span>
              <span className="text-body-sm text-on-surface-variant ml-2">
                Skor kepercayaan: <span className="font-bold text-on-surface">{Number(report.confidenceScore).toFixed(1)}%</span>
              </span>
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="md:col-span-4 flex flex-col gap-sm">
            <div className="bg-surface rounded-xl p-md shadow-card border-l-4 border-error">
              <h3 className="text-h3 font-semibold text-on-surface mb-xs">Tinggi Air</h3>
              <div className="flex items-end gap-2 mb-md">
                <span className="text-h1 font-bold text-error">{report.waterDepthCm}</span>
                <span className="text-body-md text-on-surface-variant pb-1">cm</span>
              </div>
              <div className="space-y-sm">
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-sm">
                  <span className="text-body-sm text-on-surface-variant flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 shrink-0" />
                    Tingkat Keparahan
                  </span>
                  <span className="text-label-bold font-bold px-2 py-1 rounded text-on-surface">{SEVERITY_LABEL[report.severityLevel] ?? report.severityLevel}</span>
                </div>
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-sm">
                  <span className="text-body-sm text-on-surface-variant flex items-center gap-2">
                    <Car className="w-4 h-4 shrink-0" />
                    Akses Kendaraan
                  </span>
                  <span className={`text-label-bold font-bold px-2 py-1 rounded ${roadAccessColor(report.roadAccess)}`}>{roadAccessValue(report.roadAccess)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-body-sm text-on-surface-variant flex items-center gap-2">
                    <Waves className="w-4 h-4 shrink-0" />
                    Arus Air
                  </span>
                  <span className="text-label-bold font-bold px-2 py-1 rounded text-on-surface">{CURRENT_LABEL[report.waterCurrent] ?? report.waterCurrent}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {user && !isOwner && (
              <div className="bg-surface rounded-xl p-md shadow-card border border-outline-variant/30 flex flex-col gap-sm">
                <button
                  onClick={() => handleVerify("confirm")}
                  disabled={voting}
                  className="w-full bg-primary text-on-primary text-label-bold font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-60"
                >
                  <Eye className="w-5 h-5" />
                  {voting ? "Memproses..." : "Saya lihat banjir ini"}
                </button>
                <div className="grid grid-cols-2 gap-sm">
                  <button
                    onClick={() => handleStatusUpdate("active", Math.max(report.waterDepthCm - 10, 5))}
                    disabled={updating}
                    className="bg-secondary-container text-on-secondary-container text-label-bold font-bold py-2 rounded-lg hover:bg-secondary-fixed transition-colors border border-outline-variant/20 disabled:opacity-60"
                  >
                    Kondisi Membaik
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("receded", 0)}
                    disabled={updating}
                    className="bg-surface-container-high text-on-surface text-label-bold font-bold py-2 rounded-lg hover:bg-surface-variant transition-colors border border-outline-variant/20 disabled:opacity-60"
                  >
                    Sudah Surut
                  </button>
                </div>
              </div>
            )}
            {!user && (
              <Link href="/login" className="bg-surface rounded-xl p-md shadow-card border border-outline-variant/30 flex items-center justify-center gap-2 text-primary font-bold hover:bg-surface-container transition-colors">
                <LogIn className="w-5 h-5" />
                Login untuk verifikasi
              </Link>
            )}
          </div>

          {/* Gallery */}
          {(report.photos.length > 0 || report.photoUrl) && (
            <div className="md:col-span-12 bg-surface rounded-xl p-md shadow-card border border-outline-variant/30 mt-sm">
              <h2 className="text-h2 font-bold text-on-surface mb-md">Foto &amp; Bukti</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
                {report.photoUrl && (
                  <div className="aspect-square bg-surface-variant rounded-lg overflow-hidden relative group">
                    <Image src={resolveImageUrl(report.photoUrl)!} alt="Foto laporan" fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
                    <div className="absolute bottom-2 right-2 bg-inverse-surface/80 text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                      Foto Utama
                    </div>
                  </div>
                )}
                {report.photos.map((photo) => (
                  <div key={photo.id} className="aspect-square bg-surface-variant rounded-lg overflow-hidden relative group">
                    <Image src={resolveImageUrl(photo.imageUrl)!} alt="Foto banjir" fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
                    <div className="absolute bottom-2 right-2 bg-inverse-surface/80 text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {timeAgo(photo.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="md:col-span-12 mt-sm mb-lg">
            <h2 className="text-h2 font-bold text-on-surface mb-md">Timeline Laporan</h2>
            {report.updates.length === 0 && report.verifications.length === 0 ? (
              <div className="text-center py-lg text-on-surface-variant">
                <Activity className="w-10 h-10 mb-sm mx-auto block" />
                <p className="text-body-md">Belum ada update untuk laporan ini</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-surface-container-high space-y-md">
                {/* Updates timeline */}
                {report.updates.map((upd) => (
                  <div key={upd.id} className="relative">
                    <div className="absolute -left-[31px] bg-primary rounded-full p-1 border-4 border-surface">
                      <AlertCircle className="w-3.5 h-3.5 text-on-primary" />
                    </div>
                    <div className="bg-surface rounded-lg p-sm shadow-sm border border-outline-variant/20 ml-2">
                      <div className="flex justify-between items-start mb-xs">
                        <span className="text-label-bold font-bold text-on-surface">{upd.user?.name ?? "User"}</span>
                        <span className="text-[12px] text-on-surface-variant">{timeAgo(upd.createdAt)}</span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant">{upd.description || `Update: air ${upd.waterDepthCm}cm, status ${STATUS_LABEL[upd.status] ?? upd.status}`}</p>
                      <div className="mt-xs flex gap-2">
                        <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-0.5 rounded font-bold">
                          {upd.waterDepthCm}cm
                        </span>
                        <span className={`${STATUS_COLOR[upd.status] ?? "bg-outline text-white"} text-[10px] px-2 py-0.5 rounded font-bold`}>
                          {STATUS_LABEL[upd.status] ?? upd.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Verifications */}
                {report.verifications.map((v) => (
                  <div key={v.id} className="relative">
                    <div className={`absolute -left-[31px] ${v.vote === "confirm" ? "bg-primary" : "bg-error"} rounded-full p-1 border-4 border-surface`}>
                      {v.vote === "confirm" ? <Check className="text-white w-3.5 h-3.5" /> : <X className="text-white w-3.5 h-3.5" />}
                    </div>
                    <div className="bg-surface rounded-lg p-sm shadow-sm border border-outline-variant/20 ml-2">
                      <div className="flex justify-between items-start mb-xs">
                        <span className="text-label-bold font-bold text-on-surface">{v.user?.name ?? "User"}</span>
                        <span className="text-[12px] text-on-surface-variant">{timeAgo(v.createdAt)}</span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant">
                        {v.comment || (v.vote === "confirm" ? "Mengkonfirmasi laporan ini" : "Menolak laporan ini")}
                      </p>
                      <div className="mt-xs">
                        <span className={`${v.vote === "confirm" ? "bg-primary-container/10 text-primary" : "bg-error-container text-on-error-container"} text-[10px] px-2 py-0.5 rounded font-bold`}>
                          {v.vote === "confirm" ? "Konfirmasi" : "Tolak"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav active="laporan" />
    </div>
  );
}
