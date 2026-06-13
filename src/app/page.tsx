import Link from "next/link";
import { Droplets, Compass, Megaphone, Droplet, Map as MapIcon, ShieldCheck, Route } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen flex flex-col font-sans text-on-surface scroll-smooth selection:bg-primary/20">
      
      {/* 1. Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-white/95 backdrop-blur-md border-b border-outline-variant/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary">
              <Droplets className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-primary">LaporBanjir</span>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/dashboard" className="hidden md:flex font-medium text-on-surface-variant hover:text-primary transition-colors text-sm">
              Peta Pantauan
            </Link>
            <Link href="/login" className="font-medium text-on-surface-variant hover:text-primary transition-colors px-3 py-2 text-sm">
              Masuk
            </Link>
            <Link href="/register" className="h-10 px-6 bg-primary text-white font-medium text-sm rounded-full flex items-center justify-center hover:bg-on-primary-fixed-variant transition-colors">
              Daftar
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start w-full pt-20">
        
        {/* 2. Hero Section */}
        <section className="w-full px-4 md:px-8 min-h-[85vh] flex items-center justify-center relative bg-white">
          {/* Subtle Dot Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
          
          <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center py-20 pb-0">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/60 mb-8">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs font-semibold text-on-surface-variant tracking-wide">SISTEM PENGADUAN AKTIF LOKAL</span>
            </div>
            
            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-on-surface tracking-tight mb-8 leading-[1.1] max-w-4xl mx-auto">
              Pantau & Laporkan Banjir <span className="text-primary">Secara Real-Time</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mb-12">
              Platform responsif berbasis pemetaan untuk mengetahui titik genangan air komprehensif, melaporkan secara instan, dan menemukan jalur aman di kota Palembang.
            </p>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
               <Link href="/dashboard" className="w-full sm:w-auto px-8 h-14 rounded-full bg-primary text-white font-medium text-base flex items-center justify-center gap-2 hover:bg-on-primary-fixed-variant transition-colors shadow-sm">
                 <Compass className="w-5 h-5" />
                 Buka Peta
               </Link>
               <Link href="/buat-laporan" className="w-full sm:w-auto px-8 h-14 rounded-full bg-white border border-outline-variant text-on-surface font-medium text-base flex items-center justify-center gap-2 hover:bg-surface-container transition-colors shadow-sm">
                 <Megaphone className="w-5 h-5" />
                 Buat Laporan
               </Link>
            </div>
            
            {/* Hero Mockup Clean */}
            <div className="mt-20 w-full max-w-4xl mx-auto h-[250px] md:h-[350px] bg-white rounded-t-3xl border-t border-l border-r border-outline-variant/50 flex justify-center p-4 relative overflow-hidden shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.03)]">
               {/* Mock UI Card flat */}
               <div className="w-[90%] md:w-80 h-max bg-white rounded-2xl border border-outline-variant/60 shadow-md absolute top-12 left-1/2 -translate-x-1/2 p-5 text-left">
                 <div className="flex items-start gap-4">
                   <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center flex-shrink-0">
                     <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings:"'FILL' 1"}}>water_drop</span>
                   </div>
                   <div className="space-y-1">
                     <div className="flex items-center justify-between w-full">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error uppercase">Kritis</span>
                        <span className="text-[11px] text-on-surface-variant">Baru saja</span>
                     </div>
                     <h4 className="text-base font-bold text-on-surface line-clamp-1">Jl. Kol. H. Burlian</h4>
                     <p className="text-xs text-on-surface-variant font-medium leading-relaxed">Banjir sedalam 50cm, tidak bisa dilalui kendaraan roda dua.</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* 3. Features Flat Grid */}
        <section className="w-full py-24 md:py-32 px-4 md:px-8 bg-surface-container-lowest border-t border-outline-variant/30 relative">
           <div className="max-w-7xl mx-auto">
             <div className="text-center mb-16 md:mb-24">
               <h2 className="text-4xl md:text-5xl font-bold text-on-surface mb-4">Fitur Utama</h2>
               <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">Sistem terintegrasi untuk membantu warga merespons dan menghindari zona banjir.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="bg-white rounded-3xl p-8 border border-outline-variant/50 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <MapIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-3">Peta Interaktif</h3>
                  <p className="text-on-surface-variant leading-relaxed text-sm">Pantau titik genangan secara visual. Peta selalu diperbarui secara real-time berdasarkan aktivitas masyarakat setempat.</p>
                </div>
                
                {/* Feature 2 */}
                <div className="bg-white rounded-3xl p-8 border border-outline-variant/50 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <ShieldCheck className="w-8 h-8 fill-primary/20" />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-3">Laporan Terverifikasi</h3>
                  <p className="text-on-surface-variant leading-relaxed text-sm">Sistem verifikasi memastikan bahwa laporan yang masuk akurat, mengurangi risiko informasi palsu atau kedaluwarsa.</p>
                </div>
                
                {/* Feature 3 */}
                <div className="bg-white rounded-3xl p-8 border border-outline-variant/50 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <Route className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-3">Navigasi Aman</h3>
                  <p className="text-on-surface-variant leading-relaxed text-sm">Pilih titik awal dan tujuan Anda, dan biarkan sistem mencarikan rute perjalanan yang paling aman dari genangan air.</p>
                </div>
             </div>
           </div>
        </section>

        {/* 4. Bottom CTA / Footer */}
        <footer className="w-full bg-surface-container px-4 md:px-8 pt-20 pb-12 text-center border-t border-outline-variant/30">
           <div className="max-w-4xl mx-auto flex flex-col items-center">
             <h2 className="text-3xl md:text-5xl font-bold text-on-surface mb-6">Mulai Kontribusi Anda!</h2>
             <p className="text-lg text-on-surface-variant max-w-2xl mb-10">Jangan biarkan yang lain terjebak genangan. Bergabunglah dengan warga untuk saling berbagi info dan wujudkan kota yang lebih responsif.</p>
             <Link href="/register" className="w-full sm:w-auto px-10 h-14 rounded-full bg-primary text-white font-medium text-base flex items-center justify-center hover:bg-on-primary-fixed-variant transition-colors mb-20 shadow-sm">
               Memulai Sekarang 
             </Link>
           </div>
           
           <div className="border-t border-outline-variant/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto text-on-surface-variant text-sm font-medium">
             <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>water_damage</span>
                <span className="font-bold tracking-tight text-on-surface">LaporBanjir © {new Date().getFullYear()}</span>
             </div>
             <div>Dibangun untuk Palembang yang lebih responsif.</div>
           </div>
        </footer>
      </main>
    </div>
  );
}
