/* ——— داده‌های بیرونی: آب‌وهوای واقعی + اوقات شرعی ساردوئیه ——— */
import * as adhan from "adhan";

const LAT = "28.16472";
const LON = "57.30972"; // ساردوئیه، جنوب کرمان (مختصات دقیق شهر — ۲۸°۰۹′۵۳″ شمالی، ۵۷°۱۸′۳۵″ شرقی)

const CACHE_MS = 10 * 60 * 1000;
const MISS_MS = 60 * 1000;
let wxCache: { at: number; data: Weather | null } = { at: 0, data: null };
let prayCache: { at: number; data: PrayerTimes | null } = { at: 0, data: null };

export type Weather = {
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  code: number;
  label: string;
  icon: "sun" | "cloud" | "rain" | "storm" | "snow" | "dust";
  max: number;
  min: number;
  days: { label: string; max: number; min: number; icon: Weather["icon"]; code: number }[];
};

export type PrayerTimes = {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  sunset: string;
  maghrib: string;
  isha: string;
  midnight: string; // نیمه‌شب شرعی
  next: { name: string; time: string; at: string };
};

const PRAYER_FA: Record<string, string> = {
  fajr: "اذان صبح",
  sunrise: "طلوع آفتاب",
  dhuhr: "اذان ظهر",
  asr: "اذان عصر",
  maghrib: "اذان مغرب",
  isha: "اذان عشایی",
};

const WMO: Record<number, { label: string; icon: Weather["icon"] }> = {
  0: { label: "هوای صاف", icon: "sun" },
  1: { label: "عمدتاً صاف", icon: "sun" },
  2: { label: "نیمه‌ابری", icon: "cloud" },
  3: { label: "ابری", icon: "cloud" },
  45: { label: "مه", icon: "cloud" },
  48: { label: "مه یخ‌زده", icon: "cloud" },
  51: { label: "نم‌نم ملایم", icon: "rain" },
  53: { label: "نم‌نم", icon: "rain" },
  55: { label: "نم‌نم شدید", icon: "rain" },
  61: { label: "باران ملایم", icon: "rain" },
  63: { label: "باران", icon: "rain" },
  65: { label: "باران شدید", icon: "rain" },
  71: { label: "برف ملایم", icon: "snow" },
  73: { label: "برف", icon: "snow" },
  75: { label: "برف سنگین", icon: "snow" },
  80: { label: "رگبار ملایم", icon: "rain" },
  81: { label: "رگبار", icon: "rain" },
  82: { label: "رگبار شدید", icon: "rain" },
  95: { label: "رعدوبرق", icon: "storm" },
  96: { label: "رعدوبرق با تگرگ", icon: "storm" },
  99: { label: "رعدوبرق با تگرگ", icon: "storm" },
};

function wmoOf(code: number) {
  return WMO[code] ?? { label: "غیرقابل پیش‌بینی", icon: "dust" as const };
}

const DAY_FA = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

