import type {
  Article,
  BreakingWireConfig,
  CategoryId,
  CitizenReport,
  ContactSubmission,
  FollowUpCase,
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
  contactEmail: 'info@nabzesardo.ir',
  editorialPhone: '034-43210000',
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
  'politics',
  'sports',
  'short-news',
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
  const summaryOnly = bodyFa.length === 0;
  if (bodyFa.length === 0) bodyFa = [deckFa || titleFa];
  if (bodyEn.length === 0) bodyEn = bodyFa;

  const rawCategory = String(raw.category ?? 'social').toLowerCase() as CategoryId;
  const category: CategoryId = VALID_CATEGORIES.has(rawCategory) ? rawCategory : 'social';

  const rawRegion = String(raw.region ?? 'south-kerman').toLowerCase() as RegionId;
  const region: RegionId = VALID_REGIONS.has(rawRegion) ? rawRegion : 'south-kerman';

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
  const gallery = Array.isArray(raw.gallery)
    ? raw.gallery.map(String).filter(Boolean)
    : undefined;

  return {
    id,
    slug: String(raw.slug ?? id),
    shortCode: raw.shortCode ? String(raw.shortCode) : undefined,
    kicker: raw.kicker ? String(raw.kicker) : undefined,
    title: { fa: titleFa, en: titleEn },
    deck: { fa: deckFa, en: deckEn },
    body: { fa: bodyFa, en: bodyEn },
    pullQuote: raw.pullQuote as Article['pullQuote'],
    category,
    region,
    locationLabel: raw.locationLabel ? String(raw.locationLabel) : undefined,
    author: { fa: authorFa, en: authorEn },
    authorRole: {
      fa: roleObj?.fa ?? 'تحریریه منطقه‌ای',
      en: roleObj?.en ?? 'Regional Desk',
    },
    coverImage: String(raw.coverImage ?? raw.cover_image ?? raw.image_url ?? ''),
    videoUrl: raw.videoUrl ? String(raw.videoUrl) : undefined,
    videoType: raw.videoType ? String(raw.videoType) : undefined,
    gallery: gallery && gallery.length ? gallery : undefined,
    imageCaption: {
      fa: String(captionObj?.fa ?? '').trim(),
      en: String(captionObj?.en ?? '').trim(),
    },
    publishedAt: String(raw.publishedAt ?? raw.published_at ?? new Date().toISOString()),
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
    readTimeMin: Math.max(1, Number(raw.readTimeMin ?? raw.read_time_min ?? 3)),
    views: Math.max(0, Number(raw.views ?? 0)),
    status: raw.status === 'draft' ? 'draft' : 'published',
    featuredInHero: Boolean(raw.featuredInHero ?? raw.featured_in_hero),
    isBreaking: Boolean(raw.isBreaking ?? raw.is_breaking),
    _summaryOnly: summaryOnly,
  };
}

export interface LiveFeedResult {
  articles: Article[];
  source: 'worker-d1' | 'fallback';
}

export interface PublicConfigResult {
  siteSettings?: Partial<SiteSettings>;
  breaking?: BreakingWireConfig;
  turnstileSiteKey?: string;
}

const AUTH_HEADERS = { 'Content-Type': 'application/json', 'X-Nabzesardo-Editorial': '1' };
const FAILURE = 'ارتباط با سامانه اصلی برقرار نشد؛ هیچ تغییری ذخیره نشده است.';

async function toJson(response: Response): Promise<Record<string, any>> {
  try { return (await response.json()) as Record<string, any>; } catch { return {}; }
}

