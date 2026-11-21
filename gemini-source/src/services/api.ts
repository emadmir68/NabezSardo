import type {
  Article,
  CategoryId,
  CitizenReport,
  ContactSubmission,
  MediaAsset,
  RegionId,
  SiteSettings,
} from '../types/news';
import { EDITORIAL_IMAGES } from '../data/initialData';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteNameFa: 'نبض ساردو',
  siteNameEn: 'Nabz Sardo',
  taglineFa: 'رسانه مستقل خبری و تحلیلی جنوب کرمان',
  taglineEn: 'Independent Regional News & Analysis — South Kerman',
  seoDescriptionFa:
    'پایگاه مستقل خبری و تحلیلی ساردوئیه، جیرفت، عنبرآباد، کهنوج و جنوب کرمان؛ روایت‌های میدانی، کشاورزی، اقتصاد، فرهنگ، اقلیم و صدای شهروندان.',
  seoDescriptionEn:
    'Independent digital newsroom covering Sarduiyeh, Jiroft, Anbarabad, Kahnuj, and South Kerman with field reporting, economics, culture, and regional journalism.',
  defaultTheme: 'dark',
  showBreakingWire: true,
  monitoringEnabled: true,
  blockAdsAndAdvertorials: true,
  blockObituaries: true,
  contactEmail: '',
  editorialPhone: '',
  newsroomAddressFa: 'استان کرمان، بخش ساردوئیه و دفتر منطقه‌ای جیرفت',
  newsroomAddressEn: 'Sarduiyeh Highlands & Regional Bureau, Jiroft, Kerman Province',
};

export const DEFAULT_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: 'media-sarduiyeh',
    title: 'ارتفاعات و کوهستان ساردوئیه',
    url: EDITORIAL_IMAGES.sarduiyehHighlands,
    source: 'editorial',
    category: 'sarduiyeh',
    uploadedAt: '2026-11-18T08:00:00Z',
    sizeLabel: '16:9 · HD',
  },
  {
    id: 'media-jiroft',
    title: 'باغات و کشاورزی جیرفت',
    url: EDITORIAL_IMAGES.jiroftAgriculture,
    source: 'editorial',
    category: 'agriculture',
    uploadedAt: '2026-11-18T08:10:00Z',
    sizeLabel: '16:9 · HD',
  },
  {
    id: 'media-heritage',
    title: 'میراث خشتی و معماری کرمان',
    url: EDITORIAL_IMAGES.kermanHeritage,
    source: 'editorial',
    category: 'culture',
    uploadedAt: '2026-11-18T08:20:00Z',
    sizeLabel: '16:9 · HD',
  },
  {
    id: 'media-weather',
    title: 'اقلیم و جاده‌های کوهستانی جنوب کرمان',
    url: EDITORIAL_IMAGES.mountainWeather,
    source: 'editorial',
    category: 'weather',
    uploadedAt: '2026-11-18T08:30:00Z',
    sizeLabel: '16:9 · HD',
  },
  {
    id: 'media-culture',
    title: 'محفل فرهنگی و ادبی جنوب کرمان',
    url: EDITORIAL_IMAGES.communityCulture,
    source: 'editorial',
    category: 'social',
    uploadedAt: '2026-11-18T08:40:00Z',
    sizeLabel: '16:9 · HD',
  },
];

const VALID_CATEGORIES = new Set<CategoryId>([
  'sarduiyeh',
  'agriculture',
  'social',
  'culture',
  'weather',
  'incidents',
  'opinion',
]);

const VALID_REGIONS = new Set<RegionId>([
  'sarduiyeh',
  'jiroft',
  'anbarabad',
  'kahnuj',
  'south-kerman',
]);

