import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/nabz/admin-shell";

export const metadata: Metadata = {
  title: "پنل مدیریت | نبض ساردو",
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
