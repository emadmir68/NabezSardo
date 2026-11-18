/* ——— مخزن دادهٔ محلی (Prisma + SQLite) — فقط برای توسعه و نسخهٔ مستقل ——— */
import { db } from "@/lib/db";
import type { PublishedArticle, CatWithCount, Stats } from "./nabz";

export const sqliteRepo = {
  async getPublished(where?: { categoryId?: string; q?: string }): Promise<PublishedArticle[]> {
    return db.article.findMany({
      where: {
        status: "published",
        ...(where?.categoryId ? { categoryId: where.categoryId } : {}),
        ...(where?.q
          ? {
              OR: [
                { title: { contains: where.q } },
                { lead: { contains: where.q } },
                { body: { contains: where.q } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
  },

  async getArticle(slug: string): Promise<PublishedArticle | null> {
    const a = await db.article.findFirst({
      where: { OR: [{ slug }, { id: slug }], status: "published" },
      include: { category: true },
    });
    return a;
  },

  async getCategoriesWithCounts(): Promise<CatWithCount[]> {
    const cats = await db.category.findMany({ orderBy: { order: "asc" } });
    const grouped = await db.article.groupBy({
      by: ["categoryId"],
      where: { status: "published" },
      _count: { _all: true },
    });
    const counts = new Map(grouped.map((g) => [g.categoryId, g._count._all]));
    return cats.map((c) => ({ ...c, count: counts.get(c.id) ?? 0 }));
  },

  async getSettings(): Promise<Record<string, string>> {
    const rows = await db.setting.findMany();
    const map: Record<string, string> = {
      siteName: "نبض ساردو",
      tagline: "رسانه مستقل خبری و تحلیلی جنوب کرمان",
      breakingText: "مهم‌ترین رویدادهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و محلی.",
      adEnabled: "",
      adTitle: "جای تبلیغات شما اینجاست",
      adText: "برای رزرو این جایگاه با نبض ساردو در ارتباط باشید",
      adLink: "/contact",
      adImage: "",
    };
    for (const r of rows) map[r.key] = r.value;
    return map;
  },

  async bumpViews(id: string): Promise<void> {
    try {
      await db.article.update({ where: { id }, data: { views: { increment: 1 } } });
    } catch {
      /* noop */
    }
  },

  async getStats(): Promise<Stats> {
    const [total, todayCount, citizens, contacts] = await Promise.all([
      db.article.count({ where: { status: "published" } }),
      db.article.count({
        where: { status: "published", publishedAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
      }),
      db.citizenReport.count({ where: { status: "new" } }),
      db.contactMessage.count({ where: { read: false } }),
    ]);
    const viewsAgg = await db.article.aggregate({ _sum: { views: true } });
    return {
      total,
      today: todayCount,
      newCitizens: citizens,
      unreadContacts: contacts,
      views: viewsAgg._sum.views ?? 0,
    };
  },
};
