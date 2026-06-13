import AdminAppShell from "@/components/AdminAppShell";
import { AuthProvider } from "@/lib/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminAppShell>{children}</AdminAppShell>
    </AuthProvider>
  );
}
