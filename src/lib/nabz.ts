/* ——— ماژول مشترک (سرور + کلاینت): تایپ‌ها، رنگ دسته‌ها و قالب‌بندی فارسی ———
   توجه: توابع داده (دیتابیس) در «@/lib/nabz-data» هستند تا به باندل کلاینت راه پیدا نکنند. */
import type { Article, Category } from "@prisma/client";

export type PublishedArticle = Article & { category: Category };
export type CatWithCount = Category & { count: number };
export type Stats = {
  total: number;
  today: number;
  newCitizens: number;
  unreadContacts: number;
  views: number;
};

/* ——— هویت رنگی دسته‌های واقعی نبض ساردو ——— */
export const CAT_STYLE: Record<string, { color: string; label?: string }> = {
  sardouiyeh: { color: "var(--nz-gold)" },
  incidents: { color: "var(--nz-red)" },
  weather: { color: "var(--nz-cyan)" },
  social: { color: "var(--nz-amber)" },
  culture: { color: "var(--nz-purple)" },
  sports: { color: "var(--nz-blue)" },
  agriculture: { color: "var(--nz-green)" },
  "city-village": { color: "#9fb3c8" },
  opinion: { color: "#cf9ab6" },
  "short-news": { color: "#7d8a99" },
  tourism: { color: "#5fc4b8" },
  kerman: { color: "#c8a06b" },
  video: { color: "#d97b8a" },
};

export function catColor(id: string): string {
  return CAT_STYLE[id]?.color ?? "#7d8a99";
}

/* ——— قالب‌بندی فارسی ——— */
export function faDate(iso: Date | string | null | undefined, withTime = false): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(
      withTime ? "fa-IR-u-ca-persian" : "fa-IR-u-ca-persian",
      withTime
        ? { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" }
        : { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Tehran" }
    ).format(d);
  } catch {
    return "";
  }
}

export function timeAgoFa(iso: Date | string | null | undefined): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "همین حالا";
  if (m < 60) return `${m.toLocaleString("fa-IR")} دقیقه پیش`;
  if (h < 24) return `${h.toLocaleString("fa-IR")} ساعت پیش`;
  if (d === 1) return "دیروز";
  if (d < 7) return `${d.toLocaleString("fa-IR")} روز پیش`;
  return faDate(iso);
}

export function compact(v = "", max = 160): string {
  const s = String(v).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1).trim() + "…" : s;
}

export function readingMinutes(a: { body: string; lead: string }): string {
  const words = (a.body + " " + a.lead).split(/\s+/).filter(Boolean).length;
  const min = Math.max(1, Math.round(words / 190));
  return `${min.toLocaleString("fa-IR")} دقیقه`;
}

export function faNum(v: number | string): string {
  return Number(v || 0).toLocaleString("fa-IR");
}
