import { MapPin, Mail, MessageSquareText } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/nabz/chrome";
import { ContactForm } from "@/components/nabz/contact-form";
import { getCategoriesWithCounts } from "@/lib/nabz-data";
import { isD1, prodOrigin } from "@/lib/mode";

export const metadata: Metadata = {
  title: "تماس با ما | نبض ساردو",
  description: "راه‌های ارتباط با تحریریه نبض ساردو",
};

export default async function ContactPage() {
  /* در حالت d1، پیام‌ها از طریق فرم اصلی سایت ثبت می‌شوند */
  if (isD1()) redirect(`${prodOrigin()}/contact`);
  const cats = await getCategoriesWithCounts();
  return (
    <div className="nz-page">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-14 md:px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h1 className="nz-display text-[1.6rem] font-extrabold text-[color:var(--nz-cream)] md:text-[2rem]">تماس با تحریریه</h1>
              <p className="mt-5 text-[0.92rem] leading-8 text-[color:var(--nz-muted)]">
                پیام، پیشنهاد همکاری یا اطلاع‌رسانی اصلاح گزارش — از هر راهی که راحت‌ترید با ما در ارتباط باشید.
              </p>
              <ul className="mt-8 space-y-4 text-[0.88rem]">
                <li className="flex items-center gap-3.5 rounded-xl border px-5 py-4" style={{ borderColor: "var(--nz-line)", background: "var(--nz-ink-2)" }}>
                  <MapPin className="h-5 w-5 shrink-0 text-[color:var(--nz-gold)]" aria-hidden />
                  <span className="text-[color:var(--nz-muted)]">ساردوئیه، جنوب کرمان</span>
                </li>
                <li className="flex items-center gap-3.5 rounded-xl border px-5 py-4" style={{ borderColor: "var(--nz-line)", background: "var(--nz-ink-2)" }}>
                  <Mail className="h-5 w-5 shrink-0 text-[color:var(--nz-gold)]" aria-hidden />
                  <span className="text-[color:var(--nz-muted)]" dir="ltr">news@nabzesardo.ir</span>
                </li>
                <li className="flex items-center gap-3.5 rounded-xl border px-5 py-4" style={{ borderColor: "var(--nz-line)", background: "var(--nz-ink-2)" }}>
                  <MessageSquareText className="h-5 w-5 shrink-0 text-[color:var(--nz-gold)]" aria-hidden />
                  <span className="text-[color:var(--nz-muted)]">پاسخ‌گویی روزهای ادبی از ساعت ۹ تا ۱۷</span>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-7">
              <div className="rounded-[22px] border p-6 md:p-9" style={{ borderColor: "var(--nz-line)", background: "var(--nz-ink-2)" }}>
                <h2 className="nz-display mb-7 text-[1.1rem] font-extrabold text-[color:var(--nz-cream)]">فرم تماس</h2>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter cats={cats} />
    </div>
  );
}
