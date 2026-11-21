/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { AdminStudio } from './components/AdminStudio';
import { ArticleReader } from './components/ArticleReader';
import { CitizenReportView } from './components/CitizenReportView';
import { Footer } from './components/Footer';
import { FrontPageEditorial } from './components/FrontPageEditorial';
import { LiveHero } from './components/LiveHero';
import { SearchModal } from './components/SearchModal';
import { TopBar } from './components/TopBar';
import { EDITORIAL_IMAGES } from './data/initialData';
import type {
  ActiveView,
  Article,
  CategoryId,
  CitizenReport,
  Locale,
  RegionId,
  ThemeMode,
  ToastMessage,
} from './types/news';

const STORAGE_KEYS = {
  articles: 'nabzesardo_v3_articles',
  reports: 'nabzesardo_v3_citizen_reports',
  bookmarks: 'nabzesardo_v3_bookmarks',
  theme: 'nabzesardo_v3_theme',
  locale: 'nabzesardo_v3_locale',
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

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    loadJson<ThemeMode>(STORAGE_KEYS.theme, 'dark')
  );
  const [locale, setLocale] = useState<Locale>(() =>
    loadJson<Locale>(STORAGE_KEYS.locale, 'fa')
  );
  const [articles, setArticles] = useState<Article[]>([]);
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() =>
    loadJson<string[]>(STORAGE_KEYS.bookmarks, [])
  );

  const [activeView, setActiveView] = useState<ActiveView>(() => {
    const p=window.location.pathname;
    return p==='/all-news'?'archive':p==='/send-news'?'submit':p.startsWith('/category/')||p.startsWith('/local/')?'desks':new URLSearchParams(window.location.search).has('studio')?'studio':'home';
  });
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>(() => window.location.pathname.startsWith('/category/') ? window.location.pathname.split('/')[2].replace('sardouiyeh','sarduiyeh') as CategoryId : 'all');
  const [selectedRegion, setSelectedRegion] = useState<RegionId | 'all'>(() => window.location.pathname.startsWith('/local/') ? window.location.pathname.split('/')[2].replace('sardouiyeh','sarduiyeh') as RegionId : 'all');
  const [savedOnly, setSavedOnly] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const pushToast = (text: string, tone: ToastMessage['tone'] = 'info') => {
    const id = `${Date.now()}`;
    setToast({ id, text, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3200);
  };

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
    document.title =
      locale === 'fa'
        ? 'نبض ساردو | رسانه مستقل خبری و تحلیلی جنوب کرمان'
        : 'Nabz Sardo | Independent Regional News & Analysis — South Kerman';
    window.localStorage.setItem(STORAGE_KEYS.locale, JSON.stringify(locale));
  }, [locale]);

  // All published news is read from the real Cloudflare D1 newsroom, never demo/localStorage.
  useEffect(() => {
    let active=true;
    const reload=async()=>{
      try{
        const response=await fetch('/api/gemini/articles',{credentials:'same-origin',cache:'no-store'});
        if(!response.ok)throw Error('News API: '+response.status);
        const data=await response.json() as {articles:Article[]};
        if(active)setArticles(Array.isArray(data.articles)?data.articles:[]);
      }catch(error){
        console.error('Live newsroom unavailable:',error);
        if(active)pushToast('دریافت اخبار زنده با مشکل مواجه شد. لطفاً دوباره تلاش کنید.','warning');
      }
    };
    void reload();
    const timer=window.setInterval(()=>void reload(),60000);
    return()=>{active=false;window.clearInterval(timer);};
  },[]);

  // Support direct article links, refresh, browser back and forward.
  useEffect(()=>{
    const sync=()=>{
      const p=window.location.pathname;
      if(p.startsWith('/news/')||p.startsWith('/n/')){
        const key=decodeURIComponent(p.split('/').pop()||'');
        setSelectedArticleId(articles.find(a=>a.slug===key||a.id===key)?.id||null);
        return;
      }
      setSelectedArticleId(null);
      setActiveView(new URLSearchParams(window.location.search).has('studio')?'studio':p==='/all-news'?'archive':p==='/send-news'?'submit':p.startsWith('/category/')||p.startsWith('/local/')?'desks':'home');
    };
    sync();
    window.addEventListener('popstate',sync);
    return()=>window.removeEventListener('popstate',sync);
  },[articles]);

  useEffect(()=>{
    if(activeView!=='studio')return;
    let active=true;
    const load=async()=>{
      try{
        const response=await fetch('/api/gemini/admin/state',{credentials:'same-origin',cache:'no-store'});
        if(response.status===401||response.status===403){window.location.assign('/admin/login?gemini=1');return;}
        if(!response.ok)throw Error('Admin unavailable: '+response.status);
        const data=await response.json() as {articles:Article[],citizenReports:CitizenReport[]};
        if(active){setArticles(data.articles||[]);setCitizenReports(data.citizenReports||[]);}
      }catch(err){console.error('Secure newsroom unavailable',err);pushToast('اتصال امن به تحریریه برقرار نشد.','warning');}
    };
    void load();
    return()=>{active=false;};
  },[activeView]);

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

  const heroSlides = useMemo(() => {
    const featured = publishedArticles.filter((a) => a.featuredInHero);
    return featured.length > 0 ? featured.slice(0, 4) : publishedArticles.slice(0, 4);
  }, [publishedArticles]);

  const breakingArticles = useMemo(() => {
    const breaking = publishedArticles.filter((a) => a.isBreaking);
    return breaking.length > 0 ? breaking : publishedArticles.slice(0, 3);
  }, [publishedArticles]);

  const activeArticle = useMemo(
    () => articles.find((a) => a.id === selectedArticleId) ?? null,
    [articles, selectedArticleId]
  );

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
    window.history.pushState({},'', '/news/'+encodeURIComponent(article.slug));
    setSelectedArticleId(article.id);
    void fetch('/api/gemini/view?slug='+encodeURIComponent(article.slug),{credentials:'same-origin',cache:'no-store'}).catch(()=>{});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: ActiveView) => {
    const url={home:'/',desks:'/category/sardouiyeh',archive:'/all-news',submit:'/send-news',studio:'/?studio=1'}[view];
    window.history.pushState({},'',url);
    setSelectedArticleId(null);
    setActiveView(view);
    if (view !== 'archive') setSavedOnly(false);
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

  const handleSubmitCitizenReport = (
    reportData: Omit<CitizenReport, 'id' | 'submittedAt' | 'status'>
  ) => {
    const newReport: CitizenReport = {
      ...reportData,
      id: `cit-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    setCitizenReports((prev) => [newReport, ...prev]);
    pushToast(
      locale === 'fa'
        ? 'گزارش مردمی ثبت شد و در صف بررسی تحریریه قرار گرفت.'
        : 'Citizen report submitted to the newsroom queue.',
      'success'
    );
  };

  const handleSaveArticle = (article: Article, isNew: boolean) => {
    setArticles((prev) =>
      isNew ? [article, ...prev] : prev.map((a) => (a.id === article.id ? article : a))
    );
    pushToast(
      isNew
        ? locale === 'fa'
          ? 'خبر جدید با موفقیت منتشر شد.'
          : 'New dispatch published.'
        : locale === 'fa'
          ? 'تغییرات خبر ذخیره شد.'
          : 'Article changes saved.',
      'success'
    );
  };

  const handleDeleteArticle = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
    if (selectedArticleId === id) setSelectedArticleId(null);
    pushToast(
      locale === 'fa' ? 'خبر از تحریریه حذف شد.' : 'Article deleted from newsroom.',
      'warning'
    );
  };

  const handleApproveCitizenReport = (report: CitizenReport) => {
    const promotedArticle: Article = {
      id: `art-cit-${Date.now()}`,
      slug: `citizen-report-${Date.now().toString(36)}`,
      title: { fa: report.title, en: report.title },
      deck: {
        fa: report.description.slice(0, 160),
        en: report.description.slice(0, 160),
      },
      body: {
        fa: report.description
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean),
        en: report.description
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean),
      },
      category: report.category,
      region: report.region,
      author: { fa: report.reporterName, en: report.reporterName },
      authorRole: { fa: 'گزارش مردمی تاییدشده', en: 'Verified Citizen Report' },
      coverImage: report.imageDataUrl || EDITORIAL_IMAGES.sarduiyehHighlands,
      imageCaption: {
        fa: `تصویر ارسالی شهروندخبرنگار — ${report.reporterName}`,
        en: `Citizen photograph submitted by ${report.reporterName}`,
      },
      publishedAt: new Date().toISOString(),
      readTimeMin: 3,
      views: 1,
      status: 'published',
      featuredInHero: true,
      isBreaking: true,
    };

    setArticles((prev) => [promotedArticle, ...prev]);
    setCitizenReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, status: 'approved' } : r))
    );
    pushToast(
      locale === 'fa'
        ? 'گزارش مردمی تایید و در صفحه نخست منتشر شد.'
        : 'Citizen report approved and published on the front page.',
      'success'
    );
  };

  const handleArchiveCitizenReport = (id: string) => {
    setCitizenReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'archived' } : r))
    );
    pushToast(
      locale === 'fa' ? 'گزارش در بخش بایگانی قرار گرفت.' : 'Report archived.',
      'info'
    );
  };

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      site: 'nabzesardo.ir',
      articles,
      citizenReports,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nabzesardo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    pushToast(
      locale === 'fa' ? 'فایل پشتیبان JSON دانلود شد.' : 'Newsroom JSON backup downloaded.',
      'success'
    );
  };

  const handleResetDefaults = () => {
    setArticles(INITIAL_ARTICLES);
    setCitizenReports(INITIAL_CITIZEN_REPORTS);
    setBookmarkedIds([]);
    pushToast(
      locale === 'fa'
        ? 'محتوای پایه تحریریه بازیابی شد.'
        : 'Default curated edition restored.',
      'info'
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F2EA] text-[#161412] dark:bg-[#080A0F] dark:text-[#F5F1E8]">
      <TopBar
        activeView={activeView}
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
            onClose={() => { window.history.pushState({},'','/'); setSelectedArticleId(null); }}
            onSelectRelated={handleOpenArticle}
            onNotify={(msg) => pushToast(msg, 'success')}
          />
        ) : activeView === 'submit' ? (
          <CitizenReportView
            locale={locale}
            onSubmitReport={handleSubmitCitizenReport}
            onGoToStudio={() => handleNavigate('studio')}
          />
        ) : activeView === 'studio' ? (
          <AdminStudio
            articles={articles}
            citizenReports={citizenReports}
            locale={locale}
            onSaveArticle={handleSaveArticle}
            onDeleteArticle={handleDeleteArticle}
            onApproveCitizenReport={handleApproveCitizenReport}
            onArchiveCitizenReport={handleArchiveCitizenReport}
            onPreviewArticle={handleOpenArticle}
            onExportJson={handleExportJson}
            onResetDefaults={handleResetDefaults}
          />
        ) : (
          <>
            {activeView === 'home' && (
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
              onSelectCategory={setSelectedCategory}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              savedOnly={savedOnly}
              onToggleSavedOnly={() => setSavedOnly((v) => !v)}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={handleToggleBookmark}
              onOpenArticle={handleOpenArticle}
              onGoToSubmit={() => handleNavigate('submit')}
              mode={activeView}
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
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectRegion={(reg) => {
          setSelectedArticleId(null);
          setSelectedRegion(reg);
          setActiveView('desks');
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
        }}
      />

      {/* Accessible Completion Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 start-6 z-50 max-w-sm px-4 py-3 border border-[#DDD7CB] dark:border-[#2C364A] bg-[#181614] text-[#F7F4EE] dark:bg-[#F7F4EE] dark:text-[#181614] text-xs sm:text-sm font-medium shadow-xl"
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
