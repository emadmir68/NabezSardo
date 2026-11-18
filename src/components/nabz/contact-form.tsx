"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2, XCircle } from "lucide-react";

const inputCls =
  "h-12 w-full rounded-xl border bg-[rgba(232,198,117,0.04)] px-4 text-[0.9rem] text-[color:var(--nz-cream)] outline-none transition-colors placeholder:text-[color:var(--nz-muted)] focus:border-[color:var(--nz-gold-deep)]";

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const f = e.currentTarget;
    try {
      const fd = new FormData(f);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({ ok: true, msg: "پیام شما ثبت شد. سپاس از همراهی‌تان." });
        f.reset();
      } else {
        setResult({ ok: false, msg: data.error || "ارسال پیام ناموفق بود؛ دوباره تلاش کنید." });
      }
    } catch {
      setResult({ ok: false, msg: "خطای شبکه؛ اتصال اینترنت را بررسی کنید." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-[0.8rem] font-semibold text-[color:var(--nz-cream)]">نام *</span>
          <input name="name" required className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-2 block text-[0.8rem] font-semibold text-[color:var(--nz-cream)]">راه ارتباطی *</span>
          <input name="contact" required className={inputCls} placeholder="شماره تماس یا ایمیل" />
        </label>
      </div>
      <label className="block">
        <span className="mb-2 block text-[0.8rem] font-semibold text-[color:var(--nz-cream)]">موضوع</span>
        <input name="subject" className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-2 block text-[0.8rem] font-semibold text-[color:var(--nz-cream)]">پیام *</span>
        <textarea
          name="message"
          required
          rows={6}
          className="w-full rounded-xl border bg-[rgba(232,198,117,0.04)] px-4 py-3.5 text-[0.9rem] leading-8 text-[color:var(--nz-cream)] outline-none transition-colors placeholder:text-[color:var(--nz-muted)] focus:border-[color:var(--nz-gold-deep)]"
          style={{ borderColor: "var(--nz-line)" }}
        />
      </label>
      {result && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-[0.85rem] leading-7 ${
            result.ok ? "text-emerald-300" : "text-red-300"
          }`}
          style={{ borderColor: result.ok ? "rgba(52,211,153,0.35)" : "rgba(248,113,113,0.35)", background: result.ok ? "rgba(52,211,153,0.07)" : "rgba(248,113,113,0.07)" }}
        >
          {result.ok ? <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" aria-hidden /> : <XCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden />}
          {result.msg}
        </div>
      )}
      <button type="submit" disabled={busy} className="nz-btn-gold inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-[0.92rem] disabled:opacity-60">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Send className="h-[18px] w-[18px]" aria-hidden />}
        {busy ? "در حال ارسال…" : "ارسال پیام"}
      </button>
    </form>
  );
}
