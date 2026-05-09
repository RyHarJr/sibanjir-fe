import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/lib/AuthContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
