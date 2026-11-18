import {
  Search,
  Sun,
  Wind,
  Droplets,
  Camera,
  MapPin,
  Mail,
  Eye,
  FileText,
  Users,
  ArrowLeft,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Cloudy,
  Megaphone,
  Flame,
  MoonStar,
} from "lucide-react";
import Link from "next/link";
import { LiveClock, PrayerCountdown } from "@/components/nabz/live";
import {
  Logo,
  PulseLine,
  SiteHeader,
  SiteFooter,
  CatLabel,
  StoryCard,
  StoryImage,
  StoryMeta,
  MediaVeil,
  HotCard,
} from "@/components/nabz/chrome";
import { catColor, faNum, faDate, compact, readingMinutes, timeAgoFa, PublishedArticle } from "@/lib/nabz";
import { getHomeArticles, getCategoriesWithCounts, getSettings, getStats } from "@/lib/nabz-data";
import { getWeather, getPrayerTimes } from "@/lib/external";

/* داده‌ها در زمان درخواست از دیتابیس خوانده می‌شوند (Workers: D1 زنده) */
export const dynamic = "force-dynamic";

/* ——— هیرو با خبر اصلی واقعی ——— */
function Hero({ featured }: { featured: PublishedArticle | null }) {
  const bg = featured?.image || "/images/news-valley.png";
  return (
    <section className="nz-hero" aria-label="خبر اصلی">
      <div className="nz-hero-img" style={{ backgroundImage: `url(${bg})` }} />
      <div className="nz-hero-veil" />

      <div className="mx-auto flex min-h-[620px] max-w-6xl flex-col justify-end px-4 pb-24 pt-40 md:px-6 md:pb-28">
        <div className="nz-rise max-w-3xl">
          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-[color:var(--nz-line)] bg-[rgba(10,12,16,0.55)] px-3.5 py-1.5 text-[0.78rem] font-semibold text-[color:var(--nz-cream)] backdrop-blur">
              <span className="nz-beat" aria-hidden />
              زنده
            </span>
            <LiveClock />
          </div>

          {featured ? (
            <>
              <span
                className="mb-4 inline-block rounded-sm px-2.5 py-1 text-[0.72rem] font-bold tracking-wide"
                style={{ background: catColor(featured.categoryId), color: "#12100a" }}
              >
                {featured.category.name}
              </span>

              <h1 className="nz-display text-[1.7rem] font-extrabold leading-[1.5] text-[color:var(--nz-cream)] md:text-[2.5rem] md:leading-[1.45]">
                <Link href={`/news/${encodeURIComponent(featured.slug)}`} className="transition-colors hover:text-[color:var(--nz-gold)]">
                  {featured.title}
                </Link>
              </h1>

              <p className="mt-4 max-w-2xl text-[0.95rem] leading-8 text-[color:var(--nz-muted)] md:text-[1.05rem] md:leading-9">
                {compact(featured.lead || featured.body, 220)}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href={`/news/${encodeURIComponent(featured.slug)}`} className="nz-btn-gold inline-flex h-11 items-center gap-2 rounded-full px-7 text-[0.9rem]">
                  مطلب کامل
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </Link>
                <Link href="/all-news" className="nz-btn-ghost inline-flex h-11 items-center rounded-full px-6 text-[0.85rem] backdrop-blur">
                  همه اخبار
                </Link>
                <span className="ms-1 text-[0.78rem] text-[color:var(--nz-muted)]">
                  {timeAgoFa(featured.publishedAt || featured.createdAt)} — {readingMinutes(featured)} مطالعه
                </span>
              </div>
            </>
          ) : (
            <>
              <h1 className="nz-display text-[1.7rem] font-extrabold leading-[1.5] text-[color:var(--nz-cream)] md:text-[2.5rem] md:leading-[1.45]">
                نبض ساردوئیه؛ صدای خبرهای محلی
              </h1>
              <p className="mt-4 max-w-2xl text-[0.95rem] leading-8 text-[color:var(--nz-muted)] md:text-[1.05rem] md:leading-9">
                خبرهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و قابل اعتماد.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[-26px] z-10">
        <PulseLine />
      </div>
    </section>
  );
}

/* ——— نوار خبر فوری ——— */
function Ticker({ headlines, breaking }: { headlines: string[]; breaking: string }) {
  const items = [breaking, ...headlines];
  const doubled = [...items, ...items];
  return (
    <div className="nz-ticker mt-10" role="region" aria-label="خبرهای فوری">
      <div className="mx-auto flex max-w-6xl items-stretch">
        <span className="relative z-10 inline-flex shrink-0 items-center gap-2 bg-[color:var(--nz-red)] px-4 py-3 text-[0.78rem] font-bold text-white">
          <span className="nz-beat" aria-hidden style={{ background: "#fff" }} />
          فوری
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="nz-ticker-track py-3">
            {doubled.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-3 text-[0.82rem] text-[color:var(--nz-muted)]">
                <span className="h-1 w-1 rotate-45 bg-[color:var(--nz-gold-deep)]" aria-hidden />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ——— شبکه اخبار امروز ——— */
function NewsGrid({
  featured,
  side,
  row,
  cats,
}: {
  featured: PublishedArticle;
  side: PublishedArticle[];
  row: PublishedArticle[];
  cats: { id: string; name: string; count: number }[];
}) {
  const chips = cats.filter((c) => c.id !== "opinion" && c.id !== "short-news");
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 md:px-6" aria-label="اخبار امروز">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="nz-display text-[1.45rem] font-extrabold text-[color:var(--nz-cream)] md:text-[1.7rem]">
          امروز در ساردوئیه
        </h2>
        <Link href="/all-news" className="group inline-flex items-center gap-1.5 text-[0.8rem] text-[color:var(--nz-gold)]">
          همه اخبار
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
        </Link>
      </div>

      <div className="nz-scrollx mb-8 flex gap-2.5 overflow-x-auto pb-1">
        {chips.map((c) => (
          <Link key={c.id} href={`/category/${c.id}`} className={`nz-chip ${c.id === "incidents" ? "is-active" : ""}`}>
            <span
              className="h-[5px] w-[5px] rotate-45 rounded-[1px]"
              style={{ background: c.id === "incidents" ? "#14100a" : catColor(c.id) }}
              aria-hidden
            />
            {c.name}
            <span className="text-[0.7rem] opacity-70">({faNum(c.count)})</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* خبر اصلی */}
        <article className="nz-card-v2 group md:col-span-7">
          <Link href={`/news/${encodeURIComponent(featured.slug)}`} className="flex h-full flex-col">
            <div className="relative">
              <StoryImage a={featured} className="aspect-[16/10] w-full">
                <MediaVeil />
                <span className="nz-onimg-chip is-solid start-3 top-3" style={{ background: catColor(featured.categoryId) }}>
                  {featured.category.name}
                </span>
                <span className="nz-onimg-chip bottom-3 end-3">
                  {timeAgoFa(featured.publishedAt || featured.createdAt)}
                </span>
              </StoryImage>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="nz-card-title nz-display text-[1.2rem] font-bold leading-9 text-[color:var(--nz-cream)] md:text-[1.4rem] md:leading-[2.3rem]">
                {featured.title}
              </h3>
              <p className="mt-2.5 line-clamp-2 text-[0.88rem] leading-7 text-[color:var(--nz-muted)]">
                {compact(featured.lead || featured.body, 170)}
              </p>
              <div className="mt-auto pt-3">
                <StoryMeta a={featured} />
              </div>
            </div>
          </Link>
        </article>

        {/* دو خبر کناری */}
        <div className="flex flex-col gap-6 md:col-span-5">
          {side.map((s) => (
            <article key={s.id} className="nz-card-v2 group flex-1">
              <Link href={`/news/${encodeURIComponent(s.slug)}`} className="flex h-full items-stretch gap-0">
                <div className="relative w-[42%] shrink-0">
                  <StoryImage a={s} className="aspect-[4/3] h-full w-full">
                    <MediaVeil />
                    <span
                      className="absolute bottom-2.5 start-2.5 h-[5px] w-[5px] rotate-45 rounded-[1px]"
                      style={{ background: catColor(s.categoryId) }}
                      aria-hidden
                    />
                  </StoryImage>
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <CatLabel a={s} />
                  <h3 className="nz-card-title nz-display mt-2 line-clamp-3 text-[0.92rem] font-bold leading-7 text-[color:var(--nz-cream)]">
                    {s.title}
                  </h3>
                  <div className="mt-auto">
                    <StoryMeta a={s} />
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {/* ردیف سه‌تایی */}
        {row.map((s) => (
          <article key={s.id} className="nz-card-v2 group md:col-span-4">
            <Link href={`/news/${encodeURIComponent(s.slug)}`} className="flex h-full flex-col">
              <div className="relative">
                <StoryImage a={s} className="aspect-[16/9] w-full">
                  <MediaVeil />
                  <span className="nz-onimg-chip start-3 top-3">
                    <span className="h-[5px] w-[5px] rotate-45 rounded-[1px]" style={{ background: catColor(s.categoryId) }} aria-hidden />
                    {s.category.name}
                  </span>
                </StoryImage>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="nz-card-title nz-display line-clamp-2 text-[0.92rem] font-bold leading-7 text-[color:var(--nz-cream)]">
                  {s.title}
                </h3>
                <StoryMeta a={s} />
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ——— بیشتر بخوانید (با کارت تصویری) ——— */
function MoreStories({ more }: { more: PublishedArticle[] }) {
  if (!more.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 md:px-6" aria-label="ادامه اخبار">
      <h2 className="nz-display mb-6 text-[1.2rem] font-extrabold text-[color:var(--nz-cream)]">بیشتر بخوانید</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {more.map((a) => (
          <StoryCard key={a.id} a={a} />
        ))}
      </div>
    </section>
  );
}

/* ——— داغ‌ترین‌های امروز (پربازدید) ——— */
function HotStrip({ all }: { all: PublishedArticle[] }) {
  const hot = [...all].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 4);
  if (hot.length < 2) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 md:px-6" aria-label="پربازدیدترین خبرها">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="nz-display flex items-center gap-2.5 text-[1.2rem] font-extrabold text-[color:var(--nz-cream)]">
          <Flame className="h-5 w-5 text-[color:var(--nz-red)]" aria-hidden />
          داغ‌ترین‌های نبض ساردو
        </h2>
        <span className="text-[0.72rem] text-[color:var(--nz-muted)]">بر اساس بازدید مخاطبان</span>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {hot.map((a, i) => (
          <HotCard key={a.id} a={a} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}

/* ——— جایگاه تبلیغات (از تنظیمات پنل) ——— */
function AdStrip({ s }: { s: Record<string, string> }) {
  if (!s.adEnabled || s.adEnabled === "" || s.adEnabled === "0") return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 md:px-6" aria-label="جایگاه تبلیغات">
      <Link
        href={s.adLink || "/contact"}
        className="nz-girih group flex flex-wrap items-center justify-between gap-4 rounded-[18px] px-7 py-6"
        style={{ border: "1px dashed var(--nz-gold-deep)", background: "rgba(232,198,117,0.045)" }}
      >
        <span className="inline-flex items-center gap-3.5">
          <Megaphone className="h-5 w-5 text-[color:var(--nz-gold)]" aria-hidden />
          <span>
            <span className="nz-display block text-[0.95rem] font-bold text-[color:var(--nz-cream)]">{s.adTitle}</span>
            <span className="block text-[0.76rem] text-[color:var(--nz-muted)]">{s.adText}</span>
          </span>
        </span>
        <span className="text-[0.78rem] text-[color:var(--nz-gold)] group-hover:underline">رزرو جایگاه</span>
      </Link>
    </section>
  );
}

/* ——— یادداشت سردبیر ——— */
function Opinion({ opinion }: { opinion: PublishedArticle | null }) {
  const quote =
    "خبرِ محلی، حافظه‌ی شهر است. اگر ما ننویسیم، فردا کسی قصه‌ی کوچه‌های ساردو را از ما نمی‌پرسد.";
  return (
    <section className="mx-auto max-w-6xl px-4 pt-20 md:px-6" aria-label="یادداشت">
      <div
        className="relative max-w-4xl rounded-[18px] border px-7 py-9 md:px-12 md:py-12"
        style={{
          borderColor: "var(--nz-line)",
          background: "var(--nz-ink-2)",
          borderInlineStartWidth: "3px",
          borderInlineStartColor: "var(--nz-gold)",
        }}
      >
        <span
          aria-hidden
          className="nz-display absolute -top-2 end-7 select-none text-[5.5rem] font-black leading-none text-[color:var(--nz-gold)] opacity-[0.13]"
        >
          »
        </span>
        {opinion ? (
          <>
            <span className="text-[0.78rem] font-semibold text-[color:var(--nz-gold)]">یادداشت — {opinion.category.name}</span>
            <blockquote className="nz-display mt-4 text-[1.25rem] font-medium leading-[2.3rem] text-[color:var(--nz-cream)] md:text-[1.6rem] md:leading-[2.9rem]">
              <Link href={`/news/${encodeURIComponent(opinion.slug)}`} className="transition-colors hover:text-[color:var(--nz-gold)]">
                {opinion.title}
              </Link>
            </blockquote>
            <p className="mt-5 text-[0.84rem] leading-7 text-[color:var(--nz-muted)]">{compact(opinion.lead || opinion.body, 180)}</p>
          </>
        ) : (
          <>
            <span className="text-[0.78rem] font-semibold text-[color:var(--nz-gold)]">یادداشت سردبیر</span>
            <blockquote className="nz-display mt-4 text-[1.25rem] font-medium leading-[2.3rem] text-[color:var(--nz-cream)] md:text-[1.6rem] md:leading-[2.9rem]">
              {quote}
            </blockquote>
            <p className="mt-5 text-[0.84rem] leading-7 text-[color:var(--nz-muted)]">
              چرا رسانه‌ی محلی برای یک شهر به اندازه‌ی جاده‌هایش مهم است
            </p>
          </>
        )}
      </div>
    </section>
  );
}

const WX_ICON = { sun: Sun, cloud: Cloudy, rain: CloudRain, storm: CloudLightning, snow: Cloud, dust: CloudSun } as const;

/* ——— نوار خدماتی: آب‌وهوای واقعی، اوقات شرعی، آمار ——— */
async function UtilityStrip() {
  const [wx, pray, stats] = await Promise.all([getWeather(), getPrayerTimes(), getStats()]);
  const WxIcon = wx ? WX_ICON[wx.icon] ?? CloudSun : CloudSun;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 md:px-6" aria-label="خدمات و آمار">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* آب‌وهوای واقعی ساردوئیه */}
        <div className="rounded-[18px] border p-6" style={{ borderColor: "var(--nz-line-soft)", background: "var(--nz-ink-2)" }}>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-[0.82rem] font-semibold text-[color:var(--nz-cream)]">
              <MapPin className="h-4 w-4 text-[color:var(--nz-cyan)]" aria-hidden />
              هوای ساردوئیه
            </span>
            <span className="text-[0.68rem] text-[color:var(--nz-muted)]">{wx ? "زنده" : "در دسترس نیست"}</span>
          </div>
          {wx ? (
            <>
              <div className="mt-4 flex items-end gap-4">
                <span className="nz-display text-[3.2rem] font-black leading-none text-[color:var(--nz-cream)]">
                  {faNum(wx.temp)}°
                </span>
                <div className="pb-1.5">
                  <div className="text-[0.85rem] text-[color:var(--nz-muted)]">{wx.label}</div>
                  <div className="text-[0.74rem] text-[color:var(--nz-muted)]">
                    بیشینه {faNum(wx.max)}° / کمینه {faNum(wx.min)}°
                  </div>
                </div>
                <WxIcon className="mb-1 ms-auto h-9 w-9 text-[color:var(--nz-gold)]" aria-hidden />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4 text-[0.78rem] text-[color:var(--nz-muted)]" style={{ borderColor: "var(--nz-line-soft)" }}>
                <span className="inline-flex items-center gap-2">
                  <Wind className="h-4 w-4" aria-hidden /> باد {faNum(wx.wind)} کیلومتر/ساعت
                </span>
                <span className="inline-flex items-center gap-2">
                  <Droplets className="h-4 w-4" aria-hidden /> رطوبت {faNum(wx.humidity)}٪
                </span>
              </div>
            </>
          ) : (
            <p className="mt-6 text-[0.85rem] leading-7 text-[color:var(--nz-muted)]">
              سرویس هواشناسی موقتاً در دسترس نیست.
            </p>
          )}
        </div>

        {/* اوقات شرعی واقعی ساردوئیه — روش تقویم رسمی */}
        <div className="rounded-[18px] border p-6" style={{ borderColor: "var(--nz-line-soft)", background: "var(--nz-ink-2)" }}>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-[0.82rem] font-semibold text-[color:var(--nz-cream)]">
              <MoonStar className="h-4 w-4 text-[color:var(--nz-gold)]" aria-hidden />
              اوقات شرعی ساردوئیه
            </span>
            <span className="text-[0.66rem] text-[color:var(--nz-muted)]">به افق ساردوئیه</span>
          </div>
          {pray ? (
            <>
              {/* اذان بعدی */}
              <div
                className="mt-4 rounded-[14px] border px-4 py-3"
                style={{ borderColor: "rgba(232,198,117,0.28)", background: "rgba(232,198,117,0.06)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[0.8rem] font-bold text-[color:var(--nz-gold)]">
                    <span className="nz-beat" aria-hidden />
                    {pray.next.name}
                  </span>
                  <span className="nz-display text-[1.1rem] font-black tabular-nums text-[color:var(--nz-cream)]">{pray.next.time}</span>
                </div>
                <div className="mt-1 text-end text-[0.7rem] text-[color:var(--nz-muted)]">
                  <PrayerCountdown at={pray.next.at} />
                </div>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-[0.8rem]">
                {[
                  { label: "اذان صبح", v: pray.fajr },
                  { label: "طلوع آفتاب", v: pray.sunrise },
                  { label: "اذان ظهر", v: pray.dhuhr },
                  { label: "اذان عصر", v: pray.asr },
                  { label: "غروب آفتاب", v: pray.sunset },
                  { label: "اذان مغرب", v: pray.maghrib },
                  { label: "اذان عشایی", v: pray.isha },
                  { label: "نیمه‌شب شرعی", v: pray.midnight },
                ].map((r) => (
                  <li key={r.label} className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: "var(--nz-line-soft)" }}>
                    <span className="inline-flex items-center gap-2 text-[color:var(--nz-muted)]">
                      <span className="h-[4px] w-[4px] rotate-45 bg-[color:var(--nz-gold-deep)]" aria-hidden />
                      {r.label}
                    </span>
                    <span className="nz-display font-bold tabular-nums text-[color:var(--nz-cream)]">{r.v}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-6 text-[0.85rem] leading-7 text-[color:var(--nz-muted)]">
              سرویس اوقات شرعی موقتاً در دسترس نیست.
            </p>
          )}
        </div>

        {/* آمار واقعی */}
        <div className="rounded-[18px] border p-6" style={{ borderColor: "var(--nz-line-soft)", background: "var(--nz-ink-2)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[0.82rem] font-semibold text-[color:var(--nz-cream)]">امروز در یک نگاه</span>
            <LiveClock />
          </div>
          <ul className="mt-4 space-y-3.5 text-[0.85rem]">
            {[
              { icon: FileText, v: `${faNum(stats.today)} خبر جدید`, s: `از ${faNum(stats.total)} خبر منتشرشده` },
              { icon: Users, v: `${faNum(stats.newCitizens)} خبر مردمی`, s: "در انتظار بررسی تحریریه" },
              { icon: Eye, v: `${faNum(stats.views)} بازدید`, s: "مجموع بازدید گزارش‌ها" },
            ].map((r) => (
              <li key={r.s} className="flex items-center gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border" style={{ borderColor: "var(--nz-line)", background: "rgba(232,198,117,0.05)" }}>
                  <r.icon className="h-[18px] w-[18px] text-[color:var(--nz-gold)]" aria-hidden />
                </span>
                <span>
                  <span className="nz-display block font-bold text-[color:var(--nz-cream)]">{r.v}</span>
                  <span className="block text-[0.72rem] text-[color:var(--nz-muted)]">{r.s}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ——— دعوت خبر مردمی ——— */
function CitizenCTA() {
  return (
    <section id="citizen" className="mx-auto max-w-6xl px-4 pt-20 md:px-6" aria-label="ارسال خبر مردمی">
      <div
        className="nz-girih relative overflow-hidden rounded-[22px] px-7 py-12 text-center md:px-12 md:py-16"
        style={{
          background:
            "linear-gradient(140deg, rgba(232,198,117,0.10) 0%, rgba(185,138,60,0.05) 45%, rgba(10,12,16,0) 100%), var(--nz-ink-3)",
          border: "1px solid var(--nz-line)",
        }}
      >
        <span className="nz-beat mx-auto block" aria-hidden />
        <h2 className="nz-display mt-5 text-[1.5rem] font-extrabold leading-relaxed text-[color:var(--nz-cream)] md:text-[2rem]">
          نبض ساردو با گزارشِ تو می‌تپه
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[0.92rem] leading-8 text-[color:var(--nz-muted)]">
          عکس یا متن خبر را با آدرس دقیق برای تحریریه بفرست؛ بعد از بررسی، به نام خودت منتشر می‌شود.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/send-news" className="nz-btn-gold inline-flex h-12 items-center gap-2.5 rounded-full px-8 text-[0.95rem]">
            <Camera className="h-[18px] w-[18px]" aria-hidden />
            ارسال خبر مردمی
          </Link>
          <Link href="/contact" className="nz-btn-ghost inline-flex h-12 items-center gap-2 rounded-full px-6 text-[0.88rem]">
            <Mail className="h-4 w-4 text-[color:var(--nz-gold)]" aria-hidden />
            تماس با تحریریه
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ——— صفحه اصلی ——— */
export default async function Home() {
  const [{ all, featured, side, row, more }, cats, settings] = await Promise.all([
    getHomeArticles(),
    getCategoriesWithCounts(),
    getSettings(),
  ]);
  const ticker = all.slice(0, 5).map((a) => a.title);
  const opinion = all.find((a) => a.categoryId === "opinion") ?? null;

  return (
    <div className="nz-page">
      <SiteHeader />
      <main className="flex-1">
        <Hero featured={featured} />
        <Ticker headlines={ticker} breaking={settings.breakingText} />
        {featured && side.length > 0 && <NewsGrid featured={featured} side={side} row={row} cats={cats} />}
        <HotStrip all={all} />
        <MoreStories more={more} />
        <AdStrip s={settings} />
        <Opinion opinion={opinion} />
        <UtilityStrip />
        <CitizenCTA />
      </main>
      <SiteFooter cats={cats} />
    </div>
  );
}
