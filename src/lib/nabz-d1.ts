/* ——— مخزن دادهٔ تولیدی: خواندن مقالات واقعی از D1 سایت زندهٔ نبض ساردو ———
   ساختار production: یک ردیف app_state با کلید 'db' حاوی JSON کامل:
   { settings, categories:[{id,name}], articles:[...], contacts, citizens, ... }
   این ماژول «فقط خواندنی» است؛ نوشتن (پنل، فرم‌ها، شمارنده) در سایت اصلی انجام می‌شود. */
import type { Category } from "@prisma/client";
import type { PublishedArticle, CatWithCount, Stats } from "./nabz";
import { prodOrigin } from "./mode";

/* ——— نقشهٔ تصاویر هوش‌مصنوعی تولیدشده برای ۱۸ خبر منتخب (بر اساس اسلاگ production) ——— */
const AI_COVERS: Record<string, string> = {
  "صادق-نیک‌نفس،-شاعر-حمایت-مسئولان-از-هنرمندان-جنوب-کرمان-نیازمند-تقویت-است": "/images/news-poet.png",
  "امام-جمعه‌ای-که-خود-پیش‌قدم-دیدار-با-مردم-می‌شود": "/images/news-mosque.png",
  "اقبال-واحدی-برای-دومین-بار-مردم-ایران-را-به-جشنواره-ملی-خرمای-کلوته-عنبرآباد-دعوت-کرد": "/images/news-dates.png",
  "پیشرفت-۹۵-درصدی-سنجش-سلامت-کارگران-در-واحدهای-اقتصادی-استان-کرمان": "/images/news-health.png",
  "امام-جمعه-کرمان-دشمنی-آمریکا-با-ایران-با-تغییر-دولت‌ها-پایان-نمی‌یابد": "/images/news-flag.png",
  "سپاه-پاسداران-رادار-هشدار-اولیه-ارتش-متجاوز-آمریکا-در-جزیره-بحرین-منهدم-شد": "/images/news-radar.png",
  "انهدام-باند-سه-نفره-سرقت-در-فاریاب": "/images/news-police.png",
  "درخشش-دانشآموزان-مدارس-سما-و-سعادت-جیرفت-با-کسب-رتبههای-اول-و-دوم-کشوری-در-سماکاپ": "/images/news-students.png",
  "فردا-عزای-عمومی-اعلام-شد": "/images/news-mourning.png",
  "توقیف-اتوبوس-حاوی-چندین-باک-اضافه-و-جاساز-غیرمجاز": "/images/news-bus.png",
  "هشدار-زرد؛-رگبار-و-رعدوبرق-در-مرکز-و-نیمه-جنوبی-کرمان": "/images/news-storm.png",
  "فرآیند-انتخاب-واحد-تکمیلی-دانشگاه-آزاد-اسلامی-از-امروز-آغاز-شد": "/images/news-university.png",
  "فرماندار-جیرفت-روحبخش-بیگزاده-اعلام-کرد-احتمال-حمله-خرس-به-نوجوان-۱۴-ساله-در-بحرآسمان-همچنان-در-دست-بررسی-است": "/images/news-bear.png",
  "فرماندار-جیرفت-تابآوری-شهر-در-برابر-سیلاب-نیازمند-تزریق-اعتبارات-استانی-است": "/images/news-flood.png",
  "نشست-فعالان-اقتصادی-رفسنجان-با-اعضای-کمیسیون-اقتصادی-مجلس-برگزار-شد": "/images/news-economy.png",
  "عضو-هیئت-نظارت-بر-انتخابات-شوراهای-شهر-و-روستا-شعام-با-برگزاری-انتخابات-شوراها-موافقت-کرده-تاریخ-برگزاری-به-زودی-اعلام-می-شود": "/images/news-election.png",
  "تأکید-دادستان-جیرفت-بر-رفع-نواقص-و-ارتقای-کیفیت-خدمات-دفاتر-قضایی": "/images/news-justice.png",
  "ساعت-فعالیت-مدارس-کرمان-در-دو-هفته-ابتدایی-مهر-اعلام-شد": "/images/news-school.png",
};