export async function fetchLiveArticles(options?: { summary?: boolean }): Promise<LiveFeedResult | null> {
  try {
    const endpoint = options?.summary ? '/api/gemini/articles?summary=1' : '/api/gemini/articles';
    const res = await fetch(endpoint, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await toJson(res);
    if (!Array.isArray(data.articles)) return null;
    return {
      articles: data.articles
        .map((a: Record<string, unknown>, i: number) => normalizeArticle(a, i))
        .filter((a: Article | null): a is Article => a !== null),
      source: 'worker-d1',
    };
  } catch {
    return null;
  }
}

export async function fetchLiveArticleByKey(key: string): Promise<Article | null> {
  try {
    const res = await fetch(`/api/gemini/article?key=${encodeURIComponent(key)}`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await toJson(res);
    if (!data.article || typeof data.article !== 'object') return null;
    return normalizeArticle(data.article as Record<string, unknown>, 0);
  } catch {
    return null;
  }
}

export async function trackArticleView(slug: string): Promise<void> {
  try {
    await fetch(`/api/gemini/view?slug=${encodeURIComponent(slug)}`, {
      credentials: 'same-origin',
      keepalive: true,
    });
  } catch {
    // Non-blocking analytics
  }
}

export async function fetchPublicConfig(): Promise<PublicConfigResult | null> {
  try {
    const res = await fetch('/api/gemini/config', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await toJson(res);
    return {
      turnstileSiteKey: typeof data.turnstileSiteKey === 'string' ? data.turnstileSiteKey : '',
      breaking: data.breaking as BreakingWireConfig | undefined,
      siteSettings: {
        siteNameFa: data.siteName?.fa || DEFAULT_SITE_SETTINGS.siteNameFa,
        siteNameEn: data.siteName?.en || DEFAULT_SITE_SETTINGS.siteNameEn,
        taglineFa: data.tagline?.fa || DEFAULT_SITE_SETTINGS.taglineFa,
        taglineEn: data.tagline?.en || DEFAULT_SITE_SETTINGS.taglineEn,
        contactEmail: data.contactEmail || DEFAULT_SITE_SETTINGS.contactEmail,
        editorialPhone: data.editorialPhone || DEFAULT_SITE_SETTINGS.editorialPhone,
        showBreakingWire: data.liveDeskEnabled !== false,
      },
    };
  } catch {
    return null;
  }
}

export async function fetchFollowUps(): Promise<FollowUpCase[]> {
  try {
    const res = await fetch('/api/gemini/followups', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await toJson(res);
    return Array.isArray(data.followups) ? (data.followups as FollowUpCase[]) : [];
  } catch {
    return [];
  }
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
  } catch {
    return { authenticated: false, needsInitialSetup: false, configuredViaEnv: true };
  }
}

export interface MonitorSourceSnapshot {
  id: string;
  name: string;
  url: string;
  scope?: string;
  topic?: string;
  enabled: boolean;
  lastCheckedAt?: string | null;
  lastSuccessAt?: string | null;
  lastError?: string;
}

export interface MonitorLogEntry {
  id?: string;
  at?: string;
  type?: string;
  message?: string;
  sourceId?: string;
  blockedReason?: string;
  error?: string;
  url?: string;
}

export interface MonitorSnapshot {
  settings: {
    enabled: boolean;
    autoPublish?: boolean;
    intervalMinutes?: number;
    maxPerHour?: number;
    maxAgeHours?: number;
  };
  sources: MonitorSourceSnapshot[];
  logs: MonitorLogEntry[];
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastRunResult?: {
    ok?: boolean;
    discovered?: number;
    queued?: number;
    filtered?: number;
    errors?: number;
  } | null;
  stats?: {
    totalDiscovered?: number;
    totalAccepted?: number;
    totalRejected?: number;
    totalPublished?: number;
  };
  counts: {
    pending?: number;
    accepted?: number;
    published?: number;
    rejected?: number;
    sourcesOn?: number;
    sourcesOff?: number;
    sourcesError?: number;
    sources?: number;
  };
}

export async function fetchAdminState(): Promise<{
  articles: Article[];
  citizenReports: CitizenReport[];
  contactMessages: ContactSubmission[];
  siteSettings?: Partial<SiteSettings>;
  monitor?: MonitorSnapshot;
} | null> {
  try {
    const res = await fetch('/api/gemini/admin/state', { credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) return null;
    const json = await toJson(res);
    const monitor = json.monitor && typeof json.monitor === 'object' ? (json.monitor as MonitorSnapshot) : undefined;
    return {
      articles: (Array.isArray(json.articles) ? json.articles : [])
        .map((x: Record<string, unknown>, i: number) => normalizeArticle(x, i))
        .filter((a: Article | null): a is Article => a !== null),
      citizenReports: Array.isArray(json.citizenReports) ? (json.citizenReports as CitizenReport[]) : [],
      contactMessages: Array.isArray(json.contacts) ? (json.contacts as ContactSubmission[]) : [],
      siteSettings: json.settings
        ? {
            siteNameFa: json.settings.siteName?.fa || DEFAULT_SITE_SETTINGS.siteNameFa,
            siteNameEn: json.settings.siteName?.en || DEFAULT_SITE_SETTINGS.siteNameEn,
            taglineFa: json.settings.tagline?.fa || DEFAULT_SITE_SETTINGS.taglineFa,
            taglineEn: json.settings.tagline?.en || DEFAULT_SITE_SETTINGS.taglineEn,
            contactEmail: json.settings.contactEmail || DEFAULT_SITE_SETTINGS.contactEmail,
            editorialPhone: json.settings.editorialPhone || DEFAULT_SITE_SETTINGS.editorialPhone,
            showBreakingWire: json.settings.liveDeskEnabled !== false,
            monitoringEnabled: monitor?.settings?.enabled !== false,
          }
        : undefined,
      monitor,
    };
  } catch {
    return null;
  }
}

async function adminAction(payload: Record<string, unknown>): Promise<{ ok: boolean; id?: string; url?: string; error?: string; result?: Record<string, any>; monitor?: MonitorSnapshot }> {
  try {
    const res = await fetch('/api/gemini/admin/action', {
      method: 'POST',
      credentials: 'same-origin',
      headers: AUTH_HEADERS,
      body: JSON.stringify(payload),
    });
    const data = await toJson(res);
    return res.ok && data.ok === true
      ? {
          ok: true,
          id: String(data.id ?? ''),
          url: data.url ? String(data.url) : undefined,
          result: data.result as Record<string, any> | undefined,
          monitor: data.monitor as MonitorSnapshot | undefined,
        }
      : { ok: false, error: String(data.error || `HTTP ${res.status}`) };
  } catch {
    return { ok: false, error: FAILURE };
  }
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

export async function deleteCitizenFromApi(id: string, token: string | null): Promise<{ ok: boolean; error?: string }> {
  if (!token) return { ok: false, error: 'ورود به مدیریت لازم است.' };
  return adminAction({ action: 'delete-citizen', id });
}

export async function deleteContactFromApi(id: string, token: string | null): Promise<{ ok: boolean; error?: string }> {
  if (!token) return { ok: false, error: 'ورود به مدیریت لازم است.' };
  return adminAction({ action: 'delete-contact', id });
}

export async function logoutAdmin(_token: string | null): Promise<void> {
  window.location.assign('/admin/logout');
}

async function getTurnstileToken(): Promise<string> {
  const config = await fetch('/api/gemini/config', { cache: 'no-store' });
  if (!config.ok) throw new Error('تنظیمات امنیتی سایت قابل دریافت نیست.');
  const { turnstileSiteKey } = await toJson(config);
  if (!turnstileSiteKey) return '';
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
    cancel.type = 'button';
    cancel.textContent = 'انصراف';
    cancel.style.cssText = 'border:1px solid #C9A36B;border-radius:8px;padding:8px 20px';
    panel.append(title, mount, cancel);
    overlay.append(panel);
    document.body.append(overlay);
    let settled = false;
    const finish = (value?: string, error?: Error) => {
      if (settled) return;
      settled = true;
      overlay.remove();
      if (value) resolve(value);
      else reject(error || new Error('تأیید امنیتی لغو شد.'));
    };
    cancel.addEventListener('click', () => finish(undefined, new Error('ارسال لغو شد.')));
    try {
      w.turnstile!.render(mount, {
        sitekey: turnstileSiteKey,
        theme: 'dark',
        callback: (token: string) => finish(token),
        'error-callback': () => finish(undefined, new Error('تأیید امنیتی موفق نبود.')),
        'expired-callback': () => finish(undefined, new Error('تأیید امنیتی منقضی شد.')),
      });
    } catch {
      finish(undefined, new Error('تأیید امنیتی در دسترس نیست.'));
    }
  });
}

export async function submitCitizenReportToApi(report: CitizenReport): Promise<{ ok: boolean; error?: string }> {
  try {
    const turnstileToken = await getTurnstileToken();
    const response = await fetch('/api/gemini/citizen', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...report, turnstileToken, website: '' }),
    });
    const data = await toJson(response);
    return response.ok && data.ok === true
      ? { ok: true }
      : { ok: false, error: String(data.error || `HTTP ${response.status}`) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : FAILURE };
  }
}

