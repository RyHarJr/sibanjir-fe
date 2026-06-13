"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, FloodReport, timeAgo } from "@/lib/api";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { toast } from "react-hot-toast";

export default function AdminLaporan() {
  const confirm = useConfirm();
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    setLoading(true);
    api.getReports({ limit: 100 }) // Fetch up to 100 for admin view
      .then((res) => setReports(res.data))
      .catch((err) => toast.error("Gagal memuat laporan: " + err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id: number) => {
    if (!(await confirm({ title: "Hapus Permanen Laporan", description: "Apakah Anda yakin ingin menghapus laporan ini secara permanen?", confirmText: "Hapus", isDanger: true }))) return;
    try {
      await api.deleteReport(id);
      fetchReports();
      toast.success("Laporan berhasil dihapus secara permanen");
    } catch (e: any) {
      toast.error("Gagal menghapus: " + e.message);
    }
  };

  const handleAdminVerify = async (id: number, action: "verify" | "reject") => {
    const actionText = action === "verify" ? "memverifikasi" : "menolak";
    if (!(await confirm({ title: "Moderasi Laporan", description: `Apakah Anda yakin ingin ${actionText} laporan ini secara paksa?`, confirmText: "Lanjutkan", isDanger: action === "reject"}))) return;
    try {
      await api.adminVerifyReport(id, action);
      fetchReports();
      toast.success(`Laporan berhasil di${action === "verify" ? "verifikasi" : "tolak"}`);
    } catch (e: any) {
      toast.error(`Gagal ${actionText}: ` + e.message);
    }
  };

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-[1440px] mx-auto w-full space-y-md">
      <div>
        <h1 className="text-h1 font-bold text-on-surface">Kelola Laporan</h1>
        <p className="text-body-sm text-on-surface-variant">Verifikasi, tolak, atau eksekusi penghapusan terhadap laporan warga.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant ambient-shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant">
                <th className="p-4 text-label-bold font-bold w-[60px]">ID</th>
                <th className="p-4 text-label-bold font-bold">Laporan</th>
                <th className="p-4 text-label-bold font-bold w-[120px]">Pelapor</th>
                <th className="p-4 text-label-bold font-bold w-[120px]">Kepercayaan</th>
                <th className="p-4 text-label-bold font-bold w-[140px]">Status Laporan</th>
                <th className="p-4 text-label-bold font-bold w-[160px] text-right">Moderasi & Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">Memuat...</td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">Belum ada laporan.</td>
                </tr>
              ) : (
                reports.map((r) => {
                  const statusColors = {
                    active: "bg-error-container text-on-error-container border-error",
                    surging: "bg-warning-container text-on-warning-container border-warning",
                    receded: "bg-surface-container text-on-surface-variant border-outline-variant"
                  };
                  const stColor = statusColors[r.status] || "bg-surface border-outline-variant";

                  return (
                    <tr key={r.id} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors">
                      <td className="p-4 font-semibold text-on-surface-variant">#{r.id}</td>
                      <td className="p-4">
                        <div className="font-semibold text-on-surface block mb-1">
                          {r.title}
                          {r.confidenceScore >= 90 && <span className="ml-2 px-1.5 py-0.5 bg-success-container text-on-success-container rounded text-[10px] uppercase font-bold tracking-wider inline-flex items-center align-middle"><span className="material-symbols-outlined text-[12px] mr-0.5">verified</span> Terverifikasi</span>}
                          {r.confidenceScore <= -90 && <span className="ml-2 px-1.5 py-0.5 bg-error-container text-on-error-container rounded text-[10px] uppercase font-bold tracking-wider inline-flex items-center align-middle"><span className="material-symbols-outlined text-[12px] mr-0.5">block</span> Ditolak</span>}
                        </div>
                        <div className="text-[12px] text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {r.district?.name ?? "Tidak diketahui"}
                          <span className="opacity-50">•</span>
                          {timeAgo(r.createdAt)}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-on-surface text-[14px]">
                        {r.user?.name ?? "Anonim"}
                      </td>
                      <td className="p-4 text-on-surface font-medium">
                        <span className={`font-bold ${r.confidenceScore >= 90 ? 'text-success' : r.confidenceScore <= -90 ? 'text-error' : 'text-primary'}`}>
                          {Number(r.confidenceScore).toFixed(1)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 border rounded text-[12px] font-bold uppercase tracking-wider ${stColor}`}>
                          {r.status === "active" ? "Aktif" : r.status === "surging" ? "Meningkat" : "Surut"}
                        </span>
                      </td>
                      <td className="p-4 w-full flex flex-col items-end gap-2 justify-center">
                        <div className="flex items-center gap-1.5">
                           <button
                             onClick={() => handleAdminVerify(r.id, "verify")}
                             disabled={r.confidenceScore >= 90}
                             title="Verifikasi Laporan"
                             className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${r.confidenceScore >= 90 ? "bg-success-container/40 text-success border-success/30 cursor-not-allowed" : "bg-success text-on-success border-success hover:bg-success/90"}`}
                           >
                             <span className="material-symbols-outlined text-[16px]">check_circle</span>
                           </button>
                           <button
                             onClick={() => handleAdminVerify(r.id, "reject")}
                             disabled={r.confidenceScore <= -90}
                             title="Tolak Laporan"
                             className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${r.confidenceScore <= -90 ? "bg-error-container/40 text-error border-error/30 cursor-not-allowed" : "bg-error text-on-error border-error hover:bg-error/90"}`}
                           >
                             <span className="material-symbols-outlined text-[16px]">cancel</span>
                           </button>
                           <button
                             onClick={() => handleDelete(r.id)}
                             title="Hapus Permanen"
                             className="p-1.5 bg-surface text-error border border-error hover:bg-error-container transition-colors rounded-lg flex items-center justify-center"
                           >
                             <span className="material-symbols-outlined text-[16px]">delete</span>
                           </button>
                        </div>
                        <Link href={`/laporan/${r.id}`} className="text-[11px] font-semibold text-primary hover:underline group flex items-center">
                          Lihat Detail <span className="material-symbols-outlined text-[14px] ml-0.5 group-hover:translate-x-0.5 transition-transform">arrow_right_alt</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
