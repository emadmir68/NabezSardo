"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Send, CheckCircle2, XCircle } from "lucide-react";

const inputCls =
  "h-12 w-full rounded-xl border bg-[rgba(232,198,117,0.04)] px-4 text-[0.9rem] text-[color:var(--nz-cream)] outline-none transition-colors placeholder:text-[color:var(--nz-muted)] focus:border-[color:var(--nz-gold-deep)]";

export function CitizenForm() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch("/api/citizen", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({ ok: true, msg: "گزارش شما با موفقیت ثبت شد. تحریریه پس از بررسی با شما در ارتباط است." });
        (e.target as HTMLFormElement).reset();
        setFileName("");
      } else {
        setResult({ ok: false, msg: data.error || "ثبت گزارش ناموفق بود؛ دوباره تلاش کنید." });
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
          <span className="mb-2 block text-[0.8rem] font-semibold text-[color:var(--nz-cream)]">نام و نام خانوادگی *</span>
          <input name="name" required className={inputCls} placeholder="مثلاً علی محمدی" />
        </label>
        <label className="block">
          <span className="mb-2 block text-[0.8rem] font-semibold text-[color:var(--nz-cream)]">شماره تماس *</span>
          <input name="phone" required dir="ltr" inputMode="tel" className={`${inputCls} text-end`} placeholder="۰۹۱۲…" />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-[0.8rem] font-semibold text-[color:var(--nz-cream)]">محل وقوع خبر *</span>
        <input name="location" required className={inputCls} placeholder="مثلاً ساردوئیه، خیابان مسجد جامع" />
      </label>

      <label className="block">
        <span className="mb-2 block text-[0.8rem] font-semibold text-[color:var(--nz-cream)]">تیتر خبر *</span>
        <input name="headline" required className={inputCls} placeholder="خبر خود را در یک جمله بگویید" />
      </label>

      <label className="block">
        <span className="mb-2 block text-[0.8rem] font-semibold text-[color:var(--nz-cream)]">توضیحات</span>
        <textarea
          name="details"
          rows={5}
          className="w-full rounded-xl border bg-[rgba(232,198,117,0.04)] px-4 py-3.5 text-[0.9rem] leading-8 text-[color:var(--nz-cream)] outline-none transition-colors placeholder:text-[color:var(--nz-muted)] focus:border-[color:var(--nz-gold-deep)]"
          style={{ borderColor: "var(--nz-line)" }}
          placeholder="جزئیات خبر: چه اتفاقی افتاده؟ چه کسانی حضور داشتند؟"
        />
      </label>

      {/* آپلود رسانه */}
      <div>
        <span className="mb-2 block text-[0.8rem] font-semibold text-[color:var(--nz-cream)]">عکس یا ویدئو</span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed py-8 transition-colors hover:border-[color:var(--nz-gold-deep)]"
          style={{ borderColor: "var(--nz-gold-deep)", background: "rgba(232,198,117,0.03)" }}
        >
          <ImagePlus className="h-6 w-6 text-[color:var(--nz-gold)]" aria-hidden />
          <span className="text-[0.82rem] text-[color:var(--nz-muted)]">
            {fileName || "انتخاب تصویر یا ویدئو (حداکثر ۵۰ مگابایت)"}
          </span>
        </button>
        <input
          ref={fileRef}
          name="mediaFile"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
        />
      </div>

      <label className="block">
        <span className="mb-2 block text-[0.8rem] font-semibold text-[color:var(--nz-cream)]">
          شماره کارت هدیه <span className="font-normal text-[color:var(--nz-muted)]">(اختیاری — برای دریافت جایزه)</span>
        </span>
        <input name="rewardCard" dir="ltr" inputMode="numeric" maxLength={16} className={`${inputCls} text-end`} placeholder="6037-99..-....-...." />
      </label>

      {result && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-[0.85rem] leading-7 ${
            result.ok ? "text-emerald-300" : "text-red-300"
          }`}
          style={{ borderColor: result.ok ? "rgba(52,211,153,0.35)" : "rgba(248,113,113,0.35)", background: result.ok ? "rgba(52,211,153,0.07)" : "rgba(248,113,113,0.07)" }}
        >
          {result.ok ? <CheckCircle2 className="mt-1 h-4.5 w-4.5 shrink-0" aria-hidden /> : <XCircle className="mt-1 h-4.5 w-4.5 shrink-0" aria-hidden />}
          {result.msg}
        </div>
      )}

      <button type="submit" disabled={busy} className="nz-btn-gold inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-[0.92rem] disabled:opacity-60">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Send className="h-[18px] w-[18px]" aria-hidden />}
        {busy ? "در حال ارسال…" : "ارسال به تحریریه"}
      </button>
      <p className="text-center text-[0.72rem] leading-6 text-[color:var(--nz-muted)]">
        با ارسال گزارش، تأیید می‌کنید محتوا متعلق به خودتان است و تحریریه اجازه ویرایش و انتشار آن را دارد.
      </p>
    </form>
  );
}
