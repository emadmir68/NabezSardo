import { ArrowLeft, MapPin, Eye, User, CalendarDays, Printer, Link2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, StoryCard, PulseLine } from "@/components/nabz/chrome";
import { ViewPing } from "@/components/nabz/view-ping";
import { ShareRow } from "@/components/nabz/share-row";
import { catColor, faNum, faDate, compact } from "@/lib/nabz";
import { getArticle, getRelated, getCategoriesWithCounts } from "@/lib/nabz-data";

/* داده‌ها در زمان درخواست از دیتابیس خوانده می‌شوند (Workers: D1 زنده) */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(decodeURIComponent(slug));
  if (!a) return { title: "خبر یافت نشد | نبض ساردو" };
  return {
    title: `${a.title} | نبض ساردو`,
    description: compact(a.lead || a.body, 160),
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(decodeURIComponent(slug));
  if (!article) notFound();
  const [related, cats] = await Promise.all([getRelated(article, 3), getCategoriesWithCounts()]);
  const color = catColor(article.categoryId);
  const pub = article.publishedAt || article.createdAt;

  return (
    <div className="nz-page">
      <SiteHeader />
      <ViewPing id={article.id} />
      <main className="flex-1">
        {/* سربرگ مقاله */}
        <div className="relative" style={{ background: "var(--nz-ink-2)" }}>
          <div
            className="absolute inset-0 opacity-[0.16]"
            style={
              article.image
                ? { backgroundImage: `url(${article.image})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(2px)" }
                : {
                    background: `radial-gradient(90% 90% at 70% 10%, ${color}30 0%, transparent 60%)`,
                  }
            }
            aria-hidden
          />
          <div className="relative mx-auto max-w-4xl px-4 pb-10 pt-14 md:px-6 md:pt-20">
            <nav aria-label="مسیر" className="mb-6 flex flex-wrap items-center gap-2 text-[0.75rem] text-[color:var(--nz-muted)]">
              <Link href="/" className="transition-colors hover:text-[color:var(--nz-cream)]">خانه</Link>
              <span aria-hidden>/</span>
              <Link href={`/category/${article.categoryId}`} className="transition-colors hover:text-[color:var(--nz-cream)]">
                {article.category.name}
              </Link>
            </nav>

            <span
              className="mb-4 inline-block rounded-sm px-2.5 py-1 text-[0.72rem] font-bold tracking-wide"
              style={{ background: color, color: "#12100a" }}
            >
              {article.category.name}
            </span>

            <h1 className="nz-display text-[1.5rem] font-extrabold leading-[1.6] text-[color:var(--nz-cream)] md:text-[2.1rem] md:leading-[1.6]">
              {article.title}
            </h1>

            {article.lead && (
              <p className="mt-5 border-e-2 pe-4 text-[1rem] leading-9 text-[color:var(--nz-muted)]" style={{ borderColor: color }}>
                {article.lead}
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.78rem] text-[color:var(--nz-muted)]">
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4 text-[color:var(--nz-gold-deep)]" aria-hidden />
                {article.author}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[color:var(--nz-gold-deep)]" aria-hidden />
                {faDate(pub, true)}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[color:var(--nz-gold-deep)]" aria-hidden />
                {article.location}
              </span>
              <span className="inline-flex items-center gap-2">
                <Eye className="h-4 w-4 text-[color:var(--nz-gold-deep)]" aria-hidden />
                {faNum(article.views)} بازدید
              </span>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-[-20px] opacity-90">
            <PulseLine />
          </div>
        </div>

        {/* تصویر شاخص */}
        {article.image && (
          <div className="mx-auto max-w-4xl px-4 pt-12 md:px-6">
            <div className="overflow-hidden rounded-[18px] border" style={{ borderColor: "var(--nz-line)" }}>
              { }
              <img src={article.image} alt={article.title} className="aspect-[16/9] w-full object-cover" />
            </div>
          </div>
        )}

        {/* بدنه */}
        <article
          className="nz-article mx-auto max-w-4xl px-4 pt-10 md:px-6"
          dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
        />

        {/* ابزار اشتراک */}
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-4 pt-8 md:px-6">
          <span className="text-[0.78rem] text-[color:var(--nz-muted)]">اشتراک‌گذاری:</span>
          <ShareRow title={article.title} />
        </div>

        {/* گزارش مرتبط */}
        {related.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 pt-16 md:px-6" aria-label="گزارش‌های مرتبط">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="nz-display text-[1.2rem] font-extrabold text-[color:var(--nz-cream)]">گزارش‌های مرتبط</h2>
              <Link href="/all-news" className="group inline-flex items-center gap-1.5 text-[0.8rem] text-[color:var(--nz-gold)]">
                آرشیو کامل
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {related.map((r) => (
                <StoryCard key={r.id} a={r} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter cats={cats} />
    </div>
  );
}
