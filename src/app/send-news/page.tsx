import { Camera, Gift, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/nabz/chrome";
import { CitizenForm } from "@/components/nabz/citizen-form";
import { getCategoriesWithCounts } from "@/lib/nabz-data";
import { isD1, prodOrigin } from "@/lib/mode";

export const metadata: Metadata = {
  title: "ارسال خبر مردمی | نبض ساردو",
  description: "خبر، عکس یا ویدئوی خود را برای تحریریه نبض ساردو بفرستید",
};

export default async function SendNewsPage() {
  /* در حالت d1، خبر مردمی از طریق فرم اصلی سایت ثبت می‌شود */
  if (isD1()) redirect(`${prodOrigin()}/send-news`);
  const cats = await getCategoriesWithCounts();
  return (
    <div className="nz-page">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-14 md:px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* معرفی */}
            <div className="lg:col-span-5">
              <h1 className="nz-display text-[1.6rem] font-extrabold leading-relaxed text-[color:var(--nz-cream)] md:text-[2rem]">
                شما هم خبرنگار ساردوئیه‌اید
              </h1>
              <p className="mt-5 text-[0.92rem] leading-8 text-[color:var(--nz-muted)]">
                چیزی دیده‌اید که مردم باید بدانند؟ خبر، عکس یا ویدئوی خود را برای تحریریه نبض ساردو بفرستید. بعد از بررسی، گزارش شما با نام خودتان منتشر می‌شود.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  { icon: ShieldCheck, t: "بررسی تحریریه", d: "هر گزارش پیش از انتشار، از نظر صحت و رعایت اصول خبری بررسی می‌شود." },
                  { icon: Users, t: "انتشار با نام شما", d: "به پاس اعتمادتان، نام شما به‌عنوان خبرنگار مردمی روی گزارش ثبت می‌شود." },
                  { icon: Gift, t: "جوایز مردمی", d: "از برترین گزارش‌های ماه، با کارت هدیه تشویقی قدردانی می‌شود." },
                ].map((r) => (
                  <li key={r.t} className="flex gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border" style={{ borderColor: "var(--nz-line)", background: "rgba(232,198,117,0.05)" }}>
                      <r.icon className="h-5 w-5 text-[color:var(--nz-gold)]" aria-hidden />
                    </span>
                    <span>
                      <span className="nz-display block font-bold text-[color:var(--nz-cream)]">{r.t}</span>
                      <span className="mt-1 block text-[0.8rem] leading-7 text-[color:var(--nz-muted)]">{r.d}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* فرم */}
            <div className="lg:col-span-7">
              <div
                className="rounded-[22px] border p-6 md:p-9"
                style={{ borderColor: "var(--nz-line)", background: "var(--nz-ink-2)" }}
              >
                <div className="mb-7 flex items-center gap-3.5">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "rgba(232,198,117,0.09)" }}>
                    <Camera className="h-6 w-6 text-[color:var(--nz-gold)]" aria-hidden />
                  </span>
                  <div>
                    <h2 className="nz-display text-[1.1rem] font-extrabold text-[color:var(--nz-cream)]">فرم ارسال خبر</h2>
                    <p className="text-[0.76rem] text-[color:var(--nz-muted)]">فیلدهای ستاره‌دار الزامی هستند</p>
                  </div>
                </div>
                <CitizenForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter cats={cats} />
    </div>
  );
}
