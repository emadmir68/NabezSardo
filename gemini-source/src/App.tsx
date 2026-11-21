/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AboutView } from './components/AboutView';
import { AdminLoginView } from './components/AdminLoginView';
import { AdminStudio } from './components/AdminStudio';
import { ArticleReader } from './components/ArticleReader';
import { CitizenReportView } from './components/CitizenReportView';
import { ContactView } from './components/ContactView';
import { Footer } from './components/Footer';
import { FrontPageEditorial } from './components/FrontPageEditorial';
import { LiveHero } from './components/LiveHero';
import { NotFoundView } from './components/NotFoundView';
import { RegionsView } from './components/RegionsView';
import { SearchModal } from './components/SearchModal';
import { SearchPageView } from './components/SearchPageView';
import { TopBar } from './components/TopBar';
import {
  CATEGORIES,
  EDITORIAL_IMAGES,
  INITIAL_ARTICLES,
  INITIAL_CITIZEN_REPORTS,
  REGIONS,
} from './data/initialData';
import {
  DEFAULT_MEDIA_ASSETS,
  DEFAULT_SITE_SETTINGS,
  deleteArticleFromApi,
  fetchAdminAuthStatus,
  fetchAdminState,
  approveCitizenFromApi,
  archiveCitizenFromApi,
  fetchLiveArticles,
  logoutAdmin,
  submitCitizenReportToApi,
  submitContactToApi,
  syncArticleToApi,
  syncMediaToApi,
  syncSettingsToApi,
} from './services/api';
import type {
  ActiveView,
  Article,
  CategoryId,
  CitizenReport,
  ContactSubmission,
  Locale,
  MediaAsset,
  RegionId,
  SiteSettings,
  ThemeMode,
  ToastMessage,
} from './types/news';
import { checkEditorialPolicy } from './utils/editorialPolicy';
import { hasRealEditorialPhoto } from './utils/formatters';
import { syncPageSeo } from './utils/seo';

const STORAGE_KEYS = {
  articles: 'nabzesardo_v4_articles',
  reports: 'nabzesardo_v4_citizen_reports',
  bookmarks: 'nabzesardo_v4_bookmarks',
  media: 'nabzesardo_v4_media',
  settings: 'nabzesardo_v4_settings',
  contacts: 'nabzesardo_v4_contacts',
  theme: 'nabzesardo_v4_theme',
  locale: 'nabzesardo_v4_locale',
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface ParsedRoute {
  view: ActiveView;
  articleSlug?: string;
  category?: CategoryId | 'all';
  region?: RegionId | 'all';
  searchQuery?: string;
}

function parseUrlPath(pathname: string, search: string): ParsedRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(search);

  if ((clean === '/' || clean === '/gemini') && params.get('studio') === '1') return { view: 'studio' };
  if ((clean === '/' || clean === '/gemini') && params.get('desks') === '1') return { view: 'desks' };
  if ((clean === '/' || clean === '/gemini') && params.get('regions') === '1') return { view: 'regions' };
  if (clean === '/' || clean === '/gemini') return { view: 'home' };
  if (clean === '/archive' || clean === '/all-news') return { view: 'archive' };
  if (clean === '/desks' || clean === '/categories') return { view: 'desks', category: 'all' };
  if (clean.startsWith('/category/')) {
    const rawCat = decodeURIComponent(clean.slice('/category/'.length)) as CategoryId;
    if (CATEGORIES.some((c) => c.id === rawCat)) return { view: 'desks', category: rawCat };
    return { view: 'not-found' };
  }
  if (clean === '/regions' || params.get('regions') === '1') return { view: 'regions', region: 'all' };
  if (clean.startsWith('/region/') || clean.startsWith('/local/')) {
    const rawReg = decodeURIComponent(clean.slice(clean.startsWith('/local/') ? '/local/'.length : '/region/'.length)) as RegionId;
    if (REGIONS.some((r) => r.id === rawReg)) return { view: 'regions', region: rawReg };
    return { view: 'not-found' };
  }
  if (clean === '/search') {
    return { view: 'search', searchQuery: params.get('q') || '' };
  }
  if (clean === '/submit' || clean === '/send-news') return { view: 'submit' };
  if (clean === '/about') return { view: 'about' };
  if (clean === '/contact') return { view: 'contact' };
  if (clean === '/admin/login') return { view: 'admin-login' };
  if (clean === '/admin' || clean === '/studio') return { view: 'studio' };
  if (clean.startsWith('/news/')) {
    const slug = decodeURIComponent(clean.slice('/news/'.length));
    if (slug) return { view: 'home', articleSlug: slug };
  }
  return { view: 'not-found' };
}

