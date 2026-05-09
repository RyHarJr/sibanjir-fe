"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <TopBar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <Sidebar collapsed={collapsed} />
      <div
        className={`flex-1 flex flex-col min-h-screen pt-16 transition-all duration-300 ${
          collapsed ? "md:ml-[72px]" : "md:ml-[240px]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
