"use client";

import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import TopBar from "@/components/TopBar";
import AdminBottomNav from "@/components/AdminBottomNav"; // trigger rebuild

export default function AdminAppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <TopBar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        title="Admin Dashboard"
      />
      <AdminSidebar collapsed={collapsed} />
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen pt-16 transition-all duration-300 ${
          collapsed ? "md:ml-[72px]" : "md:ml-[240px]"
        }`}
      >
        {children}
      </div>
      <AdminBottomNav />
    </div>
  );
}
