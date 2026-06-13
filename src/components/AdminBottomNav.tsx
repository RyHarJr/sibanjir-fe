"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { LayoutDashboard, ClipboardList, Users } from "lucide-react";

export default function AdminBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  if (!user || user.role !== "admin") return null;

  const items = [
    { key: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { key: "laporan", icon: ClipboardList, label: "Laporan", href: "/admin/laporan" },
    { key: "pengguna", icon: Users, label: "Pengguna", href: "/admin/pengguna" },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] rounded-t-lg">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`flex flex-col items-center justify-center px-4 py-1 text-[10px] font-semibold transition-all ${
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