export async function submitContactToApi(submission: ContactSubmission): Promise<{ ok: boolean; error?: string }> {
  try {
    const turnstileToken = await getTurnstileToken();
    const response = await fetch('/api/gemini/contact', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(submission.name || ''),
        contact: String(submission.email || ''),
        subject: String(submission.subject || ''),
        message: String(submission.message || ''),
        turnstileToken,
        website: '',
      }),
    });
    const data = await toJson(response);
    return response.ok && data.ok === true
      ? { ok: true }
      : { ok: false, error: String(data.error || `ارسال پیام تأیید نشد (HTTP ${response.status}).`) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : FAILURE };
  }
}

export async function syncSettingsToApi(settings: SiteSettings, token: string | null): Promise<{ ok: boolean; error?: string; monitor?: MonitorSnapshot }> {
  if (!token) return { ok: false, error: 'ورود به مدیریت لازم است.' };
  return adminAction({
    action: 'save-settings',
    settings: {
      siteName: { fa: settings.siteNameFa, en: settings.siteNameEn },
      tagline: { fa: settings.taglineFa, en: settings.taglineEn },
      contactEmail: settings.contactEmail,
      editorialPhone: settings.editorialPhone,
      liveDeskEnabled: settings.showBreakingWire,
      monitoringEnabled: settings.monitoringEnabled,
    },
  });
}

export async function runNewsMonitorFromApi(token: string | null) {
  if (!token) return { ok: false, error: 'ورود به مدیریت لازم است.' };
  return adminAction({ action: 'monitor-run' });
}

export async function toggleNewsMonitorFromApi(enabled: boolean, token: string | null) {
  if (!token) return { ok: false, error: 'ورود به مدیریت لازم است.' };
  return adminAction({ action: 'monitor-toggle', enabled });
}

export async function syncMediaToApi(media: MediaAsset, token: string | null): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!token) return { ok: false, error: 'ورود به مدیریت لازم است.' };
  if (media.url.startsWith('data:image/')) {
    return adminAction({ action: 'upload-image', imageDataUrl: media.url });
  }
  return { ok: true, url: media.url };
}
