"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole, User } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: f.get("username"), password: f.get("password") }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "ورود ناموفق بود.");
      }
    } catch {
      setError("خطای شبکه؛ دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="nz-page grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <svg width="76" height="76" viewBox="0 0 512 512" className="mx-auto" role="img" aria-label="نبض ساردو">
            <rect width="512" height="512" rx="112" fill="#090b0f" />
            <defs>
              <linearGradient id="nz-lg-in" x1="64" y1="170" x2="448" y2="352" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#9b6a2b" />
                <stop offset=".28" stopColor="#f0ce84" />
                <stop offset=".58" stopColor="#fff1bc" />
                <stop offset="1" stopColor="#9a6a2d" />
              </linearGradient>
            </defs>
            <path d="M64 272h92l38-58 46 132 52-210 58 166 42-50h56" fill="none" stroke="url(#nz-lg-in)" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M64 262h92l38-58 46 132 52-210 58 166 42-50h56" fill="none" stroke="#fff3c8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity=".75" />
          </svg>
          <h1 className="nz-display mt-5 text-[1.3rem] font-black text-[color:var(--nz-cream)]">پنل مدیریت نبض ساردو</h1>
          <p className="mt-2 text-[0.8rem] text-[color:var(--nz-muted)]">ورود تحریریه</p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-[20px] border p-7"
          style={{ borderColor: "var(--nz-line)", background: "var(--nz-ink-2)" }}
        >
          <label className="block">
            <span className="mb-2 block text-[0.8rem] font-semibold text-[color:var(--nz-cream)]">نام کاربری</span>
            <div className="relative">
              <User className="absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--nz-muted)]" aria-hidden />
              <input
                name="username"
                required
                autoComplete="username"
                className="h-12 w-full rounded-xl border bg-[rgba(232,198,117,0.04)] pe-10 ps-4 text-[0.9rem] text-[color:var(--nz-cream)] outline-none transition-colors focus:border-[color:var(--nz-gold-deep)]"
                style={{ borderColor: "var(--nz-line)" }}
              />
            </div>
          </label>
          <label className="mt-5 block">
            <span className="mb-2 block text-[0.8rem] font-semibold text-[color:var(--nz-cream)]">گذرواژه</span>
            <div className="relative">
              <LockKeyhole className="absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--nz-muted)]" aria-hidden />
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-12 w-full rounded-xl border bg-[rgba(232,198,117,0.04)] pe-10 ps-4 text-[0.9rem] text-[color:var(--nz-cream)] outline-none transition-colors focus:border-[color:var(--nz-gold-deep)]"
                style={{ borderColor: "var(--nz-line)" }}
              />
            </div>
          </label>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[0.82rem] text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="nz-btn-gold mt-7 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-[0.92rem] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
            {busy ? "در حال ورود…" : "ورود به پنل"}
          </button>
        </form>

        <p className="mt-6 text-center text-[0.72rem] leading-6 text-[color:var(--nz-muted)]">
          مشخصات ورود از متغیرهای محیطی ADMIN_USER و ADMIN_PASS خوانده می‌شود.
        </p>
      </div>
    </div>
  );
}
