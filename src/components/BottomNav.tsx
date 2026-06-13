"use client";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { Map, List, PlusSquare, Route, Cloud } from "lucide-react";

export default function BottomNav({ active }: { active?: string }) {
  const { user } = useAuth();
  const allItems = [
    { key: "dashboard", icon: Map, label: "Dashboard", href: "/dashboard" },
    { key: "laporan", icon: List, label: "Laporan", href: "/laporan" },
    { key: "buat", icon: PlusSquare, label: "Buat", href: "/buat-laporan" },
    { key: "rute", icon: Route, label: "Rute", href: "/rute" },
    { key: "cuaca", icon: Cloud, label: "Cuaca", href: "/cuaca" },
  ] as const;

  const items = user ? allItems : allItems.filter(i => i.key !== "buat");

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
            <item.icon className="mb-1 w-6 h-6" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
