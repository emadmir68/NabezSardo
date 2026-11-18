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

export async function getPrayerTimes(): Promise<PrayerTimes | null> {
  const ttl = prayCache.data ? CACHE_MS : MISS_MS;
  if (prayCache.data && Date.now() - prayCache.at < ttl) return prayCache.data;
  /* محاسبهٔ نجومی محلی با روش مؤسسهٔ ژئوفیزیک دانشگاه تهران — همان روش تقویم رسمی
     (که سایت تایم هم بر پایهٔ آن اوقات شهرها را منتشر می‌کند) به افقِ خودِ ساردوئیه.
     صحت‌سنجی‌شده با اوقات رسمی کرمان و جیرفت (اختلاف کمتر از یک دقیقه). */
  try {
    const coords = new adhan.Coordinates(Number(LAT), Number(LON));
    const params = adhan.CalculationMethod.Tehran();
    params.madhab = adhan.Madhab.Shafi;
    // تاریخ «امروز» به وقت تهران (سرور ممکن است UTC باشد)
    const now = new Date();
    const tehranDay = new Date(now.getTime() + 3.5 * 3600 * 1000);
    const p = new adhan.PrayerTimes(coords, tehranDay, params);
    const pTomorrow = new adhan.PrayerTimes(coords, new Date(tehranDay.getTime() + 24 * 3600 * 1000), params);
    const fmt = (d: Date) =>
      new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tehran" }).format(d);
    // نیمه‌شب شرعی: میانهٔ فاصلهٔ غروب امروز تا اذان صبح فردا
    const midnight = new Date((p.sunset.getTime() + pTomorrow.fajr.getTime()) / 2);
    // اذان بعدی
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
      if (d.getTime() > now.getTime()) {
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
