"use client";
import Link from "next/link";

export default function BottomNav({ active }: { active: "dashboard" | "laporan" | "buat" | "rute" | "cuaca" | "profil" }) {
  const items = [
    { key: "dashboard", icon: "map", label: "Dashboard", href: "/dashboard" },
    { key: "laporan", icon: "view_headline", label: "Laporan", href: "/laporan" },
    { key: "buat", icon: "add_box", label: "Buat", href: "/buat-laporan" },
    { key: "rute", icon: "route", label: "Rute", href: "/rute" },
    { key: "cuaca", icon: "partly_cloudy_day", label: "Cuaca", href: "/cuaca" },
    { key: "profil", icon: "person", label: "Profil", href: "/profil" },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] rounded-t-lg">
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`flex flex-col items-center justify-center px-3 py-1 text-[10px] font-semibold transition-all ${
              isActive
                ? "text-primary bg-blue-50 rounded-xl"
                : "text-slate-500 hover:text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined mb-1 text-[24px]"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