async function j(url: string, timeout = 7000): Promise<any | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctl.signal, cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function getWeather(): Promise<Weather | null> {
  const ttl = wxCache.data ? CACHE_MS : MISS_MS;
  if (wxCache.data && Date.now() - wxCache.at < ttl) return wxCache.data;
  const data = await j(
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTehran&forecast_days=5`
  );
  if (!data?.current || !data?.daily) {
    wxCache = { at: Date.now(), data: null };
    return null;
  }
  const cur = data.current;
  const w = wmoOf(cur.weather_code);
  const days = (data.daily.time as string[]).slice(0, 5).map((t, i) => {
    const code = data.daily.weather_code[i];
    const dd = new Date(t + "T12:00:00");
    return {
      label: DAY_FA[dd.getDay()],
      max: Math.round(data.daily.temperature_2m_max[i]),
      min: Math.round(data.daily.temperature_2m_min[i]),
      icon: wmoOf(code).icon,
      code,
    };
  });
  const out: Weather = {
    temp: Math.round(cur.temperature_2m),
    feels: Math.round(cur.apparent_temperature),
    humidity: cur.relative_humidity_2m,
    wind: Math.round(cur.wind_speed_10m),
    code: cur.weather_code,
    label: w.label,
    icon: w.icon,
    max: Math.round(data.daily.temperature_2m_max?.[0] ?? cur.temperature_2m),
    min: Math.round(data.daily.temperature_2m_min?.[0] ?? cur.temperature_2m),
    days,
  };
  wxCache = { at: Date.now(), data: out };
  return out;
}

/* ——— اوقات شرعی: منبع اول بادصبا (تقویم رسمی به افق ساردوئیه)، محاسبهٔ محلی پشتیبان ——— */
const BADESABA_URL = "https://badesaba.ir/owghat/785/%D8%B3%D8%A7%D8%B1%D8%AF%D9%88%D8%A6%DB%8C%D9%87";
const FA_DIG = "۰۱۲۳۴۵۶۷۸۹";
const toAscii = (s: string) => s.replace(/[۰-۹]/g, (d) => String(FA_DIG.indexOf(d)));
const toFa = (s: string) => String(s || "").replace(/\d/g, (d) => FA_DIG[Number(d)]);

type DayTimes = [string, string, string, string, string, string, string, string]; // صبح، طلوع، ظهر، عصر، غروب، مغرب، عشا، نیمه‌شب
type BadesabaData = Map<string, Map<number, DayTimes>>; // نام ماه → روز → اوقات

/* جدول ماهانهٔ بادصبا: ردیف‌هایی با الگوی «روزِ هفته ۲۸ آبان ۱۴۰۵ | ۰۴:۴۶ | …» */
function parseBadesaba(html: string): BadesabaData | null {
  const months: BadesabaData = new Map();
  let any = false;
  for (const tr of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) =>
      toAscii(c[1].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim())
    );
    if (cells.length < 9) continue;
    const dm = cells[0].match(/(\d{1,2})\s+(\S+?)(?:\s+\d{4})?$/); // «پنج‌شنبه 28 آبان 1405»
    const times = cells.slice(1, 9);
    if (!dm || !times.every((t) => /^\d{1,2}:\d{2}$/.test(t))) continue;
    const month = dm[2];
    if (!months.has(month)) months.set(month, new Map());
    months.get(month)!.set(Number(dm[1]), times as DayTimes);
    any = true;
  }
  return any ? months : null;
}

/* تاریخ امروز به وقت تهران (سرور ممکن است UTC باشد) */
function tehranNow(): Date {
  return new Date(Date.now() + 3.5 * 3600 * 1000);
}
/* ساخت لحظهٔ «HH:MM امروز/فردا» به وقت تهران از رشتهٔ زمان */
function tehranAt(hhmm: string, dayOffset = 0): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const t = tehranNow();
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + dayOffset, h, m) - 3.5 * 3600 * 1000);
}

let badesabaCache: { at: number; data: BadesabaData | null } = { at: 0, data: null };

async function loadBadesaba(): Promise<BadesabaData | null> {
  /* جدول ماهانه است؛ کش ۶ ساعته کافی و سبک است */
  if (badesabaCache.data && Date.now() - badesabaCache.at < 6 * 3600 * 1000) return badesabaCache.data;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(BADESABA_URL, {
      signal: ctl.signal,
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NabzeSardo/3.0)" },
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(String(res.status));
    const data = parseBadesaba(await res.text());
    badesabaCache = { at: Date.now(), data };
    return data;
  } catch {
    if (!badesabaCache.data) badesabaCache = { at: Date.now(), data: null };
    return badesabaCache.data;
  }
}

/* «امروز» به تقویم شمسی: شمارهٔ روز و نام ماه فارسی (برای تطبیق با ردیف بادصبا) */
function persianToday(): { day: number; month: string } {
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", timeZone: "Asia/Tehran" }).formatToParts(new Date());
  const day = Number(toAscii(parts.find((p) => p.type === "day")?.value ?? "0"));
  const month = (parts.find((p) => p.type === "month")?.value ?? "").replace(/\u200c/g, "");
  return { day, month };
}

function nextAdhan(times: DayTimes, tomorrow: DayTimes | null) {
  const order: [string, number][] = [
    ["fajr", 0], ["sunrise", 1], ["dhuhr", 2], ["asr", 3], ["maghrib", 5], ["isha", 6],
  ];
  const now = Date.now();
  for (const [k, i] of order) {
    const at = tehranAt(times[i]);
    if (at.getTime() > now) return { name: PRAYER_FA[k], time: times[i], at: at.toISOString() };
  }
  const t = tomorrow?.[0];
  const at = tehranAt(t ?? "04:46", 1);
  return { name: PRAYER_FA.fajr, time: t ?? "04:46", at: at.toISOString() };
}

export async function getPrayerTimes(): Promise<PrayerTimes | null> {
  const ttl = prayCache.data ? CACHE_MS : MISS_MS;
  if (prayCache.data && Date.now() - prayCache.at < ttl) return prayCache.data;

  /* ۱) منبع اول: جدول رسمی بادصبا به افق ساردوئیه (id=785) */
  try {
    const data = await loadBadesaba();
    const today = persianToday();
    const monthDays = data?.get(today.month);
    const times = monthDays?.get(today.day);
    if (data && monthDays && times) {
      const tomorrow = monthDays.get(today.day + 1) ?? null;
      const next = nextAdhan(times, tomorrow);
      const out: PrayerTimes = {
        fajr: toFa(times[0]),
        sunrise: toFa(times[1]),
        dhuhr: toFa(times[2]),
        asr: toFa(times[3]),
        sunset: toFa(times[4]),
        maghrib: toFa(times[5]),
        isha: toFa(times[6]),
        midnight: toFa(times[7]),
        next: { name: next.name, time: toFa(next.time), at: next.at },
      };
      prayCache = { at: Date.now(), data: out };
      return out;
    }
  } catch {
    /* ادامه به روش محلی */
  }

  /* ۲) پشتیبان: محاسبهٔ نجومی محلی با روش مؤسسهٔ ژئوفیزیک دانشگاه تهران — همان روش تقویم رسمی */
  try {
    const coords = new adhan.Coordinates(Number(LAT), Number(LON));
    const params = adhan.CalculationMethod.Tehran();
    params.madhab = adhan.Madhab.Shafi;
    const p = new adhan.PrayerTimes(coords, tehranNow(), params);
    const pTomorrow = new adhan.PrayerTimes(coords, new Date(tehranNow().getTime() + 24 * 3600 * 1000), params);
    const fmt = (d: Date) =>
      new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tehran" }).format(d);
    const midnight = new Date((p.sunset.getTime() + pTomorrow.fajr.getTime()) / 2);
    const seq: [string, Date][] = [
      ["fajr", p.fajr],
      ["sunrise", p.sunrise],
      ["dhuhr", p.dhuhr],
      ["asr", p.asr],
      ["maghrib", p.maghrib],
      ["isha", p.isha],
    ];
    let next: PrayerTimes["next"] = { name: "اذان صبح", time: fmt(pTomorrow.fajr), at: pTomorrow.fajr.toISOString() };
    for (const [k, d] of seq) {
      if (d.getTime() > Date.now()) {
        next = { name: PRAYER_FA[k], time: fmt(d), at: d.toISOString() };
        break;
      }
    }
    const out: PrayerTimes = {
      fajr: fmt(p.fajr),
      sunrise: fmt(p.sunrise),
      dhuhr: fmt(p.dhuhr),
      asr: fmt(p.asr),
      sunset: fmt(p.sunset),
      maghrib: fmt(p.maghrib),
      isha: fmt(p.isha),
      midnight: fmt(midnight),
      next,
    };
    prayCache = { at: Date.now(), data: out };
    return out;
  } catch {
    prayCache = { at: Date.now(), data: null };
    return null;
  }
}