/* اسلاگ‌ها ممکن است نیم‌فاصله/کاراکترهای جهت‌دار متفاوت داشته باشند */
const normKey = (s: string) =>
  String(s || "").toLowerCase().replace(/[\u200c\u200f\u200e\ufeff]/g, "").replace(/\s+/g, "");

const AI_COVERS_NORM: Record<string, string> = {};
for (const [k, v] of Object.entries(AI_COVERS)) AI_COVERS_NORM[normKey(k)] = v;

type ProdDB = {
  settings?: Record<string, unknown>;
  categories?: { id: string; name: string }[];
  articles?: Record<string, unknown>[];
};

const CACHE_MS = 60_000;
let cache: { at: number; db: ProdDB | null } = { at: 0, db: null };

function absolutizeUrl(u: string): string {
  const s = String(u || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/uploads/")) return `${prodOrigin()}${s}`;
  return s;
}

/* آدرس رسانه‌های آپلودی داخل HTML بدنه هم باید به سایت اصلی اشاره کند */
function absolutizeHtml(html: string): string {
  if (!html) return "";
  const o = prodOrigin();
  return html
    .replace(/(src|href|poster)="(\/uploads\/[^"]+)"/g, (_m, attr, path) => `${attr}="${o}${path}"`)
    .replace(/\(\/(uploads\/[^)]+)\)/g, (_m, path) => `(${o}/${path})`);
}

function toDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  const d = typeof v === "number" ? new Date(v) : new Date(String(v));
  return Number.isFinite(d.getTime()) ? d : null;
}

function resolveImage(a: Record<string, unknown>): string {
  const own = String(a.image || "").trim();
  if (own) return absolutizeUrl(own); // عکس واقعی آپلودشده در سایت اصلی — اولویت اول
  return AI_COVERS_NORM[normKey(String(a.slug || ""))] || ""; // کارت هوش مصنوعی — اولویت دوم
}

function makeCat(id: string, name: string, order: number): Category {
  return { id, name, order, articles: [] } as unknown as Category;
}

function mapArticle(a: Record<string, unknown>, cats: Map<string, Category>): PublishedArticle {
  const catId = String(a.categoryId || "");
  const cat: Category = cats.get(catId) ?? makeCat(catId || "social", "اجتماعی", 99);
  const created = toDate(a.createdAt) ?? new Date(0);
  return {
    id: String(a.id || ""),
    title: String(a.title || ""),
    slug: String(a.slug || ""),
    categoryId: cat.id,
    category: cat,
    lead: String(a.lead || ""),
    bodyHtml: absolutizeHtml(String(a.bodyHtml || "")),
    body: String(a.body || ""),
    author: String(a.author || "تحریریه نبض ساردو"),
    location: String(a.location || "ساردوئیه"),
    status: String(a.status || "draft"),
    featured: false,
    image: resolveImage(a),
    views: Number(a.views || 0),
    publishedAt: toDate(a.publishedAt) ?? created,
    createdAt: created,
    updatedAt: toDate(a.updatedAt) ?? created,
  };
}

async function loadProdDb(): Promise<ProdDB | null> {
  if (cache.db && Date.now() - cache.at < CACHE_MS) return cache.db;
  let raw: string | null = null;

  const fixture = process.env.D1_FIXTURE;
  if (fixture) {
    /* شبیه‌سازی محلی: همان JSON با ساختار production از فایل */
    try {
      /* فقط برای شبیه‌سازی محلی — روی Workers هرگز اجرا نمی‌شود */
      const { readFile } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "node:fs/promises");
      raw = await readFile(fixture, "utf8");
    } catch {
      raw = null;
    }
  } else {
    try {
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const { env } = await getCloudflareContext();
      const row = await env.DB.prepare("SELECT value FROM app_state WHERE key='db'").first<{ value: string }>();
      raw = row?.value ?? null;
    } catch {
      raw = null;
    }
  }

  if (!raw) {
    cache = { at: Date.now(), db: null };
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as ProdDB;
    cache = { at: Date.now(), db: parsed };
    return parsed;
  } catch {
    cache = { at: Date.now(), db: null };
    return null;
  }
}

