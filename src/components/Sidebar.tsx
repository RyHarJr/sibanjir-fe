"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Map, List, PlusSquare, Route, Cloud, Shield, LogOut, LogIn } from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard",    href: "/dashboard",   icon: Map,           label: "Dashboard" },
  { key: "laporan",      href: "/laporan",      icon: List, label: "Feed Laporan" },
  { key: "buat-laporan", href: "/buat-laporan", icon: PlusSquare,       label: "Buat Laporan" },
  { key: "rute",         href: "/rute",         icon: Route,         label: "Safe Route" },
  { key: "cuaca",        href: "/cuaca",        icon: Cloud, label: "Info Cuaca" },
] as const;

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={`hidden md:flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 bg-white border-r border-outline-variant transition-all duration-300 ease-in-out ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
    >
      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-1 px-2">
        {(user ? NAV_ITEMS : NAV_ITEMS.filter(i => i.key !== "buat-laporan")).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.key}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative ${
                isActive
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <item.icon className="flex-shrink-0 w-6 h-6" />
              {!collapsed && (
                <span className="text-[14px] font-semibold truncate">{item.label}</span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-inverse-surface text-inverse-on-surface text-[12px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-ambient-md">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="border-t border-outline-variant p-3 flex-shrink-0 flex flex-col gap-2">
        {user?.role === "admin" && (
          <Link
            href="/admin/dashboard"
            title={collapsed ? "Admin Panel" : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-container text-on-surface-variant text-[13px] font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <Shield className="w-5 h-5 flex-shrink-0" />
            {!collapsed && "Admin Panel"}
          </Link>
        )}
        {user ? (
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-[13px] flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-on-surface truncate">{user.name}</p>
                  <p className="text-[11px] text-on-surface-variant truncate capitalize">{user.role}</p>
                </div>
                <button
                  onClick={logout}
                  title="Keluar"
                  className="p-1.5 rounded-lg hover:bg-error-container hover:text-error transition-colors text-on-surface-variant flex-shrink-0"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
            {collapsed && (
              <button
                onClick={logout}
                title="Keluar"
                className="mt-2 w-full flex justify-center p-1.5 rounded-lg hover:bg-error-container hover:text-error transition-colors text-on-surface-variant"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-primary text-on-primary text-[13px] font-semibold hover:bg-on-primary-fixed-variant transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <LogIn className="w-5 h-5" />
            {!collapsed && "Masuk"}
          </Link>
        )}
      </div>
    </aside>
  );
}
