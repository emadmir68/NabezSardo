/* ——— توابع داده (فقط سرور): انتخاب مخزن بر اساس DATA_MODE ———
   - حالت پیش‌فرض (sqlite): Prisma + دیتابیس محلی — برای توسعه
   - DATA_MODE=d1: خواندن مستقیم مقالات واقعی از D1 سایت زنده روی Cloudflare */
import type { PublishedArticle, CatWithCount, Stats } from "./nabz";
import { isD1 } from "./mode";

type Repo = {
  getPublished(where?: { categoryId?: string; q?: string }): Promise<PublishedArticle[]>;
  getArticle(slug: string): Promise<PublishedArticle | null>;
  getCategoriesWithCounts(): Promise<CatWithCount[]>;
  getSettings(): Promise<Record<string, string>>;
  bumpViews(id: string): Promise<void>;
  getStats(): Promise<Stats>;
};

let repoPromise: Promise<Repo> | null = null;
function repo(): Promise<Repo> {
  if (!repoPromise) {
    repoPromise = (async () => {
      if (isD1()) {
        return (await import("./nabz-d1")).d1Repo;
      }
      return (await import("./repo-sqlite")).sqliteRepo;
    })();
  }
  return repoPromise;
}

/* ——— کوئری‌های اصلی ——— */
export async function getPublished(where?: { categoryId?: string; q?: string }): Promise<PublishedArticle[]> {
  return (await repo()).getPublished(where);
}

export async function getHomeArticles() {
  const all = await getPublished();
  const featured = all.find((a) => a.featured) ?? all[0] ?? null;
  const rest = all.filter((a) => a.id !== featured?.id);
  return { all, featured, side: rest.slice(0, 2), row: rest.slice(2, 5), more: rest.slice(5, 11) };
}

export async function getArticle(slug: string): Promise<PublishedArticle | null> {
  return (await repo()).getArticle(slug);
}

export async function getRelated(article: PublishedArticle, take = 3) {
  const list = (await getPublished())
    .filter((a) => a.id !== article.id)
    .slice(0, 14);
  const sameCat = list.filter((a) => a.categoryId === article.categoryId);
  return [...sameCat, ...list.filter((a) => a.categoryId !== article.categoryId)].slice(0, take);
}

export async function getCategoriesWithCounts(): Promise<CatWithCount[]> {
  return (await repo()).getCategoriesWithCounts();
}

export async function getSettings(): Promise<Record<string, string>> {
  return (await repo()).getSettings();
}

export async function bumpViews(id: string) {
  try {
    await (await repo()).bumpViews(id);
  } catch {
    /* noop */
  }
}

export async function getStats(): Promise<Stats> {
  return (await repo()).getStats();
}