async function catMap(pdb: ProdDB | null): Promise<Map<string, Category>> {
  const m = new Map<string, Category>();
  (pdb?.categories ?? []).forEach((c, i) => {
    if (c?.id) m.set(String(c.id), makeCat(String(c.id), String(c.name || c.id), i));
  });
  return m;
}

const FALLBACK_SETTINGS: Record<string, string> = {
  siteName: "نبض ساردو",
  tagline: "رسانه مستقل خبری و تحلیلی جنوب کرمان",
  breakingText: "مهم‌ترین رویدادهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و محلی.",
  adEnabled: "",
  adTitle: "جای تبلیغات شما اینجاست",
  adText: "برای رزرو این جایگاه با نبض ساردو در ارتباط باشید",
  adLink: "/contact",
  adImage: "",
};

export const d1Repo = {
  async getPublished(where?: { categoryId?: string; q?: string }): Promise<PublishedArticle[]> {
    const pdb = await loadProdDb();
    if (!pdb?.articles) return [];
    const cats = await catMap(pdb);
    const q = where?.q?.trim();
    return pdb.articles
      .filter((a) => String(a?.status || "") === "published")
      .filter((a) => (where?.categoryId ? String(a.categoryId || "") === where.categoryId : true))
      .filter((a) =>
        q
          ? [a.title, a.lead, a.body].some((t) => String(t || "").includes(q))
          : true
      )
      .map((a) => mapArticle(a, cats))
      .sort((x, y) => (y.publishedAt?.getTime() ?? 0) - (x.publishedAt?.getTime() ?? 0));
  },

  async getArticle(slug: string): Promise<PublishedArticle | null> {
    const all = await this.getPublished();
    return all.find((a) => a.slug === slug || a.id === slug) ?? null;
  },

  async getCategoriesWithCounts(): Promise<CatWithCount[]> {
    const pdb = await loadProdDb();
    const cats = await catMap(pdb);
    const counts = new Map<string, number>();
    (pdb?.articles ?? []).forEach((a) => {
      if (String(a?.status || "") !== "published") return;
      const id = String(a.categoryId || "");
      counts.set(id, (counts.get(id) ?? 0) + 1);
    });
    return [...cats.values()].map((c) => ({ ...c, count: counts.get(c.id) ?? 0 }));
  },

  async getSettings(): Promise<Record<string, string>> {
    const pdb = await loadProdDb();
    const s = (pdb?.settings ?? {}) as Record<string, unknown>;
    const str = (k: string, d: string) => (s[k] == null || s[k] === "" ? d : String(s[k]));
    return {
      siteName: str("siteName", FALLBACK_SETTINGS.siteName),
      tagline: str("tagline", FALLBACK_SETTINGS.tagline),
      breakingText: str("breakingText", FALLBACK_SETTINGS.breakingText),
      adEnabled: s.adEnabled ? "1" : "",
      adTitle: str("adTitle", FALLBACK_SETTINGS.adTitle),
      adText: str("adText", FALLBACK_SETTINGS.adText),
      adLink: str("adLink", FALLBACK_SETTINGS.adLink),
      adImage: s.adImage ? absolutizeUrl(String(s.adImage)) : "",
    };
  },

  /* شمارش بازدید فقط در سایت اصلی انجام می‌شود (تک‌منبعی ماندن آمار) */
  async bumpViews(): Promise<void> { /* noop read-only */ },

  async getStats(): Promise<Stats> {
    const all = await this.getPublished();
    const dayAgo = Date.now() - 24 * 3600 * 1000;
    return {
      total: all.length,
      today: all.filter((a) => (a.publishedAt?.getTime() ?? 0) >= dayAgo).length,
      newCitizens: 0,
      unreadContacts: 0,
      views: all.reduce((sum, a) => sum + (a.views || 0), 0),
    };
  },
};
