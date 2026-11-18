import { Compass, HeartPulse, Eye, ScrollText } from "lucide-react";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, PulseLine } from "@/components/nabz/chrome";
import { getCategoriesWithCounts } from "@/lib/nabz-data";

/* داده‌ها در زمان درخواست از دیتابیس خوانده می‌شوند (Workers: D1 زنده) */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "درباره ما | نبض ساردو",
  description: "درباره نبض ساردو، رسانه مستقل خبری و تحلیلی جنوب کرمان",
};

export default async function AboutPage() {
  const cats = await getCategoriesWithCounts();
  return (
    <div className="nz-page">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative" style={{ background: "var(--nz-ink-2)" }}>
          <div className="nz-girih absolute inset-0 opacity-40" aria-hidden />
          <div className="relative mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-20">
            <h1 className="nz-display text-[1.7rem] font-extrabold text-[color:var(--nz-cream)] md:text-[2.2rem]">درباره نبض ساردو</h1>
            <p className="mt-5 text-[0.95rem] leading-9 text-[color:var(--nz-muted)]">
              نبض ساردو رسانه مستقل خبری و تحلیلی جنوب کرمان است؛ صدای ساردوئیه و روایت مردم. ما خبرهای ساردوئیه، جیرفت و جنوب استان را سریع، دقیق و محلی پوشش می‌دهیم؛ از میدان شهر تا نخلستان‌ها، از مدرسه تا شورای شهر.
            </p>
          </div>
          <div className="absolute inset-x-0 bottom-[-20px] opacity-90">
            <PulseLine />
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 pt-14 md:px-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[
              { icon: Compass, t: "مأموریت ما", d: "خبرِ محلی حق همه است. با گزارش‌های میدانی و بی‌طرف، ما تصویر واقعی جنوب کرمان را روایت می‌کنیم." },
              { icon: HeartPulse, t: "نبض مردم", d: "کارگاه ما کوچه‌های ساردوئیه است؛ هر جا خبری است، مردم ما چشم و گوش تحریریه‌اند." },
              { icon: Eye, t: "شفافیت", d: "اگر گزارشی نیازمند اصلاح باشد، با ذکر متن اصلاحیه منتشر می‌شود. سیاست تحریریه ما صداقت است." },
              { icon: ScrollText, t: "اصول تحریریه", d: "احترام به حریم خصوصی، پرهیز از شایعه، استناد به منابع و رعایت اصول حرفه‌ای روزنامه‌نگاری." },
            ].map((r) => (
              <div key={r.t} className="rounded-[18px] border p-6" style={{ borderColor: "var(--nz-line)", background: "var(--nz-ink-2)" }}>
                <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: "rgba(232,198,117,0.07)" }}>
                  <r.icon className="h-5 w-5 text-[color:var(--nz-gold)]" aria-hidden />
                </span>
                <h2 className="nz-display mt-4 text-[1rem] font-extrabold text-[color:var(--nz-cream)]">{r.t}</h2>
                <p className="mt-3 text-[0.85rem] leading-8 text-[color:var(--nz-muted)]">{r.d}</p>
              </div>
            ))}
          </div>

          <div className="nz-girih mt-12 rounded-[18px] border px-7 py-8" style={{ borderColor: "var(--nz-gold-deep)", background: "rgba(232,198,117,0.04)" }}>
            <p className="text-[0.9rem] leading-9 text-[color:var(--nz-muted)]">
              برای پیگیری خبر، ارسال گزارش مردمی یا همکاری با تحریریه، از صفحه <a href="/contact" className="text-[color:var(--nz-gold)] underline underline-offset-4">تماس با ما</a> و فرم <a href="/send-news" className="text-[color:var(--nz-gold)] underline underline-offset-4">ارسال خبر مردمی</a> استفاده کنید.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter cats={cats} />
    </div>
  );
}
