"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { api, User, FloodReport, timeAgo } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const STATUS_BORDER: Record<string, string> = { active: "bg-error", surging: "bg-warning", receded: "bg-secondary" };
const SIAGA: Record<string, { label: string; cls: string }> = {
  high: { label: "Siaga 1 - Kritis", cls: "bg-error-container text-on-error-container" },
  extreme: { label: "Siaga 1 - Bahaya", cls: "bg-error-container text-on-error-container" },
  medium: { label: "Siaga 2 - Waspada", cls: "bg-tertiary-container/10 text-tertiary-container" },
  low: { label: "Siaga 3 - Aman", cls: "bg-surface-variant text-on-surface-variant" },
};

export default function ProfilPengguna() {
  const router = useRouter();
  const { user: authUser, loading: authLoading, logout } = useAuth();
  const [profile, setProfile] = useState<(User & { _count: { reports: number; verifications: number } }) | null>(null);
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !authUser) { router.push("/login"); return; }
    if (authUser) {
      Promise.all([
        api.me(),
        api.getReports({ userId: authUser.id, limit: 10, sort: "latest" }),
      ]).then(([me, reps]) => {
        setProfile(me.data);
        setReports(reps.data);
      }).catch((err) => {
        console.error("Failed to load profile:", err);
        logout();
      }).finally(() => setLoading(false));
    }
  }, [authLoading, authUser, router, logout]);

  if (loading || authLoading) {
    return (
      <div className="bg-background text-on-background pb-20 md:pb-0">
        <main className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto space-y-md pt-lg">
          <div className="h-48 bg-surface-container rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 gap-md"><div className="h-24 bg-surface-container rounded-xl animate-pulse" /><div className="h-24 bg-surface-container rounded-xl animate-pulse" /></div>
        </main>
        <BottomNav active="profil" />
      </div>
    );
  }

  if (!profile) return null;

  const initial = profile.name.charAt(0).toUpperCase();

  return (
    <div className="bg-background text-on-background pb-20 md:pb-0">
      <main className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto space-y-md pt-lg">
        {/* Profile bento */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
          <div className="md:col-span-8 bg-surface-container-lowest rounded-xl p-lg shadow-card border border-outline-variant flex flex-col sm:flex-row items-center sm:items-start gap-lg text-center sm:text-left">
            <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-4 border-surface-container bg-primary-container text-on-primary-container flex items-center justify-center text-h1 font-bold">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : initial}
            </div>
            <div className="flex-1 space-y-sm">
              <h1 className="text-h1 font-bold text-on-surface">{profile.name}</h1>
              <p className="text-body-md text-on-surface-variant flex items-center justify-center sm:justify-start gap-xs">
                <span className="material-symbols-outlined text-[18px]">mail</span>
                {profile.email}
              </p>
              {profile.phone && (
                <p className="text-body-md text-on-surface-variant flex items-center justify-center sm:justify-start gap-xs">
                  <span className="material-symbols-outlined text-[18px]">phone</span>
                  {profile.phone}
                </p>
              )}
              <div className="pt-sm flex flex-wrap gap-xs justify-center sm:justify-start">
                {profile.reputationScore >= 500 && (
                  <span className="inline-flex items-center gap-xs px-3 py-1 rounded-full bg-primary-container/10 text-primary-container text-label-bold font-bold">
                    <span className="material-symbols-outlined text-[14px]">verified</span>Pelapor Terpercaya
                  </span>
                )}
                <span className="inline-flex items-center gap-xs px-3 py-1 rounded-full bg-tertiary-container/10 text-tertiary-container text-label-bold font-bold capitalize">
                  <span className="material-symbols-outlined text-[14px]">badge</span>{profile.role}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-sm sm:mt-0 shrink-0 w-full sm:w-auto">
              {profile.role === "admin" && (
                <Link href="/admin/dashboard" className="w-full sm:w-auto px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant text-label-bold font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>Admin Panel
                </Link>
              )}
              <button onClick={logout} className="w-full sm:w-auto px-4 py-2 rounded-lg border border-error text-error text-label-bold font-bold hover:bg-error-container transition-colors flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[18px]">logout</span>Keluar
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="md:col-span-4 grid grid-cols-3 gap-sm md:gap-md">
            <div className="bg-surface-container-lowest rounded-xl p-sm md:p-md shadow-card border border-outline-variant flex flex-col justify-center items-center text-center space-y-xs">
              <span className="material-symbols-outlined text-primary text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
              <span className="text-h3 md:text-h2 font-bold text-on-surface">{profile._count.reports}</span>
              <span className="text-body-sm text-on-surface-variant max-md:text-[10px]">Laporan</span>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-sm md:p-md shadow-card border border-outline-variant flex flex-col justify-center items-center text-center space-y-xs">
              <span className="material-symbols-outlined text-secondary text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="text-h3 md:text-h2 font-bold text-on-surface">{profile._count.verifications}</span>
              <span className="text-body-sm text-on-surface-variant max-md:text-[10px]">Verifikasi</span>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-sm md:p-md shadow-card border border-outline-variant flex flex-col justify-center items-center text-center space-y-xs">
              <span className="material-symbols-outlined text-tertiary text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
              <span className="text-h3 md:text-h2 font-bold text-on-surface">{profile.reputationScore}</span>
              <span className="text-body-sm text-on-surface-variant max-md:text-[10px]">Reputasi</span>
            </div>
          </div>
        </div>

        {/* Report history */}
        <section className="space-y-md">
          <div className="flex justify-between items-end">
            <h2 className="text-h2 font-bold text-on-surface">Riwayat Laporan</h2>
            <Link href="/laporan" className="text-label-bold font-bold text-primary hover:text-primary-container transition-colors">Lihat Semua</Link>
          </div>
          {reports.length === 0 ? (
            <div className="text-center py-xl text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] block mb-sm">description</span>
              <p className="text-body-lg">Belum ada laporan</p>
              <Link href="/buat-laporan" className="text-primary font-bold mt-sm inline-block">Buat laporan pertama →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {reports.map((r) => {
                const siaga = SIAGA[r.severityLevel] ?? SIAGA.low;
                const border = STATUS_BORDER[r.status] ?? "bg-outline";
                return (
                  <Link key={r.id} href={`/laporan/${r.id}`} className="bg-surface-container-lowest rounded-xl shadow-card border border-outline-variant flex overflow-hidden hover:border-primary/50 transition-colors">
                    <div className={`w-1 ${border} shrink-0`} />
                    <div className="p-md flex-1 space-y-sm">
                      <div className="flex justify-between items-start">
                        <span className={`inline-block px-2 py-1 rounded ${siaga.cls} text-label-bold font-bold`}>{siaga.label}</span>
                        <span className="text-body-sm text-on-surface-variant">{timeAgo(r.createdAt)}</span>
                      </div>
                      <div>
                        <h3 className="text-h3 font-semibold text-on-surface">{r.title}</h3>
                        <p className="text-body-md text-on-surface-variant flex items-center gap-xs mt-1">
                          <span className="material-symbols-outlined text-[16px]">location_on</span>
                          {r.district?.name ?? r.address ?? "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/30">
                        <span className="material-symbols-outlined text-outline text-[16px]">water_drop</span>
                        <span className="text-body-sm text-outline">{r.waterDepthCm}cm • {r.status === "receded" ? "Sudah Surut" : r.status === "surging" ? "Meningkat" : "Aktif"}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <BottomNav active="profil" />
    </div>
  );
}
