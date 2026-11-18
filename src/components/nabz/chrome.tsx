import Link from "next/link";
import { Search, Camera, CloudSun, Eye, Flame } from "lucide-react";
import { catColor, timeAgoFa, faNum, type PublishedArticle } from "@/lib/nabz";

/* ——— لوگوی نبض ساردو (خط نبض طلایی) ——— */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role="img"
      aria-label="نبض ساردو"
      className="shrink-0"
    >
      <rect width="512" height="512" rx="112" fill="#090b0f" />
      <defs>
        <linearGradient id="nz-logo-g" x1="64" y1="170" x2="448" y2="352" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9b6a2b" />
          <stop offset=".28" stopColor="#f0ce84" />
          <stop offset=".58" stopColor="#fff1bc" />
          <stop offset="1" stopColor="#9a6a2d" />
        </linearGradient>
      </defs>
      <path
        d="M64 272h92l38-58 46 132 52-210 58 166 42-50h56"
        fill="none"
        stroke="url(#nz-logo-g)"
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M64 262h92l38-58 46 132 52-210 58 166 42-50h56"
        fill="none"
        stroke="#fff3c8"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".75"
      />
    </svg>
  );
}

/* ——— خط نبض: امضای طراحی ——— */
export function PulseLine() {
  return (
    <div aria-hidden className="pointer-events-none relative w-full">
      <svg viewBox="0 0 1440 160" className="block h-[70px] w-full md:h-[104px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="nz-gold-grad" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#b98a3c" stopOpacity="0" />
            <stop offset="0.18" stopColor="#b98a3c" />
            <stop offset="0.45" stopColor="#e8c675" />
            <stop offset="0.55" stopColor="#f7e3b0" />
            <stop offset="0.75" stopColor="#e8c675" />
            <stop offset="1" stopColor="#b98a3c" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path
          className="nz-pulse-path"
          style={{ animationDelay: "0.9s" }}
          d="M0 88 H460 l49 -32 l60 73 l68 -115 l75 91 l55 -28 l73 11 H1440"
          opacity="0.3"
          strokeWidth="7"
        />
        <path
          className="nz-pulse-path"
          style={{ animationDelay: "0.6s" }}
          d="M0 88 H460 l49 -32 l60 73 l68 -115 l75 91 l55 -28 l73 11 H1440"
        />
      </svg>
    </div>
  );
}

/* ——— هدر مشترک ——— */
const NAV = [
  { href: "/", label: "خانه" },
  { href: "/all-news", label: "آخرین اخبار" },
  { href: "/category/sardouiyeh", label: "ساردوئیه" },
  { href: "/category/incidents", label: "حوادث" },
  { href: "/category/weather", label: "آب‌وهوا" },
  { href: "/category/social", label: "اجتماعی" },
  { href: "/category/culture", label: "فرهنگی" },
  { href: "/category/sports", label: "ورزش" },
];

