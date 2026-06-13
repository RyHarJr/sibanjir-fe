"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Droplets, AlertCircle, Mail, Lock, Eye, EyeOff, LogIn, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login(form.email, form.password);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest min-h-screen flex flex-col relative overflow-hidden font-sans text-on-surface antialiased">
      {/* Ambient glow */}
      <div className="absolute top-0 w-full h-[400px] bg-primary-container rounded-b-full opacity-[0.05] blur-[80px] -translate-y-1/2 z-0 pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center px-margin-mobile md:px-0 relative z-10 w-full max-w-md mx-auto py-xl">
        {/* Back to splash */}
        <Link href="/" className="self-start flex items-center gap-1 text-secondary text-body-sm font-semibold mb-xl hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>

        {/* Logo mini */}
        <div className="w-14 h-14 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-sm mb-lg">
          <Droplets className="w-7 h-7 fill-current" />
        </div>

        <h1 className="text-h1 font-bold text-primary mb-xs tracking-tight text-center">Masuk</h1>
        <p className="text-body-md text-on-surface-variant mb-xl text-center">
          Pantau dan laporkan banjir bersama kami
        </p>

        {/* Error banner */}
        {error && (
          <div className="w-full mb-md bg-error-container text-on-error-container rounded-xl px-md py-sm flex items-center gap-2 text-body-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-md">
          {/* Email */}
          <div className="flex flex-col gap-xs">
            <label className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider">
              Email
            </label>
            <div className="flex items-center gap-sm bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <Mail className="w-5 h-5 text-on-surface-variant" />
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

          {/* Password */}
          <div className="flex flex-col gap-xs">
            <label className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider">
              Password
            </label>
            <div className="flex items-center gap-sm bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <Lock className="w-5 h-5 text-on-surface-variant" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
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
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
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
                Memproses...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Masuk
              </>
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="w-full mt-md bg-secondary-container/40 border border-outline-variant rounded-xl p-md">
          <p className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider mb-sm">Demo Credentials</p>
          <div className="space-y-xs text-body-sm text-on-surface-variant">
            <div className="flex justify-between">
              <span>Admin</span>
              <span className="font-medium text-on-surface">admin@sibanjir.id / Admin@123</span>
            </div>
            <div className="flex justify-between">
              <span>User</span>
              <span className="font-medium text-on-surface">budi@gmail.com / User@123</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-md w-full mt-lg">
          <div className="flex-1 h-px bg-outline-variant" />
          <span className="text-body-sm text-on-surface-variant">atau</span>
          <div className="flex-1 h-px bg-outline-variant" />
        </div>

        {/* Register link */}
        <p className="mt-lg text-body-md text-on-surface-variant text-center">
          Belum punya akun?{" "}
          <Link href="/register" className="text-primary font-bold hover:underline underline-offset-4">
            Daftar sekarang
          </Link>
        </p>

        {/* Guest Mode */}
        <Link
          href="/dashboard"
          className="mt-md text-secondary font-bold text-label-bold py-2 px-4 rounded-full flex items-center gap-1.5 hover:bg-surface-variant/50 transition-colors"
        >
          Lanjut sebagai tamu
          <ArrowRight className="w-4 h-4" />
        </Link>
      </main>
    </div>
  );
}
