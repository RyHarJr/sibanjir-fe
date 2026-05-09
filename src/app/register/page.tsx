"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok");
      return;
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({ name: form.name, email: form.email, phone: form.phone || undefined, password: form.password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: "Lemah", color: "bg-error", width: "w-1/4" };
    if (p.length < 8) return { label: "Cukup", color: "bg-warning", width: "w-2/4" };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: "Sedang", color: "bg-warning", width: "w-3/4" };
    return { label: "Kuat", color: "bg-primary", width: "w-full" };
  })();

  return (
    <div className="bg-surface-container-lowest min-h-screen flex flex-col relative overflow-hidden font-sans text-on-surface antialiased">
      {/* Ambient glow */}
      <div className="absolute top-0 w-full h-[400px] bg-primary-container rounded-b-full opacity-[0.05] blur-[80px] -translate-y-1/2 z-0 pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center px-margin-mobile md:px-0 relative z-10 w-full max-w-md mx-auto py-xl">
        {/* Back */}
        <Link href="/" className="self-start flex items-center gap-1 text-secondary text-body-sm font-semibold mb-xl hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </Link>

        {/* Logo mini */}
        <div className="w-14 h-14 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-sm mb-lg">
          <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            water_damage
          </span>
        </div>

        <h1 className="text-h1 font-bold text-primary mb-xs tracking-tight text-center">Daftar</h1>
        <p className="text-body-md text-on-surface-variant mb-xl text-center">
          Bergabung dan ikut menjaga Palembang
        </p>

        {/* Error banner */}
        {error && (
          <div className="w-full mb-md bg-error-container text-on-error-container rounded-xl px-md py-sm flex items-center gap-2 text-body-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-md">
          {/* Nama */}
          <div className="flex flex-col gap-xs">
            <label className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider">
              Nama Lengkap
            </label>
            <div className="flex items-center gap-sm bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">person</span>
              <input
                type="text"
                placeholder="Budi Santoso"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="flex-1 bg-transparent outline-none text-body-md text-on-surface placeholder:text-outline"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-xs">
            <label className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider">
              Email
            </label>
            <div className="flex items-center gap-sm bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">mail</span>
              <input
                type="email"
                placeholder="budi@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="flex-1 bg-transparent outline-none text-body-md text-on-surface placeholder:text-outline"
              />
            </div>
          </div>

          {/* Phone (optional) */}
          <div className="flex flex-col gap-xs">
            <label className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider">
              No. HP <span className="normal-case font-normal tracking-normal">(opsional)</span>
            </label>
            <div className="flex items-center gap-sm bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">phone</span>
              <input
                type="tel"
                placeholder="+62812345678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="flex-1 bg-transparent outline-none text-body-md text-on-surface placeholder:text-outline"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-xs">
            <label className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider">
              Password
            </label>
            <div className="flex items-center gap-sm bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">lock</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 karakter"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="flex-1 bg-transparent outline-none text-body-md text-on-surface placeholder:text-outline"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {/* Password strength bar */}
            {strength && (
              <div className="flex items-center gap-sm mt-xs">
                <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                </div>
                <span className="text-[11px] font-bold text-on-surface-variant w-12 text-right">{strength.label}</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-xs">
            <label className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider">
              Konfirmasi Password
            </label>
            <div className={`flex items-center gap-sm bg-surface-container-low border rounded-xl px-md py-sm focus-within:ring-1 transition-all ${
              form.confirmPassword && form.confirmPassword !== form.password
                ? "border-error focus-within:border-error focus-within:ring-error"
                : "border-outline-variant focus-within:border-primary focus-within:ring-primary"
            }`}>
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">lock_reset</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Ulangi password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className="flex-1 bg-transparent outline-none text-body-md text-on-surface placeholder:text-outline"
              />
              {form.confirmPassword && (
                <span className={`material-symbols-outlined text-[18px] ${form.confirmPassword === form.password ? "text-primary" : "text-error"}`}>
                  {form.confirmPassword === form.password ? "check_circle" : "cancel"}
                </span>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-on-primary font-bold text-label-bold rounded-full flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,35,111,0.25)] hover:bg-on-primary-fixed-variant transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                Mendaftar...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                Buat Akun
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-md w-full mt-lg">
          <div className="flex-1 h-px bg-outline-variant" />
          <span className="text-body-sm text-on-surface-variant">atau</span>
          <div className="flex-1 h-px bg-outline-variant" />
        </div>

        {/* Login link */}
        <p className="mt-lg text-body-md text-on-surface-variant text-center">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4">
            Masuk di sini
          </Link>
        </p>

        {/* Guest */}
        <Link
          href="/dashboard"
          className="mt-md text-secondary font-bold text-label-bold py-2 px-4 rounded-full flex items-center gap-1.5 hover:bg-surface-variant/50 transition-colors"
        >
          Lanjut sebagai tamu
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </main>
    </div>
  );
}
