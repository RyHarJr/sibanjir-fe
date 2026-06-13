"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { api, Notification, timeAgo } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { BellOff, AlertTriangle, Droplet, CheckCircle, Info } from "lucide-react";

type IconType = "warning" | "water_drop" | "check_circle" | "info";
const ICON_MAP: Record<string, { icon: IconType; iconBg: string; iconColor: string; border: string }> = {
  alert: { icon: "warning", iconBg: "bg-error-container", iconColor: "text-error", border: "border-error" },
  report_update: { icon: "water_drop", iconBg: "bg-primary-container", iconColor: "text-on-primary-container", border: "border-primary" },
  verification: { icon: "check_circle", iconBg: "bg-surface-variant", iconColor: "text-on-surface-variant", border: "border-outline-variant" },
  system: { icon: "info", iconBg: "bg-surface-variant", iconColor: "text-on-surface-variant", border: "border-outline-variant" },
};

const renderIcon = (type: IconType, className: string) => {
  switch (type) {
    case "warning": return <AlertTriangle className={className} />;
    case "water_drop": return <Droplet className={className} />;
    case "check_circle": return <CheckCircle className={className} />;
    case "info": return <Info className={className} />;
    default: return <Info className={className} />;
  }
};

export default function Notifikasi() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      api.getNotifications()
        .then((res) => {
          setNotifications(res.data);
          setUnreadCount(res.meta.unreadCount);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [authLoading, user, router]);

  const handleReadAll = async () => {
    try {
      await api.readAll();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadOne = async (id: number) => {
    try {
      await api.readOne(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen pb-[80px] md:pb-0">
      <main className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-lg">
        <div className="mb-lg flex justify-between items-end">
          <div>
            <h1 className="text-h1 font-bold text-on-background mb-xs">Notifikasi</h1>
            <p className="text-body-md text-on-surface-variant">
              {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleReadAll} className="text-label-bold font-bold text-primary hover:text-primary-container transition-colors">
              Tandai semua dibaca
            </button>
          )}
        </div>

        <div className="flex flex-col gap-base">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-container rounded-xl h-24 animate-pulse border border-outline-variant" />
            ))
          ) : notifications.length === 0 ? (
            <div className="text-center py-xl text-on-surface-variant">
              <BellOff className="w-12 h-12 mb-md block mx-auto" />
              <p className="text-body-lg">Belum ada notifikasi</p>
            </div>
          ) : (
            notifications.map((n) => {
              const style = ICON_MAP[n.type] ?? ICON_MAP.system;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleReadOne(n.id)}
                  className={`bg-surface-container-lowest rounded-xl shadow-card border-l-4 ${style.border} p-md flex gap-md items-start relative overflow-hidden group cursor-pointer hover:bg-surface-container-low transition-colors ${n.isRead ? "opacity-70" : ""}`}
                >
                  {!n.isRead && (
                    <div className="absolute inset-0 bg-error/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  )}
                  <div className={`w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center shrink-0`}>
                    {renderIcon(style.icon, `w-5 h-5 ${style.iconColor}`)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-xs">
                      <h3 className="text-h3 font-semibold text-on-background">{n.title}</h3>
                      <span className="text-body-sm text-on-surface-variant whitespace-nowrap ml-sm">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-body-md text-on-surface-variant">{n.message}</p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-error shrink-0 mt-2" />}
                </div>
              );
            })
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
