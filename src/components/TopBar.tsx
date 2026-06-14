"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/AuthContext"
import { api } from "@/lib/api"
import { Droplets, Menu, Globe, Shield, Bell, UserCircle } from "lucide-react"

interface TopBarProps {
  collapsed: boolean
  onToggle: () => void
  title?: string
}

export default function TopBar({ collapsed, onToggle, title = "Palembang Siaga Banjir" }: TopBarProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [notifDot, setNotifDot] = useState(false)

  const isAdminPage = pathname?.startsWith("/admin")

  useEffect(() => {
    if (!user) return
    api.getNotifications()
      .then((res) => setNotifDot(res.meta.unreadCount > 0))
      .catch(() => {})
  }, [user])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-md border-b border-outline-variant shadow-sm flex items-center">
      {/* Left — toggle + logo */}
      <div className={`hidden md:flex items-center gap-3 h-full px-4 border-r border-outline-variant flex-shrink-0 transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[240px]"}`}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center flex-shrink-0">
              <Droplets className="w-4 h-4" />
            </div>
            <span className="font-black tracking-tight text-primary text-[14px] leading-tight truncate">SiBanjir</span>
          </Link>
        )}
      </div>

      {/* Center */}
      <div className="flex-1 flex items-center px-4">
        <button onClick={onToggle} className="hidden md:block mr-5 p-1.5 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant flex-shrink-0" title={collapsed ? "Buka sidebar" : "Tutup sidebar"}>
          <Menu className="w-5 h-5" />
        </button>
        <span className="md:hidden font-black tracking-tight text-primary text-[16px] mx-auto">{title}</span>
        <span className="hidden md:block font-semibold text-on-surface text-[15px]">{title}</span>
      </div>

      {/* Right — notif + profile */}
      <div className="flex items-center gap-1 px-4">
        {user && (
          <>
            {user.role === "admin" && (
              <Link 
                href={isAdminPage ? "/dashboard" : "/admin/dashboard"} 
                className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant relative"
                title={isAdminPage ? "Kembali ke Aplikasi Publik" : "Masuk Panel Admin"}
              >
                {isAdminPage ? <Globe className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
              </Link>
            )}
            <Link href="/notifikasi" className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant relative" title="Notifikasi">
              <Bell className="w-5 h-5" />
              {notifDot && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />}
            </Link>
            <Link href="/profil" className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant" title="Profil">
              <UserCircle className="w-5 h-5" />
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