function pushBrowserPath(path: string) {
  try {
    if (window.location.pathname + window.location.search !== path) {
      window.history.pushState({}, '', path);
    }
  } catch {
    // Ignore history API errors inside restricted sandboxes
  }
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    loadJson<ThemeMode>(STORAGE_KEYS.theme, 'dark')
  );
  const [locale, setLocale] = useState<Locale>(() =>
    loadJson<Locale>(STORAGE_KEYS.locale, 'fa')
  );
  // Start empty: never briefly flash fictional sample headlines on the live site.
  const [articles, setArticles] = useState<Article[]>([]);
  const [dataSource, setDataSource] = useState<'worker-d1' | 'fallback'>('fallback');
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>(() =>
    loadJson<CitizenReport[]>(STORAGE_KEYS.reports, INITIAL_CITIZEN_REPORTS)
  );
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(() =>
    loadJson<MediaAsset[]>(STORAGE_KEYS.media, DEFAULT_MEDIA_ASSETS)
  );
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() =>
    loadJson<SiteSettings>(STORAGE_KEYS.settings, DEFAULT_SITE_SETTINGS)
  );
  const [contactMessages, setContactMessages] = useState<ContactSubmission[]>(() =>
    loadJson<ContactSubmission[]>(STORAGE_KEYS.contacts, [])
  );
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() =>
    loadJson<string[]>(STORAGE_KEYS.bookmarks, [])
  );

  // Admin auth token lives strictly in React memory (never persisted in localStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchAdminAuthStatus(null).then(async (status) => {
      if (!active || !status.authenticated) return;
      setAdminToken('signed-cookie-session');
      const state = await fetchAdminState();
      if (!active || !state) return;
      setCitizenReports(state.citizenReports);
      setArticles(state.articles);
    });
    return () => { active = false; };
  }, []);

  const initialRoute = useMemo(
    () => parseUrlPath(window.location.pathname, window.location.search),
    []
  );
  const [activeView, setActiveView] = useState<ActiveView>(initialRoute.view);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(initialRoute.articleSlug ?? null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>(
    initialRoute.category ?? 'all'
  );
  const [selectedRegion, setSelectedRegion] = useState<RegionId | 'all'>(
    initialRoute.region ?? 'all'
  );
  const [searchPageQuery, setSearchPageQuery] = useState<string>(initialRoute.searchQuery ?? '');
  const [savedOnly, setSavedOnly] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const pushToast = useCallback((text: string, tone: ToastMessage['tone'] = 'info') => {
    const id = `${Date.now()}`;
    setToast({ id, text, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3400);
  }, []);

  // Load real published news from Cloudflare Worker / D1 API on mount
  useEffect(() => {
    let active = true;
    fetchLiveArticles().then((res) => {
      if (!active) return;
      // Never display seeded sample stories as if they were live D1 news.
      const cleanFeed = (res?.articles || []).filter(
        (item) => checkEditorialPolicy([item.title.fa, item.deck.fa]).allowed
      );
      setArticles(cleanFeed);
      setDataSource('worker-d1');
      if (!res) pushToast('دریافت اخبار واقعی ممکن نشد؛ اخبار نمونه نمایش داده نمی‌شوند.', 'warning');
    });
    return () => {
      active = false;
    };
  }, []);

  // Resolve deep-linked /news/:slug once articles are loaded
  useEffect(() => {
    if (!pendingSlug) return;
    const match = articles.find((a) => a.slug === pendingSlug || a.id === pendingSlug);
    if (match) {
      setSelectedArticleId(match.id);
      setPendingSlug(null);
    } else if (dataSource === 'worker-d1') {
      setActiveView('not-found');
      setPendingSlug(null);
    }
  }, [pendingSlug, articles, dataSource]);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const onPopState = () => {
      const parsed = parseUrlPath(window.location.pathname, window.location.search);
      if (parsed.articleSlug) {
        const match = articles.find(
          (a) => a.slug === parsed.articleSlug || a.id === parsed.articleSlug
        );
        if (match) {
          setSelectedArticleId(match.id);
          setActiveView('home');
        } else {
          setSelectedArticleId(null);
          setActiveView('not-found');
        }
        return;
      }
      setSelectedArticleId(null);
      setActiveView(parsed.view);
      if (parsed.category) setSelectedCategory(parsed.category);
      if (parsed.region) setSelectedRegion(parsed.region);
      if (parsed.searchQuery !== undefined) setSearchPageQuery(parsed.searchQuery);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [articles]);

  // Sync dark/light class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme));
  }, [theme]);

  // Sync RTL/LTR & lang attribute on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = locale === 'fa' ? 'rtl' : 'ltr';
    window.localStorage.setItem(STORAGE_KEYS.locale, JSON.stringify(locale));
  }, [locale]);

  // Persist local preview state
  useEffect(() => {
    if (dataSource === 'fallback') {
      window.localStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(articles));
    }
  }, [articles, dataSource]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(citizenReports));
  }, [citizenReports]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.media, JSON.stringify(mediaAssets));
  }, [mediaAssets]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(siteSettings));
  }, [siteSettings]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(contactMessages));
  }, [contactMessages]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  // Global Cmd/Ctrl + K search shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const publishedArticles = useMemo(
    () =>
      articles
        .filter((a) => a.status === 'published')
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    [articles]
  );

  // Prioritize articles with authentic editorial photography for Live Hero slides
  const heroSlides = useMemo(() => {
    const featured = publishedArticles.filter((a) => a.featuredInHero);
    const featuredWithPhotos = featured.filter((a) => hasRealEditorialPhoto(a));
    if (featuredWithPhotos.length > 0) return featuredWithPhotos.slice(0, 4);
    if (featured.length > 0) return featured.slice(0, 4);
    const photoStories = publishedArticles.filter((a) => hasRealEditorialPhoto(a));
    return photoStories.length > 0 ? photoStories.slice(0, 4) : publishedArticles.slice(0, 4);
  }, [publishedArticles]);

  const breakingArticles = useMemo(() => {
    if (!siteSettings.showBreakingWire) return [];
    const breaking = publishedArticles.filter((a) => a.isBreaking);
    return breaking.length > 0 ? breaking : publishedArticles.slice(0, 4);
  }, [publishedArticles, siteSettings.showBreakingWire]);

  const activeArticle = useMemo(
    () => articles.find((a) => a.id === selectedArticleId) ?? null,
    [articles, selectedArticleId]
  );

  // Sync dynamic SEO meta tags, Canonical URL, Open Graph, and Schema.org NewsArticle JSON-LD
  useEffect(() => {
    syncPageSeo({
      activeView: activeView === 'studio' && !adminToken ? 'admin-login' : activeView,
      activeArticle,
      selectedCategory,
      selectedRegion,
      locale,
      settings: siteSettings,
    });
  }, [activeView, activeArticle, selectedCategory, selectedRegion, locale, siteSettings, adminToken]);

  const relatedArticles = useMemo(() => {
    if (!activeArticle) return [];
    return publishedArticles
      .filter((a) => a.id !== activeArticle.id && a.category === activeArticle.category)
      .concat(
        publishedArticles.filter(
          (a) => a.id !== activeArticle.id && a.category !== activeArticle.category
        )
      )
      .slice(0, 4);
  }, [activeArticle, publishedArticles]);

  const pendingReportsCount = useMemo(
    () => citizenReports.filter((r) => r.status === 'pending').length,
    [citizenReports]
  );

  const handleOpenArticle = (article: Article) => {
    setSelectedArticleId(article.id);
    setArticles((prev) =>
      prev.map((a) => (a.id === article.id ? { ...a, views: a.views + 1 } : a))
    );
    pushBrowserPath(`/news/${encodeURIComponent(article.slug)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: ActiveView) => {
    setSelectedArticleId(null);
    if (view !== 'archive') setSavedOnly(false);

    if (view === 'studio' && !adminToken) {
      setActiveView('admin-login');
      pushBrowserPath('/admin/login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActiveView(view);
    const pathMap: Record<ActiveView, string> = {
      home: '/',
      desks: selectedCategory !== 'all' ? `/category/${selectedCategory}` : '/?desks=1',
      regions: selectedRegion !== 'all' ? `/local/${selectedRegion}` : '/?regions=1',
      archive: '/all-news',
      search: '/search',
      submit: '/send-news',
      about: '/about',
      contact: '/contact',
      'admin-login': '/admin/login',
      studio: '/?studio=1',
      'not-found': '/404',
    };
    pushBrowserPath(pathMap[view]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const exists = prev.includes(id);
      pushToast(
        exists
          ? locale === 'fa'
            ? 'خبر از فهرست نشان‌شده‌ها حذف شد.'
            : 'Removed from saved stories.'
          : locale === 'fa'
            ? 'خبر به فهرست نشان‌شده‌ها اضافه شد.'
            : 'Saved to your reading list.',
        'info'
      );
      return exists ? prev.filter((item) => item !== id) : [id, ...prev];
    });
  };

  const handleSubmitCitizenReport = async (reportData: Omit<CitizenReport, 'id' | 'submittedAt' | 'status'>) => {
    const newReport: CitizenReport = {
      ...reportData,
      id: `cit-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    const result = await submitCitizenReportToApi(newReport);
    if (!result.ok) { pushToast(result.error || 'خبر مردمی ذخیره نشد.', 'warning'); return false; }
    setCitizenReports((prev) => [newReport, ...prev]);
    pushToast('خبر مردمی در سامانه تحریریه ثبت شد.', 'success');
    return true;
  };

  const handleSaveArticle = async (article: Article, isNew: boolean) => {
    const result = await syncArticleToApi(article, isNew, adminToken);
    if (!result.ok) { pushToast(result.error || 'ذخیره خبر انجام نشد.', 'warning'); return; }
    const state = await fetchAdminState();
    if (state) { setArticles(state.articles); setCitizenReports(state.citizenReports); }
    else {
      const live = await fetchLiveArticles();
      if (live) setArticles(live.articles);
    }
    pushToast(isNew ? 'خبر در سامانه اصلی ثبت شد.' : 'تغییرات خبر در سامانه اصلی ذخیره شد.', 'success');
  };

  const handleDeleteArticle = async (id: string) => {
    const result = await deleteArticleFromApi(id, adminToken);
    if (!result.ok) { pushToast(result.error || 'حذف خبر انجام نشد.', 'warning'); return; }
    setArticles((prev) => prev.filter((a) => a.id !== id));
    if (selectedArticleId === id) setSelectedArticleId(null);
    pushToast('خبر از سامانه اصلی حذف شد.', 'success');
  };

  const handleApproveCitizenReport = async (report: CitizenReport) => {
    const policy = checkEditorialPolicy([report.title, report.description]);
    if (!policy.allowed) { pushToast(policy.message?.[locale] || 'این محتوا مطابق منشور تحریریه قابل انتشار نیست.', 'warning'); return; }
    const result = await approveCitizenFromApi(report.id, adminToken);
    if (!result.ok) { pushToast(result.error || 'تأیید خبر مردمی انجام نشد.', 'warning'); return; }
    const live = await fetchLiveArticles();
    if (live) setArticles(live.articles);
    const state = await fetchAdminState();
    if (state) setCitizenReports(state.citizenReports);
    pushToast('خبر مردمی در سامانه اصلی تأیید و منتشر شد.', 'success');
  };

  const handleArchiveCitizenReport = async (id: string) => {
    const result = await archiveCitizenFromApi(id, adminToken);
    if (!result.ok) { pushToast(result.error || 'بایگانی خبر مردمی انجام نشد.', 'warning'); return; }
    setCitizenReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'archived' } : r));
    pushToast('گزارش در سامانه اصلی بایگانی شد.', 'info');
  };

  const handleAddMediaAsset = async (_asset: MediaAsset) => {
    pushToast('کتابخانه رسانه جدید هنوز به ذخیره‌سازی فعلی متصل نیست؛ لطفاً از مدیریت اصلی برای آپلود استفاده کنید.', 'warning');
  };

  const handleDeleteMediaAsset = (_id: string) => {
    pushToast('حذف رسانه فقط از مدیریت اصلی انجام می‌شود.', 'warning');
  };

  const handleSaveSiteSettings = (_nextSettings: SiteSettings) => {
    pushToast('این بخش هنوز به تنظیمات سمت سرور متصل نشده است؛ تنظیمات تغییر نکرد.', 'warning');
  };

  const handleSubmitContact = async (payload: Omit<ContactSubmission, 'id' | 'createdAt'>) => {
    const submission: ContactSubmission = { ...payload, id: `msg-${Date.now()}`, createdAt: new Date().toISOString() };
    const result = await submitContactToApi(submission);
    if (!result.ok) { pushToast(result.error || 'پیام ارسال نشد.', 'warning'); return false; }
    setContactMessages((prev) => [submission, ...prev]);
    pushToast('پیام در سامانه اصلی ثبت شد.', 'success');
    return true;
  };

  const handleAdminLogout = async () => {
    await logoutAdmin(adminToken);
    setAdminToken(null);
    setActiveView('home');
    pushBrowserPath('/');
    pushToast(
      locale === 'fa' ? 'با موفقیت از پنل مدیریت خارج شدید.' : 'Signed out of Editorial Studio.',
      'info'
    );
  };

  const handleExportJson = () => {
    // Production-grade full backup comes from the authenticated D1-backed newsroom.
    // Never present a browser-side snapshot as a complete database backup.
    if (!adminToken) {
      pushToast(locale === 'fa' ? 'برای دریافت بکاپ ابتدا وارد مدیریت شوید.' : 'Sign in to download a backup.', 'warning');
      return;
    }
    window.location.assign('/admin/backup/download');
  };

  const handleResetDefaults = () => {
    pushToast('بازنشانی داده‌های نمونه در نسخه متصل به D1 غیرفعال است.', 'warning');
  };

  const effectiveView: ActiveView =
    activeView === 'studio' && !adminToken ? 'admin-login' : activeView;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E6] text-[#141210] dark:bg-[#07090E] dark:text-[#F6F2EA]">
      <TopBar
        activeView={effectiveView}
        onNavigate={handleNavigate}
        locale={locale}
        onToggleLocale={() => setLocale((l) => (l === 'fa' ? 'en' : 'fa'))}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onOpenSearch={() => setSearchOpen(true)}
        bookmarkCount={bookmarkedIds.length}
        pendingReportsCount={pendingReportsCount}
        onOpenSavedArchive={() => {
          setSelectedArticleId(null);
          setActiveView('archive');
          setSavedOnly(true);
          pushBrowserPath('/all-news');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <main className="flex-1 w-full">
        {activeArticle ? (
          <ArticleReader
            article={activeArticle}
            relatedArticles={relatedArticles}
            locale={locale}
            isBookmarked={bookmarkedIds.includes(activeArticle.id)}
            onToggleBookmark={handleToggleBookmark}
            onClose={() => {
              setSelectedArticleId(null);
              pushBrowserPath('/');
            }}
            onSelectRelated={handleOpenArticle}
            onNotify={(msg) => pushToast(msg, 'success')}
          />
        ) : effectiveView === 'regions' ? (
          <RegionsView
            articles={publishedArticles}
            locale={locale}
            selectedRegion={selectedRegion}
            onSelectRegion={(reg) => {
              setSelectedRegion(reg);
              pushBrowserPath(reg === 'all' ? '/?regions=1' : `/local/${reg}`);
            }}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            onOpenArticle={handleOpenArticle}
          />
        ) : effectiveView === 'search' ? (
          <SearchPageView
            articles={publishedArticles}
            locale={locale}
            initialQuery={searchPageQuery}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            onOpenArticle={handleOpenArticle}
          />
        ) : effectiveView === 'submit' ? (
          <CitizenReportView
            locale={locale}
            onSubmitReport={handleSubmitCitizenReport}
            onGoToStudio={() => handleNavigate('studio')}
          />
        ) : effectiveView === 'about' ? (
          <AboutView locale={locale} settings={siteSettings} onNavigate={handleNavigate} />
        ) : effectiveView === 'contact' ? (
          <ContactView
            locale={locale}
            settings={siteSettings}
            onSubmitContact={handleSubmitContact}
          />
        ) : effectiveView === 'admin-login' ? (
          <AdminLoginView
            locale={locale}
            onAuthenticated={(token) => {
              setAdminToken(token);
              setActiveView('studio');
              pushBrowserPath('/?studio=1');
              pushToast(
                locale === 'fa' ? 'به داشبورد تحریریه خوش آمدید.' : 'Welcome to Editorial Studio.',
                'success'
              );
            }}
            onCancel={() => handleNavigate('home')}
          />
        ) : effectiveView === 'studio' ? (
          <AdminStudio
            articles={articles}
            citizenReports={citizenReports}
            mediaAssets={mediaAssets}
            siteSettings={siteSettings}
            contactMessages={contactMessages}
            dataSource={dataSource}
            locale={locale}
            onSaveArticle={handleSaveArticle}
            onDeleteArticle={handleDeleteArticle}
            onApproveCitizenReport={handleApproveCitizenReport}
            onArchiveCitizenReport={handleArchiveCitizenReport}
            onAddMediaAsset={handleAddMediaAsset}
            onDeleteMediaAsset={handleDeleteMediaAsset}
            onSaveSiteSettings={handleSaveSiteSettings}
            onPreviewArticle={handleOpenArticle}
            onExportJson={handleExportJson}
            onResetDefaults={handleResetDefaults}
            onLogout={handleAdminLogout}
            onNotify={pushToast}
          />
        ) : effectiveView === 'not-found' ? (
          <NotFoundView
            locale={locale}
            attemptedPath={window.location.pathname}
            onNavigate={handleNavigate}
          />
        ) : (
          <>
            {effectiveView === 'home' && (
              <LiveHero
                slides={heroSlides}
                breakingArticles={breakingArticles}
                locale={locale}
                bookmarkedIds={bookmarkedIds}
                onOpenArticle={handleOpenArticle}
                onToggleBookmark={handleToggleBookmark}
              />
            )}

            <FrontPageEditorial
              articles={publishedArticles}
              locale={locale}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                if (effectiveView === 'desks') {
                  pushBrowserPath(cat === 'all' ? '/desks' : `/category/${cat}`);
                }
              }}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              savedOnly={savedOnly}
              onToggleSavedOnly={() => setSavedOnly((v) => !v)}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={handleToggleBookmark}
              onOpenArticle={handleOpenArticle}
              onGoToSubmit={() => handleNavigate('submit')}
              mode={effectiveView}
            />
          </>
        )}
      </main>

      <Footer
        locale={locale}
        onNavigate={handleNavigate}
        onSelectCategory={(cat) => {
          setSelectedArticleId(null);
          setSelectedCategory(cat);
          setActiveView('desks');
          pushBrowserPath(`/category/${cat}`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectRegion={(reg) => {
          setSelectedArticleId(null);
          setSelectedRegion(reg);
          setActiveView('regions');
          pushBrowserPath(`/region/${reg}`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        articles={publishedArticles}
        locale={locale}
        onSelectArticle={handleOpenArticle}
        onSelectCategory={(cat) => {
          setSelectedArticleId(null);
          setSelectedCategory(cat);
          setActiveView('desks');
          pushBrowserPath(`/category/${cat}`);
        }}
      />

      {/* Accessible Completion Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 start-6 z-50 max-w-sm px-4 py-3 rounded-xl border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/30 bg-[#141210] text-[#F6F2EA] dark:bg-[#F6F2EA] dark:text-[#141210] text-xs sm:text-sm font-medium shadow-2xl"
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
