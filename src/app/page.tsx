import Link from "next/link";

export default function SplashScreen() {
  return (
    <div className="bg-surface-container-lowest min-h-screen flex flex-col relative overflow-hidden font-sans text-on-surface antialiased">
      {/* Ambient Glow */}
      <div className="absolute top-0 w-full h-[512px] bg-primary-container rounded-b-full opacity-[0.05] blur-[80px] -translate-y-1/2 z-0 pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-between p-margin-mobile md:p-margin-desktop relative z-10 w-full max-w-md mx-auto min-h-screen">
        {/* Spacer */}
        <div className="h-12 w-full flex-shrink-0" />

        {/* Hero */}
        <div className="flex flex-col items-center justify-center text-center w-full flex-1">
          {/* Logo */}
          <div className="w-[120px] h-[120px] bg-primary-container/10 rounded-full flex items-center justify-center mb-lg relative">
            <div className="absolute inset-0 rounded-full border border-primary-container/20 scale-110" />
            <div className="w-20 h-20 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                water_damage
              </span>
            </div>
          </div>

          {/* Typography */}
          <h1 className="text-h1 font-bold text-primary mb-sm tracking-tight w-full">
            LaporBanjir<br />Palembang
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-[280px]">
            Pantau dan Laporkan Banjir Secara Real-Time
          </p>

          {/* Status pill */}
          <div className="mt-lg flex items-center gap-2 bg-surface-container py-1.5 px-3 rounded-full border border-surface-variant">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider">
              Sistem Siaga Aktif
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-md pb-lg pt-xl">
          <Link
            href="/login"
            className="w-full h-14 bg-primary text-on-primary font-bold text-label-bold rounded-full flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,35,111,0.25)] hover:bg-on-primary-fixed-variant transition-colors active:scale-[0.98]"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="w-full h-14 bg-surface-container-lowest border-2 border-primary text-primary font-bold text-label-bold rounded-full flex items-center justify-center gap-2 hover:bg-primary-container/5 transition-colors active:scale-[0.98]"
          >
            Daftar
          </Link>
          <div className="flex items-center justify-center mt-sm">
            <Link
              href="/dashboard"
              className="text-secondary font-bold text-label-bold py-2 px-4 rounded-full flex items-center gap-1.5 hover:bg-surface-variant/50 transition-colors"
            >
              Guest Mode
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
