"use client";

import { useEffect, useState } from "react";
import { api, User } from "@/lib/api";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { toast } from "react-hot-toast";

type AdminUser = User & { _count: { reports: number; verifications: number } };

export default function AdminPengguna() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  const fetchUsers = () => {
    setLoading(true);
    api.getUsers()
      .then((res) => setUsers(res.data))
      .catch((err) => toast.error("Gagal memuat pengguna: " + err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!(await confirm({ title: "Konfirmasi Role", description: `Apakah Anda yakin ingin mengubah role pengguna ini menjadi ${newRole.toUpperCase()}?`, confirmText: "Ubah Role", isDanger: newRole === "user" }))) return;
    
    try {
      await api.updateUserRole(userId, newRole as "admin" | "user");
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      toast.success("Role berhasil diubah");
    } catch (e: any) {
      toast.error("Gagal mengubah role: " + e.message);
    }
  };

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-[1440px] mx-auto w-full space-y-md">
      <div>
        <h1 className="text-h1 font-bold text-on-surface">Kelola Pengguna</h1>
        <p className="text-body-sm text-on-surface-variant">Lihat daftar pengguna dan atur role admin.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant ambient-shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant">
                <th className="p-4 text-label-bold font-bold w-[60px]">ID</th>
                <th className="p-4 text-label-bold font-bold">Nama Pengguna</th>
                <th className="p-4 text-label-bold font-bold w-[160px]">Total Aktivitas</th>
                <th className="p-4 text-label-bold font-bold w-[120px]">Reputasi</th>
                <th className="p-4 text-label-bold font-bold w-[140px]">Role</th>
                <th className="p-4 text-label-bold font-bold w-[140px] text-right">Ubah Role</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">Memuat...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">Belum ada pengguna.</td>
                </tr>
              ) : (
                users.map((u) => {
                  return (
                    <tr key={u.id} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors">
                      <td className="p-4 font-semibold text-on-surface-variant">#{u.id}</td>
                      <td className="p-4">
                        <div className="font-semibold text-on-surface block mb-1">{u.name}</div>
                        <div className="text-[12px] text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px]">mail</span>
                          {u.email}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-on-surface text-[14px]">
                        <span className="text-primary font-bold">{u._count.reports} Laporan</span>
                        <span className="opacity-50 mx-1">•</span>
                        <span className="text-success font-bold">{u._count.verifications} Konfirmasi</span>
                      </td>
                      <td className="p-4 text-on-surface font-medium">
                        {u.reputationScore}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 border rounded text-[12px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-error-container text-error border-error' : 'bg-surface text-on-surface-variant border-outline-variant'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 w-full flex items-center justify-end gap-2">
                        <button onClick={() => handleRoleChange(u.id, u.role)} className="px-3 py-1.5 bg-surface text-on-surface-variant border border-outline-variant hover:bg-surface-container transition-colors text-[12px] font-semibold rounded-lg flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">manage_accounts</span>
                          {u.role === 'admin' ? 'Jadikan User' : 'Jadikan Admin'}
                        </button>
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