function normalizeArticle(raw: Record<string, unknown>, idx: number): Article | null {
  const id = String(raw.id ?? `d1-${idx}`);
  const titleObj = raw.title as Record<string, string> | string | undefined;
  const titleFa =
    typeof titleObj === 'string'
      ? titleObj
      : String(titleObj?.fa ?? raw.title_fa ?? raw.headline ?? '').trim();
  if (!titleFa) return null;

  const titleEn =
    typeof titleObj === 'string'
      ? titleObj
      : String(titleObj?.en ?? raw.title_en ?? titleFa).trim();

  const deckObj = raw.deck as Record<string, string> | string | undefined;
  const deckFa =
    typeof deckObj === 'string'
      ? deckObj
      : String(deckObj?.fa ?? raw.summary ?? raw.lead ?? '').trim();
  const deckEn =
    typeof deckObj === 'string'
      ? deckObj
      : String(deckObj?.en ?? deckFa).trim();

  const rawBody = raw.body as Record<string, string[]> | string[] | string | undefined;
  let bodyFa: string[] = [];
  let bodyEn: string[] = [];
  if (Array.isArray(rawBody)) {
    bodyFa = rawBody.map(String).filter(Boolean);
    bodyEn = bodyFa;
  } else if (typeof rawBody === 'string') {
    bodyFa = rawBody.split(/\n+/).map((p) => p.trim()).filter(Boolean);
    bodyEn = bodyFa;
  } else if (rawBody && typeof rawBody === 'object') {
    bodyFa = Array.isArray(rawBody.fa) ? rawBody.fa.map(String).filter(Boolean) : [];
    bodyEn = Array.isArray(rawBody.en) ? rawBody.en.map(String).filter(Boolean) : bodyFa;
  }
  if (bodyFa.length === 0) bodyFa = [deckFa || titleFa];
  if (bodyEn.length === 0) bodyEn = bodyFa;

  const rawCategory = String(raw.category ?? 'social').toLowerCase() as CategoryId;
  const category: CategoryId = VALID_CATEGORIES.has(rawCategory) ? rawCategory : 'social';

  const rawRegion = String(raw.region ?? 'sarduiyeh').toLowerCase() as RegionId;
  const region: RegionId = VALID_REGIONS.has(rawRegion) ? rawRegion : 'sarduiyeh';

  const authorObj = raw.author as Record<string, string> | string | undefined;
  const authorFa =
    typeof authorObj === 'string'
      ? authorObj
      : String(authorObj?.fa ?? raw.author_name ?? 'تحریریه نبض ساردو').trim();
  const authorEn =
    typeof authorObj === 'string'
      ? authorObj
      : String(authorObj?.en ?? 'Nabz Sardo Newsroom').trim();

  const roleObj = raw.authorRole as Record<string, string> | undefined;
  const captionObj = raw.imageCaption as Record<string, string> | undefined;

  return {
    id,
    slug: String(raw.slug ?? id),
    title: { fa: titleFa, en: titleEn },
    deck: { fa: deckFa, en: deckEn },
    body: { fa: bodyFa, en: bodyEn },
    pullQuote: raw.pullQuote as Article['pullQuote'],
    category,
    region,
    author: { fa: authorFa, en: authorEn },
    authorRole: {
      fa: roleObj?.fa ?? 'تحریریه منطقه‌ای',
      en: roleObj?.en ?? 'Regional Desk',
    },
    coverImage: String(raw.coverImage ?? raw.cover_image ?? raw.image_url ?? ''),
    imageCaption: {
      fa: captionObj?.fa ?? titleFa,
      en: captionObj?.en ?? titleEn,
    },
    publishedAt: String(raw.publishedAt ?? raw.published_at ?? new Date().toISOString()),
    readTimeMin: Math.max(1, Number(raw.readTimeMin ?? raw.read_time_min ?? 3)),
    views: Math.max(0, Number(raw.views ?? 0)),
    status: raw.status === 'draft' ? 'draft' : 'published',
    featuredInHero: Boolean(raw.featuredInHero ?? raw.featured_in_hero),
    isBreaking: Boolean(raw.isBreaking ?? raw.is_breaking),
  };
}

