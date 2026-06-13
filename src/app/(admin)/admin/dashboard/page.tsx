"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { api, AdminStats, timeAgo, severityColor, roadAccessLabel } from "@/lib/api";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Authentication & Role Check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/admin/dashboard");
      } else if (user.role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      api.getStats()
        .then(res => setStats(res.data))
        .catch(err => console.error("Failed to load admin stats", err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || (user?.role === "admin" && loading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop space-y-lg max-w-[1440px] mx-auto w-full">
      
      <div>
        <h1 className="text-h1 font-bold text-on-surface">Dashboard Admin</h1>
        <p className="text-body-sm text-on-surface-variant">Ikhtisar laporan dan aktivitas sistem SiBanjir.</p>
      </div>

      {stats && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          <div className="bg-surface-container-lowest p-md rounded-xl ambient-shadow-sm border-l-[4px] border-primary flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px] text-primary">add_alert</span>
              <span className="text-label-bold font-bold uppercase tracking-wider">Total Laporan</span>
            </div>
            <div className="text-h1 font-bold text-on-surface">{stats.totalReports}</div>
          </div>
          
          <div className="bg-surface-container-lowest p-md rounded-xl ambient-shadow-sm border-l-[4px] border-error flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px] text-error">water_drop</span>
              <span className="text-label-bold font-bold uppercase tracking-wider">Laporan Aktif</span>
            </div>
            <div className="text-h1 font-bold text-on-surface">{stats.activeReports}</div>
          </div>

          <div className="bg-surface-container-lowest p-md rounded-xl ambient-shadow-sm border-l-[4px] border-warning flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px] text-warning">group</span>
              <span className="text-label-bold font-bold uppercase tracking-wider">Total Pengguna</span>
            </div>
            <div className="text-h1 font-bold text-on-surface">{stats.totalUsers}</div>
          </div>

          <div className="bg-surface-container-lowest p-md rounded-xl ambient-shadow-sm border-l-[4px] border-success flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px] text-success">verified</span>
              <span className="text-label-bold font-bold uppercase tracking-wider">Verifikasi Warga</span>
            </div>
            <div className="text-h1 font-bold text-on-surface">{stats.totalVerifications}</div>
          </div>
        </section>
      )}

      {stats?.deepestReport && (
        <section className="bg-error-container text-on-error-container rounded-xl p-md flex items-start gap-3 ambient-shadow-sm">
          <span className="material-symbols-outlined text-[32px] mt-1 text-error">emergency</span>
          <div className="flex-1">
            <h3 className="font-bold text-label-bold tracking-wider uppercase mb-1 flex flex-wrap items-center gap-2">
              Laporan Paling Kritis (Terdalam)
              <span className="bg-error text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold">{stats.deepestReport.waterDepthCm}cm</span>
            </h3>
            <p className="text-body-md font-semibold mb-1">{stats.deepestReport.title}</p>
            <p className="text-body-sm opacity-90">{stats.deepestReport.district?.name} — {stats.deepestReport.address}</p>
            <Link href={`/laporan/${stats.deepestReport.id}`} className="inline-block mt-2 text-label-bold font-bold hover:underline">
              Cek Detail Laporan &rarr;
            </Link>
          </div>
        </section>
      )}

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant ambient-shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
          <h2 className="text-h3 font-bold text-on-surface">Laporan Terkini</h2>
          <Link href="/admin/laporan" className="text-primary text-label-bold font-bold hover:underline px-2">
            Kelola Laporan
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant">
                <th className="p-4 text-label-bold font-bold">Laporan</th>
                <th className="p-4 text-label-bold font-bold w-[120px]">Kedalaman</th>
                <th className="p-4 text-label-bold font-bold w-[140px]">Status</th>
                <th className="p-4 text-label-bold font-bold w-[160px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentReports?.length ? (
                stats.recentReports.map((r) => {
                  const statusColors = {
                    active: "bg-error-container text-on-error-container border-error",
                    surging: "bg-warning-container text-on-warning-container border-warning",
                    receded: "bg-surface-container text-on-surface-variant border-outline-variant"
                  };
                  const stColor = statusColors[r.status] || "bg-surface border-outline-variant";

                  return (
                    <tr key={r.id} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-on-surface block mb-1">{r.title}</div>
                        <div className="text-[12px] text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {r.district?.name ?? "Tidak diketahui"}
                          <span className="opacity-50">•</span>
                          {timeAgo(r.createdAt)}
                        </div>
                      </td>
                      <td className="p-4 text-on-surface font-medium">
                        {r.waterDepthCm}cm
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 border rounded text-[12px] font-bold uppercase tracking-wider ${stColor}`}>
                          {r.status === 'active' ? 'Aktif' : r.status === 'surging' ? 'Meningkat' : 'Surut'}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link href={`/laporan/${r.id}`} className="px-3 py-1.5 bg-primary-container text-on-primary-container border border-primary hover:bg-primary hover:text-on-primary transition-colors text-[12px] font-semibold rounded-lg flex items-center justify-center gap-1 w-max">
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          Lihat
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-on-surface-variant">
                    Belum ada laporan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
