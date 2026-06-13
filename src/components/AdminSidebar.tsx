"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { LayoutDashboard, ClipboardList, Users, Shield, LogOut, LogIn } from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard", href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { key: "laporan", href: "/admin/laporan", icon: ClipboardList, label: "Kelola Laporan" },
  { key: "pengguna", href: "/admin/pengguna", icon: Users, label: "Kelola Pengguna" },
] as const;

interface AdminSidebarProps {
  collapsed: boolean;
}

export default function AdminSidebar({ collapsed }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={`hidden md:flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 bg-surface border-r border-outline-variant transition-all duration-300 ease-in-out ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
    >
      <div className="px-4 py-3 flex-shrink-0 border-b border-outline-variant">
        <span className={`font-bold text-primary text-[12px] tracking-wider uppercase transition-opacity ${collapsed ? "opacity-0 hidden" : "opacity-100"}`}>
          Admin Panel
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => {
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
      <div className="border-t border-outline-variant p-3 flex-shrink-0">
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