// Cloudflare production adapter. Uses the existing signed HttpOnly cookie and D1-backed APIs.
// Never report success for a request that did not persist in the newsroom.
export interface LiveFeedResult {
  articles: Article[];
  source: 'worker-d1' | 'fallback';
}

const AUTH_HEADERS = { 'Content-Type': 'application/json', 'X-Nabzesardo-Editorial': '1' };
const FAILURE = 'ارتباط با سامانه اصلی برقرار نشد؛ هیچ تغییری ذخیره نشده است.';

async function toJson(response: Response): Promise<Record<string, any>> {
  try { return await response.json() as Record<string, any>; } catch { return {}; }
}

export async function fetchLiveArticles(): Promise<LiveFeedResult | null> {
  try {
    const res = await fetch('/api/gemini/articles', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await toJson(res);
    if (data.source !== 'cloudflare-d1' || !Array.isArray(data.articles)) return null;
    return { articles: data.articles.map((a: Record<string, unknown>, i: number) => normalizeArticle(a, i)).filter((a: Article | null): a is Article => a !== null), source: 'worker-d1' };
  } catch { return null; }
}

export interface AdminAuthStatus {
  authenticated: boolean;
  needsInitialSetup: boolean;
  configuredViaEnv: boolean;
  adminLabel?: string;
}

export async function fetchAdminAuthStatus(_token: string | null): Promise<AdminAuthStatus> {
  try {
    const res = await fetch('/api/gemini/admin/state', { credentials: 'same-origin', cache: 'no-store' });
    return { authenticated: res.ok, needsInitialSetup: false, configuredViaEnv: true };
  } catch { return { authenticated: false, needsInitialSetup: false, configuredViaEnv: true }; }
}

export async function fetchAdminState(): Promise<{ articles: Article[]; citizenReports: CitizenReport[] } | null> {
  try {
    const res = await fetch('/api/gemini/admin/state', { credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) return null;
    const json = await toJson(res);
    return {
      articles: (Array.isArray(json.articles) ? json.articles : []).map((x: Record<string, unknown>, i: number) => normalizeArticle(x, i)).filter((a: Article | null): a is Article => a !== null),
      citizenReports: Array.isArray(json.citizenReports) ? json.citizenReports as CitizenReport[] : [],
    };
  } catch { return null; }
}

async function adminAction(payload: Record<string, unknown>): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch('/api/gemini/admin/action', {
      method: 'POST', credentials: 'same-origin', headers: AUTH_HEADERS, body: JSON.stringify(payload),
    });
    const data = await toJson(res);
    return res.ok && data.ok === true
      ? { ok: true, id: String(data.id ?? '') }
      : { ok: false, error: String(data.error || `HTTP ${res.status}`) };
  } catch { return { ok: false, error: FAILURE }; }
}

export async function syncArticleToApi(article: Article, isNew: boolean, token: string | null): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!token) return { ok: false, error: 'ورود به مدیریت لازم است.' };
  return adminAction({ action: 'save', article, isNew });
}

export async function deleteArticleFromApi(id: string, token: string | null): Promise<{ ok: boolean; error?: string }> {
  if (!token) return { ok: false, error: 'ورود به مدیریت لازم است.' };
  return adminAction({ action: 'delete', id });
}

export async function approveCitizenFromApi(id: string, token: string | null): Promise<{ ok: boolean; error?: string }> {
  if (!token) return { ok: false, error: 'ورود به مدیریت لازم است.' };
  return adminAction({ action: 'approve-citizen', id });
}

export async function archiveCitizenFromApi(id: string, token: string | null): Promise<{ ok: boolean; error?: string }> {
  if (!token) return { ok: false, error: 'ورود به مدیریت لازم است.' };
  return adminAction({ action: 'archive-citizen', id });
}

