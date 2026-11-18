"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FilePlus2, LogOut, ExternalLink } from "lucide-react";
import { Logo } from "@/components/nabz/chrome";

const LINKS = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/articles/new", label: "خبر جدید", icon: FilePlus2 },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="nz-page min-h-screen">
      <header className="nz-header">
        <div className="mx-auto flex h-[62px] max-w-6xl items-center gap-4 px-4 md:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo size={30} />
            <span className="leading-tight">
              <span className="nz-display block text-[1rem] font-black text-[color:var(--nz-cream)]">پنل مدیریت</span>
              <span className="block text-[0.62rem] font-medium text-[color:var(--nz-gold-deep)]">نبض ساردو</span>
            </span>
          </Link>
          <nav aria-label="منوی پنل" className="flex flex-1 items-center gap-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-[0.8rem] transition-colors ${
                  pathname === l.href
                    ? "bg-[color:var(--nz-gold)] font-bold text-[#12100a]"
                    : "text-[color:var(--nz-muted)] hover:text-[color:var(--nz-cream)]"
                }`}
              >
                <l.icon className="h-4 w-4" aria-hidden />
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="nz-btn-ghost inline-flex h-9 items-center gap-2 rounded-full px-4 text-[0.78rem]"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              سایت
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-red-500/30 px-4 text-[0.78rem] text-red-300 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              خروج
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6">{children}</main>
    </div>
  );
}