export function SiteHeader() {
  return (
    <header className="nz-header">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center gap-4 px-4 md:gap-7 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="leading-tight">
            <span className="nz-display block text-[1.15rem] font-black tracking-tight text-[color:var(--nz-cream)]">
              نبض ساردو
            </span>
            <span className="block text-[0.62rem] font-medium text-[color:var(--nz-gold-deep)]">
              صدای ساردوئیه، روایت مردم
            </span>
          </span>
        </Link>

        <nav aria-label="دسته‌های خبری" className="nz-scrollx hidden flex-1 items-center gap-5 overflow-x-auto lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="nz-navlink">
              {n.href.startsWith("/category/") && (
                <span className="nz-navdot" style={{ background: catColor(n.href.split("/")[2]) }} aria-hidden />
              )}
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2.5 lg:flex-none">
          <Link
            href="/all-news"
            aria-label="جستجو در اخبار"
            className="nz-btn-ghost grid h-10 w-10 place-items-center rounded-full"
          >
            <Search className="h-[17px] w-[17px] text-[color:var(--nz-muted)]" />
          </Link>
          <Link href="/send-news" className="nz-btn-gold hidden h-10 items-center gap-2 rounded-full px-5 text-[0.82rem] sm:inline-flex">
            <Camera className="h-4 w-4" />
            ارسال خبر
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ——— فوتر مشترک ——— */
export function SiteFooter({ cats }: { cats: { id: string; name: string; count: number }[] }) {
  return (
    <footer className="mt-auto">
      <div className="nz-girih border-t" style={{ borderColor: "var(--nz-line)", background: "var(--nz-ink-2)" }}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 md:grid-cols-12 md:px-6">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <Logo size={40} />
              <span className="leading-tight">
                <span className="nz-display block text-[1.25rem] font-black text-[color:var(--nz-cream)]">نبض ساردو</span>
                <span className="block text-[0.68rem] font-medium text-[color:var(--nz-gold-deep)]">NABZ SARDO / SOUTH KERMAN</span>
              </span>
            </div>
            <p className="mt-5 max-w-sm text-[0.85rem] leading-8 text-[color:var(--nz-muted)]">
              رسانه مستقل خبری و تحلیلی جنوب کرمان؛ خبرِ ساردوئیه، جیرفت و جنوب استان را مردم این‌جا می‌نویسند و تحریریه روایت می‌کند.
            </p>
          </div>
          <nav className="md:col-span-4" aria-label="دسته‌ها در فوتر">
            <h3 className="mb-4 text-[0.8rem] font-bold text-[color:var(--nz-gold)]">دسته‌های خبر</h3>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-[0.83rem]">
              {cats.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link href={`/category/${c.id}`} className="inline-flex items-center gap-2 text-[color:var(--nz-muted)] transition-colors hover:text-[color:var(--nz-cream)]">
                    <span className="h-[4px] w-[4px] rotate-45" style={{ background: catColor(c.id) }} aria-hidden />
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="md:col-span-3">
            <h3 className="mb-4 text-[0.8rem] font-bold text-[color:var(--nz-gold)]">رسانه</h3>
            <ul className="space-y-3 text-[0.83rem]">
              {[
                ["/about", "درباره ما"],
                ["/contact", "تماس با ما"],
                ["/send-news", "ارسال خبر مردمی"],
                ["/all-news", "آرشیو اخبار"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-[color:var(--nz-muted)] transition-colors hover:text-[color:var(--nz-cream)]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t py-5" style={{ borderColor: "var(--nz-line-soft)" }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-[0.75rem] text-[color:var(--nz-muted)] md:px-6">
            <span>© ۱۴۰۵ نبض ساردو — تمامی حقوق محفوظ است</span>
            <span className="inline-flex items-center gap-2">
              <span className="nz-beat" aria-hidden style={{ width: "5px", height: "5px" }} />
              نسخه جدید — بازطراحی
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ——— کارت خبر استاندارد (برای صفحات داخلی) ——— */
export function StoryCard({ a }: { a: PublishedArticle }) {
  return (
    <article className="nz-card-v2 group">
      <Link href={`/news/${encodeURIComponent(a.slug)}`} className="flex h-full flex-col">
        <div className="relative">
          <StoryImage a={a} className="aspect-[16/9] w-full">
            <MediaVeil />
            <span className="nz-onimg-chip start-3 top-3">
              <span className="h-[5px] w-[5px] rotate-45 rounded-[1px]" style={{ background: catColor(a.categoryId) }} aria-hidden />
              {a.category.name}
            </span>
          </StoryImage>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="nz-card-title nz-display text-[0.95rem] font-bold leading-7 text-[color:var(--nz-cream)]">{a.title}</h3>
          <StoryMeta a={a} />
        </div>
      </Link>
    </article>
  );
}

/* ——— کارت داغ‌ترین‌ها (پربازدید) ——— */
export function HotCard({ a, rank }: { a: PublishedArticle; rank: number }) {
  return (
    <article className="nz-card-v2 group">
      <Link href={`/news/${encodeURIComponent(a.slug)}`} className="flex h-full items-stretch gap-4 p-3">
        <div className="relative w-[34%] shrink-0">
          <StoryImage a={a} className="aspect-[4/3] h-full w-full" rounded={12} />
          <span
            className="nz-display absolute -start-1 -top-1.5 grid h-6 w-6 place-items-center rounded-full text-[0.7rem] font-black"
            style={{ background: "var(--nz-gold)", color: "#14100a" }}
            aria-hidden
          >
            {faNum(rank)}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h3 className="nz-card-title nz-display line-clamp-3 text-[0.86rem] font-bold leading-6 text-[color:var(--nz-cream)]">
            {a.title}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-[0.68rem] text-[color:var(--nz-muted)]">
            <span className="inline-flex items-center gap-1 font-semibold" style={{ color: "var(--nz-gold-deep)" }}>
              <Flame className="h-3 w-3" aria-hidden />
              {faNum(a.views ?? 0)} بازدید
            </span>
            <span aria-hidden className="h-[3px] w-[3px] rotate-45 bg-[color:var(--nz-gold-deep)]" />
            <span>{timeAgoFa(a.publishedAt || a.createdAt)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function CatLabel({ a }: { a: PublishedArticle }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.74rem] font-semibold" style={{ color: catColor(a.categoryId) }}>
      <span className="h-[3px] w-[14px] rounded-full" style={{ background: catColor(a.categoryId) }} aria-hidden />
      {a.category.name}
    </span>
  );
}

export function StoryMeta({ a }: { a: PublishedArticle }) {
  return (
    <div className="mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-3 text-[0.7rem] text-[color:var(--nz-muted)]">
      <span>{timeAgoFa(a.publishedAt || a.createdAt)}</span>
      <span aria-hidden className="h-[3px] w-[3px] rotate-45 bg-[color:var(--nz-gold-deep)]" />
      {a.location ? (
        <>
          <span>{a.location}</span>
          <span aria-hidden className="h-[3px] w-[3px] rotate-45 bg-[color:var(--nz-gold-deep)]" />
        </>
      ) : null}
      <span className="inline-flex items-center gap-1">
        <Eye className="h-3.5 w-3.5" aria-hidden />
        {faNum(a.views ?? 0)}
      </span>
    </div>
  );
}

/* ——— لایهٔ تیرهٔ پایین عکس تا چیپ‌ها خوانا باشند ——— */
export function MediaVeil() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ background: "linear-gradient(to top, rgba(10,12,16,0.66) 0%, rgba(10,12,16,0.12) 34%, transparent 55%)" }}
    />
  );
}

export function StoryImage({
  a,
  className,
  rounded = 0,
  children,
}: {
  a: PublishedArticle;
  className?: string;
  rounded?: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={rounded ? { borderRadius: rounded } : undefined}
    >
      {a.image ? (
        <img src={a.image} alt={a.title} className="nz-card-img h-full w-full object-cover" loading="lazy" />
      ) : (
        <div
          className="nz-girih flex h-full w-full items-center justify-center"
          style={{ background: `radial-gradient(120% 120% at 85% 15%, ${catColor(a.categoryId)}26 0%, rgba(21,26,35,0.96) 62%)` }}
          aria-hidden
        >
          <span className="opacity-40" style={{ color: catColor(a.categoryId) }}>
            <CloudSun className="h-9 w-9" />
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
