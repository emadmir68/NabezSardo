import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, StoryCard, StoryImage, StoryMeta, MediaVeil } from "@/components/nabz/chrome";
import { catColor, faNum } from "@/lib/nabz";
import { getPublished, getCategoriesWithCounts } from "@/lib/nabz-data";

/* داده‌ها در زمان درخواست از دیتابیس خوانده می‌شوند (Workers: D1 زنده) */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cats = await getCategoriesWithCounts();
  const c = cats.find((x) => x.id === id);
  return {
    title: c ? `اخبار ${c.name} | نبض ساردو` : "دسته‌بندی یافت نشد | نبض ساردو",
    description: c ? `آخرین خبرهای دسته ${c.name} در نبض ساردو` : undefined,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { id } = await params;
  const [cats, items] = await Promise.all([getCategoriesWithCounts(), getPublished({ categoryId: id })]);
  const cat = cats.find((x) => x.id === id);
  if (!cat) notFound();
  const color = catColor(cat.id);
  const [lead, ...rest] = items;

  return (
    <div className="nz-page">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-14 md:px-6">
          <nav aria-label="مسیر" className="mb-5 flex items-center gap-2 text-[0.75rem] text-[color:var(--nz-muted)]">
            <Link href="/" className="transition-colors hover:text-[color:var(--nz-cream)]">خانه</Link>
            <span aria-hidden>/</span>
            <span className="text-[color:var(--nz-cream)]">{cat.name}</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="nz-display flex items-center gap-3 text-[1.6rem] font-extrabold text-[color:var(--nz-cream)] md:text-[2rem]">
                <span className="inline-block h-6 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
                اخبار {cat.name}
              </h1>
              <p className="mt-3 text-[0.9rem] text-[color:var(--nz-muted)]">{faNum(items.length)} گزارش منتشرشده</p>
            </div>
            <div className="nz-scrollx flex gap-2.5 overflow-x-auto pb-1">
              <Link href="/all-news" className={`nz-chip ${items.length ? "" : "is-active"}`}>
                همه دسته‌ها
              </Link>
              {cats.map((c) => (
                <Link key={c.id} href={`/category/${c.id}`} className={`nz-chip ${c.id === cat.id ? "is-active" : ""}`}>
                  {c.name}
                  <span className="text-[0.7rem] opacity-70">({faNum(c.count)})</span>
                </Link>
              ))}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="nz-girih mt-12 rounded-[18px] border px-6 py-16 text-center" style={{ borderColor: "var(--nz-line)", background: "var(--nz-ink-2)" }}>
              <p className="text-[0.95rem] text-[color:var(--nz-muted)]">هنوز خبری در این دسته منتشر نشده است.</p>
              <Link href="/send-news" className="nz-btn-gold mt-5 inline-flex h-11 items-center gap-2 rounded-full px-6 text-[0.85rem]">
                شما هم خبر بفرستید
              </Link>
            </div>
          ) : (
            <>
              {/* خبر شاخص دسته */}
              {lead && (
                <article className="nz-card-v2 group mt-10">
                  <Link href={`/news/${encodeURIComponent(lead.slug)}`} className="flex h-full flex-col">
                    <div className="relative">
                      <StoryImage a={lead} className="aspect-[21/9] w-full">
                        <MediaVeil />
                        <span className="nz-onimg-chip is-solid start-4 top-4" style={{ background: color }}>
                          {cat.name}
                        </span>
                      </StoryImage>
                    </div>
                    <div className="p-5">
                      <h2 className="nz-card-title nz-display mt-0 text-[1.2rem] font-bold leading-9 text-[color:var(--nz-cream)] md:text-[1.5rem] md:leading-[2.4rem]">
                        {lead.title}
                      </h2>
                      {lead.lead && <p className="mt-3 max-w-3xl text-[0.9rem] leading-8 text-[color:var(--nz-muted)]">{lead.lead}</p>}
                      <StoryMeta a={lead} />
                    </div>
                  </Link>
                </article>
              )}

              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((a) => (
                  <StoryCard key={a.id} a={a} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <SiteFooter cats={cats} />
    </div>
  );
}