// Existing production uses a signed cookie login form, not a new Bearer-token login.
// The browser must navigate to /admin/login?gemini=1 to reuse that authenticated session.
export async function logoutAdmin(_token: string | null): Promise<void> {
  window.location.assign('/admin/logout');
}

async function getTurnstileToken(): Promise<string> {
  const config = await fetch('/api/gemini/config', { cache: 'no-store' });
  if (!config.ok) throw new Error('تنظیمات امنیتی سایت قابل دریافت نیست.');
  const { turnstileSiteKey } = await toJson(config);
  if (!turnstileSiteKey) throw new Error('کلید امنیتی Turnstile تنظیم نشده است.');
  const w = window as typeof window & { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => void } };
  if (!w.turnstile) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('بارگذاری تأیید امنیتی انجام نشد.'));
      document.head.appendChild(script);
    });
  }
  return await new Promise<string>((resolve, reject) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.75);padding:20px';
    const panel = document.createElement('div');
    panel.style.cssText = 'background:#111827;border:1px solid #C9A36B;border-radius:16px;padding:26px;display:grid;gap:18px;justify-items:center;color:white';
    const title = document.createElement('p');
    title.textContent = 'لطفاً تأیید امنیتی ارسال را تکمیل کنید.';
    const mount = document.createElement('div');
    const cancel = document.createElement('button');
    cancel.type = 'button'; cancel.textContent = 'انصراف';
    cancel.style.cssText = 'border:1px solid #C9A36B;border-radius:8px;padding:8px 20px';
    panel.append(title, mount, cancel); overlay.append(panel); document.body.append(overlay);
    let settled = false;
    const finish = (value?: string, error?: Error) => {
      if (settled) return;
      settled = true; overlay.remove();
      if (value) resolve(value); else reject(error || new Error('تأیید امنیتی لغو شد.'));
    };
    cancel.addEventListener('click', () => finish(undefined, new Error('ارسال لغو شد.')));
    try {
      w.turnstile!.render(mount, {
        sitekey: turnstileSiteKey, theme: 'dark',
        callback: (token: string) => finish(token),
        'error-callback': () => finish(undefined, new Error('تأیید امنیتی موفق نبود.')),
        'expired-callback': () => finish(undefined, new Error('تأیید امنیتی منقضی شد.')),
      });
    } catch { finish(undefined, new Error('تأیید امنیتی در دسترس نیست.')); }
  });
}

export async function submitCitizenReportToApi(report: CitizenReport): Promise<{ ok: boolean; error?: string }> {
  try {
    const turnstileToken = await getTurnstileToken();
    const response = await fetch('/api/gemini/citizen', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...report, turnstileToken, website: '' }),
    });
    const data = await toJson(response);
    return response.ok && data.ok === true ? { ok: true } : { ok: false, error: String(data.error || `HTTP ${response.status}`) };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : FAILURE }; }
}

export async function submitContactToApi(submission: ContactSubmission): Promise<{ ok: boolean; error?: string }> {
  try {
    const turnstileToken = await getTurnstileToken();
    const body = new URLSearchParams({
      name: String(submission.name || ''),
      contact: String(submission.email || ''),
      subject: String(submission.subject || ''),
      message: String(submission.message || ''),
      website: '',
      'cf-turnstile-response': turnstileToken,
    });
    const response = await fetch('/contact', { method: 'POST', credentials: 'same-origin', body });
    return response.ok && response.url.includes('ok=1')
      ? { ok: true }
      : { ok: false, error: `ارسال پیام تأیید نشد (HTTP ${response.status}).` };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : FAILURE }; }
}

export async function syncSettingsToApi(_settings: SiteSettings, _token: string | null): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: 'تنظیمات عمومی هنوز به API مدیریت فعلی متصل نشده‌اند؛ تغییرات اعمال نشد.' };
}

export async function syncMediaToApi(_media: MediaAsset, _token: string | null): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: 'افزودن فایل رسانه‌ای در این رابط هنوز به کتابخانه سرور متصل نیست.' };
}
