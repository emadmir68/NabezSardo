import Link from "next/link";
import { Search, FolderOpen } from "lucide-react";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, StoryCard } from "@/components/nabz/chrome";
import { faNum } from "@/lib/nabz";
import { getPublished, getCategoriesWithCounts } from "@/lib/nabz-data";

/* داده‌ها در زمان درخواست از دیتابیس خوانده می‌شوند (Workers: D1 زنده) */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "آرشیو اخبار | نبض ساردو",
  description: "آرشیو کامل خبرهای ساردوئیه، جیرفت و جنوب کرمان",
};

type Props = {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>;
};

const PER_PAGE = 12;

export default async function AllNewsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const cat = (sp.cat || "").trim();
  const page = Math.max(1, Number(sp.page || "1") || 1);

  const [cats, all] = await Promise.all([
    getCategoriesWithCounts(),
    getPublished({ q: q || undefined, categoryId: cat || undefined }),
  ]);
  const totalPages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const items = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const currentCat = cats.find((c) => c.id === cat);

  const qs = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const base = { q: q || undefined, cat: cat || undefined, page: undefined, ...over };
    for (const [k, v] of Object.entries(base)) {
      if (v !== undefined && v !== "" && !(k === "page" && Number(v) === 1)) p.set(k, String(v));
    }
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="nz-page">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-14 md:px-6">
          <h1 className="nz-display text-[1.6rem] font-extrabold text-[color:var(--nz-cream)] md:text-[2rem]">
            {currentCat ? `اخبار ${currentCat.name}` : "آرشیو اخبار"}
          </h1>
          <p className="mt-3 text-[0.9rem] text-[color:var(--nz-muted)]">
            {faNum(all.length)} گزارش در آرشیو{q ? ` — نتایج جستجوی «${q}»` : ""}
          </p>

          {/* جستجو */}
          <form action="/all-news" method="get" className="mt-7 flex max-w-xl items-center gap-2" role="search">
            {cat && <input type="hidden" name="cat" value={cat} />}
            <div className="relative flex-1">
              <Search className="absolute end-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[color:var(--nz-muted)]" aria-hidden />
              <input
                name="q"
                type="search"
                defaultValue={q}
                placeholder="جستجو در خبرها…"
                aria-label="جستجو در خبرها"
                className="h-12 w-full rounded-full border bg-[rgba(232,198,117,0.04)] pe-11 ps-5 text-[0.9rem] text-[color:var(--nz-cream)] outline-none transition-colors placeholder:text-[color:var(--nz-muted)] focus:border-[color:var(--nz-gold-deep)]"
                style={{ borderColor: "var(--nz-line)" }}
              />
            </div>
            <button type="submit" className="nz-btn-gold h-12 rounded-full px-6 text-[0.85rem]">
              جستجو
            </button>
          </form>

          {/* فیلتر دسته‌ها */}
          <div className="nz-scrollx mt-6 flex gap-2.5 overflow-x-auto pb-1">
            <Link href={qs({ cat: undefined, page: undefined })} className={`nz-chip ${!cat ? "is-active" : ""}`}>
              همه
            </Link>
            {cats.map((c) => (
              <Link key={c.id} href={qs({ cat: c.id, page: undefined })} className={`nz-chip ${cat === c.id ? "is-active" : ""}`}>
                {c.name}
                <span className="text-[0.7rem] opacity-70">({faNum(c.count)})</span>
              </Link>
            ))}
          </div>

          {/* نتایج */}
          {items.length ? (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => (
                <StoryCard key={a.id} a={a} />
              ))}
            </div>
          ) : (
            <div className="nz-girih mt-12 flex flex-col items-center gap-4 rounded-[18px] border px-6 py-16 text-center" style={{ borderColor: "var(--nz-line)", background: "var(--nz-ink-2)" }}>
              <FolderOpen className="h-10 w-10 text-[color:var(--nz-gold-deep)]" aria-hidden />
              <p className="text-[0.95rem] text-[color:var(--nz-muted)]">
                {q ? "چیزی برای این جستجو پیدا نشد؛ عبارت دیگری را امتحان کنید." : "هنوز خبری در این بخش منتشر نشده است."}
              </p>
              <Link href="/send-news" className="nz-btn-gold inline-flex h-11 items-center gap-2 rounded-full px-6 text-[0.85rem]">
                شما هم خبر بفرستید
              </Link>
            </div>
          )}

          {/* صفحه‌بندی */}
          {totalPages > 1 && (
            <nav aria-label="صفحه‌بندی" className="mt-12 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={qs({ page: n })}
                  className={`grid h-10 w-10 place-items-center rounded-full border text-[0.85rem] ${
                    n === page
                      ? "border-[color:var(--nz-gold)] bg-[color:var(--nz-gold)] font-bold text-[#12100a]"
                      : "border-[color:var(--nz-line)] text-[color:var(--nz-muted)] hover:text-[color:var(--nz-cream)]"
                  }`}
                >
                  {faNum(n)}
                </Link>
              ))}
            </nav>
          )}
        </section>
      </main>
      <SiteFooter cats={cats} />
    </div>
  );
}
