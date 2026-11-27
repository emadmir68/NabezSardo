import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Database,
  Download,
  Edit3,
  Eye,
  FileText,
  Image as ImageIcon,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Mail,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { CATEGORIES, EDITORIAL_IMAGES, REGIONS } from '../data/initialData';
import type {
  Article,
  CategoryId,
  CitizenReport,
  ContactSubmission,
  Locale,
  MediaAsset,
  RegionId,
  SiteSettings,
} from '../types/news';
import { checkEditorialPolicy } from '../utils/editorialPolicy';
import {
  formatNumber,
  formatShortDate,
  getCategoryLabel,
  getRegionLabel,
  hasRealEditorialPhoto,
  resolveArticleCoverImage,
} from '../utils/formatters';
import { EditorialImage } from './EditorialImage';

import type { MonitorSnapshot } from '../services/api';

interface AdminStudioProps {
  articles: Article[];
  citizenReports: CitizenReport[];
  mediaAssets: MediaAsset[];
  siteSettings: SiteSettings;
  contactMessages: ContactSubmission[];
  monitorSnapshot?: MonitorSnapshot | null;
  monitorBusy?: boolean;
  dataSource: 'worker-d1' | 'fallback';
  locale: Locale;
  onSaveArticle: (article: Article, isNew: boolean) => void;
  onDeleteArticle: (id: string) => void;
  onApproveCitizenReport: (report: CitizenReport) => void;
  onArchiveCitizenReport: (id: string) => void;
  onDeleteCitizenReport?: (id: string) => void;
  onDeleteContactMessage?: (id: string) => void;
  onAddMediaAsset: (asset: MediaAsset) => void;
  onDeleteMediaAsset: (id: string) => void;
  onSaveSiteSettings: (settings: SiteSettings) => void;
  onRunMonitor?: () => void;
  onToggleMonitor?: () => void;
  onPreviewArticle: (article: Article) => void;
  onExportJson: () => void;
  onResetDefaults: () => void;
  onLogout: () => void;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'warning') => void;
}

type StudioTab = 'dashboard' | 'articles' | 'citizen' | 'messages' | 'media' | 'settings' | 'operations';

export function AdminStudio({
  articles,
  citizenReports,
  mediaAssets,
  siteSettings,
  contactMessages,
  monitorSnapshot,
  monitorBusy = false,
  dataSource,
  locale,
  onSaveArticle,
  onDeleteArticle,
  onApproveCitizenReport,
  onArchiveCitizenReport,
  onDeleteCitizenReport,
  onDeleteContactMessage,
  onAddMediaAsset,
  onDeleteMediaAsset,
  onSaveSiteSettings,
  onRunMonitor,
  onToggleMonitor,
  onPreviewArticle,
  onExportJson,
  onResetDefaults,
  onLogout,
  onNotify,
}: AdminStudioProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('dashboard');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [visibleArticleCount, setVisibleArticleCount] = useState(20);
  const [articleSearch, setArticleSearch] = useState('');
  const [composerError, setComposerError] = useState<string | null>(null);

  // Composer fields
  const [titleFa, setTitleFa] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [deckFa, setDeckFa] = useState('');
  const [deckEn, setDeckEn] = useState('');
  const [bodyFa, setBodyFa] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [category, setCategory] = useState<CategoryId>('sarduiyeh');
  const [region, setRegion] = useState<RegionId>('sarduiyeh');
  const [authorFa, setAuthorFa] = useState('تحریریه نبض ساردو');
  const [coverImage, setCoverImage] = useState<string>(EDITORIAL_IMAGES.sarduiyehHighlands);
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [featuredInHero, setFeaturedInHero] = useState(true);
  const [isBreaking, setIsBreaking] = useState(false);

  // Media upload state
  const [mediaTitle, setMediaTitle] = useState('');
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local editable settings copy synced cleanly once D1 config finishes loading
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings>(siteSettings);
  useEffect(() => {
    setSettingsDraft(siteSettings);
  }, [siteSettings]);

  const pendingReports = useMemo(
    () => citizenReports.filter((r) => r.status === 'pending'),
    [citizenReports]
  );

  const publishedCount = useMemo(
    () => articles.filter((a) => a.status === 'published').length,
    [articles]
  );

  const totalViews = useMemo(
    () => articles.reduce((sum, item) => sum + item.views, 0),
    [articles]
  );

  const realPhotoCount = useMemo(
    () => articles.filter((a) => hasRealEditorialPhoto(a)).length,
    [articles]
  );

  // Merge explicitly managed media assets + unique real photos discovered in live D1 articles
  const allMediaGallery = useMemo(() => {
    const seen = new Set(mediaAssets.map((m) => m.url));
    const discovered: MediaAsset[] = [];
    for (const art of articles) {
      if (hasRealEditorialPhoto(art) && !seen.has(art.coverImage)) {
        seen.add(art.coverImage);
        discovered.push({
          id: `d1-img-${art.id}`,
          title: art.title[locale].slice(0, 64),
          url: art.coverImage,
          source: 'd1',
          category: art.category,
          uploadedAt: art.publishedAt,
          sizeLabel: 'D1 / Uploads',
        });
      }
      if (discovered.length >= 24) break;
    }
    return [...mediaAssets, ...discovered];
  }, [mediaAssets, articles, locale]);

  const filteredAdminArticles = useMemo(() => {
    const q = articleSearch.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) =>
      `${a.title.fa} ${a.title.en} ${a.author.fa} ${getCategoryLabel(a.category, 'fa')} ${getRegionLabel(a.region, 'fa')}`
        .toLowerCase()
        .includes(q)
    );
  }, [articles, articleSearch]);

  const openNewComposer = () => {
    setEditingId(null);
    setTitleFa('');
    setTitleEn('');
    setDeckFa('');
    setDeckEn('');
    setBodyFa('');
    setBodyEn('');
    setCategory('sarduiyeh');
    setRegion('sarduiyeh');
    setAuthorFa('تحریریه نبض ساردو');
    setCoverImage(EDITORIAL_IMAGES.sarduiyehHighlands);
    setStatus('published');
    setFeaturedInHero(false);
    setIsBreaking(false);
    setComposerError(null);
    setActiveTab('articles');
    setIsComposerOpen(true);
  };

  const openEditComposer = (article: Article) => {
    setEditingId(article.id);
    setTitleFa(article.title.fa);
    setTitleEn(article.title.en);
    setDeckFa(article.deck.fa);
    setDeckEn(article.deck.en);
    setBodyFa(article.body.fa.join('\n\n'));
    setBodyEn(article.body.en.join('\n\n'));
    setCategory(article.category);
    setRegion(article.region);
    setAuthorFa(article.author.fa);
    setCoverImage(resolveArticleCoverImage(article));
    setStatus(article.status);
    setFeaturedInHero(article.featuredInHero);
    setIsBreaking(Boolean(article.isBreaking));
    setComposerError(null);
    setActiveTab('articles');
    setIsComposerOpen(true);
  };

  const handleUploadCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) {
      setComposerError(
        locale === 'fa'
          ? 'فقط فرمت‌های استاندارد تصویر (JPG، PNG یا WebP) مجاز هستند.'
          : 'Only JPG, PNG, or WebP images are supported.'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverImage(reader.result);
        setComposerError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadMediaLibraryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) {
      onNotify(
        locale === 'fa'
          ? 'فقط تصاویر JPG، PNG و WebP در کتابخانه رسانه پذیرفته می‌شوند.'
          : 'Only JPG, PNG, and WebP images are supported.',
        'warning'
      );
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      onNotify(
        locale === 'fa' ? 'حجم تصویر باید کمتر از ۴ مگابایت باشد.' : 'Image must be under 4 MB.',
        'warning'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onAddMediaAsset({
          id: `media-${Date.now()}`,
          title: mediaTitle.trim() || file.name.replace(/\.[^.]+$/, ''),
          url: reader.result,
          source: 'upload',
          uploadedAt: new Date().toISOString(),
          sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        });
        setMediaTitle('');
        if (mediaFileInputRef.current) mediaFileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleFa.trim() && !titleEn.trim()) return;

    // Enforce editorial policy blocking ads, advertorials, and obituaries
    const policy = checkEditorialPolicy([titleFa, titleEn, deckFa, deckEn, bodyFa, bodyEn]);
    if (!policy.allowed) {
      setComposerError(
        policy.message?.[locale] ||
          (locale === 'fa'
            ? 'انتشار آگهی تبلیغاتی، رپورتاژ و اطلاعیه ترحیم در نبض ساردو ممنوع است.'
            : 'Advertisements, advertorials, and obituary announcements are strictly prohibited.')
      );
      return;
    }

    const finalTitleFa = titleFa.trim() || titleEn.trim();
    const finalTitleEn = titleEn.trim() || titleFa.trim();
    const finalDeckFa =
      deckFa.trim() ||
      bodyFa.trim().slice(0, 140) ||
      'گزارش اختصاصی تحریریه نبض ساردو از جنوب کرمان.';
    const finalDeckEn = deckEn.trim() || bodyEn.trim().slice(0, 140) || finalDeckFa;

    const faParagraphs = bodyFa
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const enParagraphs = bodyEn
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    const existing = editingId ? articles.find((a) => a.id === editingId) : undefined;
    const id = existing ? existing.id : `art-${Date.now()}`;
    const slugBase = finalTitleEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const articleObj: Article = {
      id,
      slug: existing ? existing.slug : `${slugBase || 'dispatch'}-${Date.now().toString(36)}`,
      shortCode: existing?.shortCode,
      kicker: existing?.kicker,
      title: { fa: finalTitleFa, en: finalTitleEn },
      deck: { fa: finalDeckFa, en: finalDeckEn },
      body: {
        fa: faParagraphs.length > 0 ? faParagraphs : [finalDeckFa],
        en:
          enParagraphs.length > 0
            ? enParagraphs
            : faParagraphs.length > 0
              ? faParagraphs
              : [finalDeckEn],
      },
      pullQuote: existing?.pullQuote,
      category,
      region,
      locationLabel: existing && existing.region === region ? existing.locationLabel : undefined,
      author: {
        fa: authorFa.trim() || 'تحریریه نبض ساردو',
        en: existing?.author.en || 'Nabz Sardo Newsroom',
      },
      authorRole: existing?.authorRole || {
        fa: 'تحریریه منطقه‌ای',
        en: 'Regional Editorial Desk',
      },
      coverImage,
      videoUrl: existing?.videoUrl,
      videoType: existing?.videoType,
      gallery: existing?.gallery,
      imageCaption: existing?.imageCaption?.fa
        ? existing.imageCaption
        : {
            fa: `نگاره تحریریه — ${getRegionLabel(region, 'fa')}`,
            en: `Editorial photo — ${getRegionLabel(region, 'en')}`,
          },
      publishedAt: existing ? existing.publishedAt : new Date().toISOString(),
      readTimeMin: Math.max(2, Math.ceil((faParagraphs.join(' ').split(/\s+/).length || 120) / 140)),
      views: existing ? existing.views : 1,
      status,
      featuredInHero,
      isBreaking,
    };

    onSaveArticle(articleObj, !existing);
    setComposerError(null);
    setIsComposerOpen(false);
    setEditingId(null);
  };

  const handleSaveSettingsForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSiteSettings({
      ...settingsDraft,
      // Policy constraints are always locked ON per newsroom charter
      blockAdsAndAdvertorials: true,
      blockObituaries: true,
    });
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      onNotify(locale === 'fa' ? 'نشانی تصویر کپی شد.' : 'Image URL copied.', 'success');
    } catch {
      onNotify(locale === 'fa' ? 'امکان کپی خودکار وجود نداشت.' : 'Copy failed.', 'warning');
    }
  };

  const tabs: { id: StudioTab; labelFa: string; labelEn: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', labelFa: 'داشبورد مدیریت', labelEn: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'articles',
      labelFa: `اخبار (${formatNumber(articles.length, locale)})`,
      labelEn: `Articles (${articles.length})`,
      icon: FileText,
    },
    {
      id: 'citizen',
      labelFa: `گزارش مردمی (${formatNumber(pendingReports.length, locale)})`,
      labelEn: `Citizen Queue (${pendingReports.length})`,
      icon: Users,
    },
    {
      id: 'messages',
      labelFa: `پیام‌های تماس (${formatNumber(contactMessages.length, locale)})`,
      labelEn: `Messages (${contactMessages.length})`,
      icon: Mail,
    },
    {
      id: 'media',
      labelFa: `مدیریت رسانه (${formatNumber(allMediaGallery.length, locale)})`,
      labelEn: `Media (${allMediaGallery.length})`,
      icon: ImageIcon,
    },
    { id: 'settings', labelFa: 'تنظیمات سایت', labelEn: 'Site Settings', icon: Settings },
    { id: 'operations', labelFa: 'ابزارهای پیشرفته', labelEn: 'Advanced Tools', icon: Database },
  ];

  return (
    <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-18">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 mb-8 border-b-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/18">
        <div>
          <p className="text-xs font-bold text-[#9A6B27] dark:text-[#E8C680] mb-2">
            {locale === 'fa'
              ? 'داشبورد تحریریه نبض ساردو · متصل به ساختار Cloudflare Workers & D1'
              : 'Nabz Sardo Newsroom Console · Cloudflare Workers & D1 Ready'}
          </p>
          <h1 className="font-editorial-display text-2xl sm:text-4xl font-bold text-[#141210] dark:text-[#F6F2EA] leading-[1.4]">
            {locale === 'fa'
              ? 'مدیریت تحریریه، رسانه و تنظیمات سایت'
              : 'Editorial Dashboard, Media & Site Settings'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={openNewComposer}
            className="btn-luxury-ink text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{locale === 'fa' ? 'انتشار خبر جدید' : 'New Dispatch'}</span>
          </button>

          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/25 text-[#141210] dark:text-[#EDE6D8] hover:border-[#9A6B27] dark:hover:border-[#E8C680] rounded-[10px] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{locale === 'fa' ? 'پشتیبان JSON' : 'Export JSON'}</span>
          </button>

          <a
            href="/admin"
            className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/25 text-[#141210] dark:text-[#EDE6D8] hover:border-[#9A6B27] dark:hover:border-[#E8C680] rounded-[10px] transition-colors"
          >
            <Database className="w-4 h-4" />
            <span>{locale === 'fa' ? 'پنل مدیریت کامل' : 'Full Admin Console'}</span>
          </a>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold border-[0.5px] border-red-500/30 text-red-700 dark:text-red-300 hover:bg-red-500/10 rounded-[10px] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{locale === 'fa' ? 'خروج' : 'Sign Out'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-9 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 min-h-[42px] px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#141210] text-[#F6F2EA] dark:bg-gradient-to-b dark:from-[#F0D496] dark:to-[#C69546] dark:text-[#080A0F]'
                  : 'luxury-panel text-[#5A5247] hover:text-[#141210] dark:text-[#A1AAB9] dark:hover:text-[#F6F2EA]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{locale === 'fa' ? tab.labelFa : tab.labelEn}</span>
            </button>
          );
        })}
      </div>


      {/* Existing production operations stay in the original authenticated Node newsroom.
          These links expose, rather than reimplement, the server-backed tools. */}
      {activeTab === 'operations' && (
        <section className="space-y-5" aria-label={locale === 'fa' ? 'ابزارهای عملیاتی سایت' : 'Newsroom operations'}>
          <div className="magazine-card rounded-[22px] p-5 sm:p-7">
            <h2 className="font-editorial-display text-xl sm:text-2xl font-bold text-[#141210] dark:text-[#F6F2EA]">
              {locale === 'fa' ? 'امکانات عملیاتی و مدیریت پیشرفته' : 'Operations & advanced management'}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#5A5247] dark:text-[#A1AAB9]">
              {locale === 'fa'
                ? 'این قابلیت‌ها همچنان در پنل اصلی و پایگاه داده فعال هستند. برای مدیریت عملیاتی، از مسیرهای امن همان سامانه استفاده کنید.'
                : 'These server-backed tools remain in the full newsroom. Open the protected management pages for operational work.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
              {[
                { href: '/admin#monitor', fa: 'رصد هوشمند و صف اخبار', en: 'News monitoring & queue' },
                { href: '/admin#followups', fa: 'پیگیری تا نتیجه', en: 'Follow-up cases' },
                { href: '/admin#social', fa: 'انتشار شبکه‌های اجتماعی', en: 'Social distribution' },
                { href: '/admin#live', fa: 'میز خبر فوری', en: 'Live news desk' },
                { href: '/admin#news', fa: 'مدیریت کامل اخبار و رسانه', en: 'Full publishing & media' },
                { href: '/admin#citizens', fa: 'گزارش‌های مردمی', en: 'Citizen submissions' },
                { href: '/admin#backup', fa: 'پشتیبان‌گیری و بازیابی', en: 'Backups & recovery' },
                { href: '/admin#overview', fa: 'آمار و داشبورد اصلی', en: 'Original dashboard & statistics' },
                { href: '/admin', fa: 'تمام امکانات پنل اصلی', en: 'Full administration console' },
              ].map((tool) => (
                <a
                  key={tool.href}
                  href={tool.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#D9CEBC] dark:border-[#D4A85B]/30 px-4 py-4 text-sm font-semibold text-[#141210] dark:text-[#F6F2EA] hover:border-[#9A6B27] dark:hover:border-[#E8C680] hover:bg-[#D9CEBC]/20 dark:hover:bg-[#D4A85B]/10 transition-colors"
                >
                  <span>{locale === 'fa' ? tool.fa : tool.en}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="magazine-card rounded-[22px] p-6 sm:p-7 space-y-2">
              <p className="text-xs text-[#5A5247] dark:text-[#A1AAB9]">
                {locale === 'fa' ? 'اخبار منتشرشده' : 'Published Stories'}
              </p>
              <p className="font-mono-tabular text-3xl sm:text-4xl font-bold text-[#141210] dark:text-[#F6F2EA]">
                {formatNumber(publishedCount, locale)}
              </p>
              <p className="text-[11px] text-[#9A6B27] dark:text-[#E8C680]">
                {locale === 'fa'
                  ? `${formatNumber(realPhotoCount, locale)} خبر با عکس واقعی`
                  : `${realPhotoCount} with original photos`}
              </p>
            </div>

            <div className="magazine-card rounded-[22px] p-6 sm:p-7 space-y-2">
              <p className="text-xs text-[#5A5247] dark:text-[#A1AAB9]">
                {locale === 'fa' ? 'مجموع بازدید آرشیو' : 'Total Readership'}
              </p>
              <p className="font-mono-tabular text-3xl sm:text-4xl font-bold text-[#141210] dark:text-[#F6F2EA]">
                {formatNumber(totalViews, locale)}
              </p>
              <p className="text-[11px] text-[#5A5247] dark:text-[#A1AAB9]">
                {locale === 'fa' ? 'در پنج منطقه جنوب کرمان' : 'Across 5 regional bureaus'}
              </p>
            </div>

            <div className="magazine-card rounded-[22px] p-6 sm:p-7 space-y-2">
              <p className="text-xs text-[#5A5247] dark:text-[#A1AAB9]">
                {locale === 'fa' ? 'صف گزارش‌های مردمی' : 'Citizen Queue'}
              </p>
              <p className="font-mono-tabular text-3xl sm:text-4xl font-bold text-[#9A6B27] dark:text-[#E8C680]">
                {formatNumber(pendingReports.length, locale)}
              </p>
              <p className="text-[11px] text-[#5A5247] dark:text-[#A1AAB9]">
                {locale === 'fa' ? 'در انتظار راستی‌آزمایی' : 'Awaiting verification'}
              </p>
            </div>

            <div className="magazine-card rounded-[22px] p-6 sm:p-7 space-y-2">
              <p className="text-xs text-[#5A5247] dark:text-[#A1AAB9]">
                {locale === 'fa' ? 'رسانه‌ها و پیام‌ها' : 'Media & Inbox'}
              </p>
              <p className="font-mono-tabular text-3xl sm:text-4xl font-bold text-[#141210] dark:text-[#F6F2EA]">
                {formatNumber(allMediaGallery.length, locale)}
              </p>
              <p className="text-[11px] text-[#5A5247] dark:text-[#A1AAB9]">
                {locale === 'fa'
                  ? `${formatNumber(contactMessages.length, locale)} پیام تماس با ما`
                  : `${contactMessages.length} contact messages`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            <div className="lg:col-span-7 luxury-panel rounded-[24px] p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-editorial-display text-xl font-bold text-[#141210] dark:text-[#F6F2EA]">
                  {locale === 'fa' ? 'تازه‌ترین خبرهای تحریریه' : 'Latest Newsroom Dispatches'}
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('articles')}
                  className="text-xs font-bold text-[#9A6B27] dark:text-[#E8C680] hover:underline cursor-pointer"
                >
                  {locale === 'fa' ? 'مدیریت همه' : 'Manage All'}
                </button>
              </div>
              <div className="divide-y divide-[#D9CEBC]/65 dark:divide-[#D4A85B]/12">
                {articles.slice(0, 5).map((art) => (
                  <div key={art.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#9A6B27] dark:text-[#E8C680] font-bold mb-1">
                        {getCategoryLabel(art.category, locale)} · {getRegionLabel(art.region, locale)}
                      </p>
                      <p className="font-editorial-display text-sm sm:text-base font-bold text-[#141210] dark:text-[#F6F2EA] truncate">
                        {art.title[locale]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditComposer(art)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/24 hover:border-[#9A6B27] dark:hover:border-[#E8C680] shrink-0 cursor-pointer"
                    >
                      {locale === 'fa' ? 'ویرایش' : 'Edit'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="luxury-panel rounded-[24px] p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#9A6B27] dark:text-[#E8C680]" />
                    <h2 className="font-editorial-display text-xl font-bold text-[#141210] dark:text-[#F6F2EA]">
                      {locale === 'fa' ? 'پایش هوشمند و صف رصد' : 'Smart News Monitor'}
                    </h2>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      monitorSnapshot?.settings?.enabled !== false
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-red-500/15 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {monitorSnapshot?.settings?.enabled !== false
                      ? locale === 'fa'
                        ? 'رصد فعال'
                        : 'Active'
                      : locale === 'fa'
                        ? 'متوقف‌شده'
                        : 'Paused'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-xl bg-[#F5F0E6]/75 dark:bg-[#0D111C] p-3 border-[0.5px] border-[#D9CEBC]/70 dark:border-[#D4A85B]/14">
                    <span className="block text-[#5A5247] dark:text-[#A1AAB9] mb-1">
                      {locale === 'fa' ? 'دریافتی / پذیرفته‌شده' : 'Discovered / Accepted'}
                    </span>
                    <strong className="font-mono-tabular text-sm text-[#141210] dark:text-[#F6F2EA]">
                      {formatNumber(Number(monitorSnapshot?.stats?.totalDiscovered ?? monitorSnapshot?.lastRunResult?.discovered ?? 0), locale)}{' '}
                      /{' '}
                      {formatNumber(Number(monitorSnapshot?.stats?.totalAccepted ?? monitorSnapshot?.counts?.accepted ?? 0), locale)}
                    </strong>
                  </div>
                  <div className="rounded-xl bg-[#F5F0E6]/75 dark:bg-[#0D111C] p-3 border-[0.5px] border-[#D9CEBC]/70 dark:border-[#D4A85B]/14">
                    <span className="block text-[#5A5247] dark:text-[#A1AAB9] mb-1">
                      {locale === 'fa' ? 'ردشده / منتشرشده' : 'Rejected / Published'}
                    </span>
                    <strong className="font-mono-tabular text-sm text-[#141210] dark:text-[#F6F2EA]">
                      {formatNumber(Number(monitorSnapshot?.counts?.rejected ?? monitorSnapshot?.stats?.totalRejected ?? 0), locale)}{' '}
                      /{' '}
                      {formatNumber(Number(monitorSnapshot?.counts?.published ?? 0), locale)}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t-[0.5px] border-[#D9CEBC]/70 dark:border-[#D4A85B]/14 space-y-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-[#5A5247] dark:text-[#A1AAB9]">
                      {locale === 'fa' ? 'آخرین اجرای موفق:' : 'Last Successful Run:'}
                    </span>
                    <span className="font-mono-tabular font-semibold">
                      {monitorSnapshot?.lastSuccessAt
                        ? formatShortDate(monitorSnapshot.lastSuccessAt, locale)
                        : locale === 'fa'
                          ? 'ثبت نشده'
                          : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#5A5247] dark:text-[#A1AAB9]">
                      {locale === 'fa' ? 'وضعیت منابع:' : 'Sources Health:'}
                    </span>
                    <span className="font-mono-tabular font-semibold">
                      {locale === 'fa'
                        ? `${formatNumber(monitorSnapshot?.counts?.sourcesOn || 0, locale)} فعال · ${formatNumber(monitorSnapshot?.counts?.sourcesOff || 0, locale)} خاموش · ${formatNumber(monitorSnapshot?.counts?.sourcesError || 0, locale)} خطا`
                        : `${monitorSnapshot?.counts?.sourcesOn || 0} on · ${monitorSnapshot?.counts?.sourcesOff || 0} off · ${monitorSnapshot?.counts?.sourcesError || 0} err`}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#5A5247] dark:text-[#A1AAB9]">
                      {locale === 'fa' ? 'صف بررسی:' : 'Pending Queue:'}
                    </span>
                    <span className="font-mono-tabular font-bold text-[#9A6B27] dark:text-[#E8C680]">
                      {formatNumber(monitorSnapshot?.counts?.pending || 0, locale)}{' '}
                      {locale === 'fa' ? 'مورد' : 'items'}
                    </span>
                  </div>
                </div>

                {(onRunMonitor || onToggleMonitor) && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {onToggleMonitor && (
                      <button
                        type="button"
                        onClick={onToggleMonitor}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/25 hover:border-[#9A6B27] dark:hover:border-[#E8C680] cursor-pointer"
                      >
                        {monitorSnapshot?.settings?.enabled !== false
                          ? locale === 'fa'
                            ? 'توقف رصد'
                            : 'Pause Monitor'
                          : locale === 'fa'
                            ? 'شروع مجدد رصد'
                            : 'Resume Monitor'}
                      </button>
                    )}
                    {onRunMonitor && (
                      <button
                        type="button"
                        disabled={monitorBusy}
                        onClick={onRunMonitor}
                        className="btn-luxury-ink text-xs disabled:opacity-60"
                      >
                        {monitorBusy
                          ? locale === 'fa'
                            ? 'در حال رصد...'
                            : 'Running...'
                          : locale === 'fa'
                            ? 'اجرای رصد اکنون'
                            : 'Run Monitor Now'}
                      </button>
                    )}
                    <a
                      href="/admin#monitor"
                      className="inline-flex items-center px-3 py-2 text-xs font-semibold text-[#8F6321] dark:text-[#ECC983] hover:underline"
                    >
                      {locale === 'fa' ? 'گزارش خطاها و منابع ↗' : 'Sources & Logs ↗'}
                    </a>
                  </div>
                )}

                {monitorSnapshot?.logs && monitorSnapshot.logs.length > 0 && (
                  <div className="pt-2 border-t-[0.5px] border-[#D9CEBC]/70 dark:border-[#D4A85B]/14 space-y-1.5 text-[11px]">
                    <p className="font-bold text-[#5A5247] dark:text-[#A1AAB9]">
                      {locale === 'fa' ? 'آخرین رویدادها / دلایل رد:' : 'Recent Monitor Events:'}
                    </p>
                    {monitorSnapshot.logs.slice(0, 3).map((ev, i) => (
                      <p key={ev.id || i} className="truncate text-[#5A5247] dark:text-[#A1AAB9]">
                        • {ev.message}
                        {ev.blockedReason ? ` (${ev.blockedReason})` : ''}
                        {ev.error ? ` — ${ev.error}` : ''}
                      </p>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t-[0.5px] border-[#D9CEBC]/70 dark:border-[#D4A85B]/14 flex justify-between text-[11px] text-[#5A5247] dark:text-[#A1AAB9]">
                  <span>{locale === 'fa' ? 'منبع داده:' : 'Data Source:'}</span>
                  <span className="font-mono-tabular font-semibold">
                    {dataSource === 'worker-d1' ? 'Cloudflare D1' : 'Local Preview'} · cloudflare-migration
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARTICLE COMPOSER MODAL/PANEL */}
      {isComposerOpen && (
        <div className="mb-10 luxury-panel rounded-[24px] overflow-hidden">
          <div className="h-[1px] w-full gold-hairline" />
          <div className="p-6 sm:p-9">
            <div className="flex items-center justify-between pb-4 mb-6 border-b-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/16">
              <h2 className="font-editorial-display text-2xl font-bold text-[#141210] dark:text-[#F6F2EA]">
                {editingId
                  ? locale === 'fa'
                    ? 'ویرایش خبر'
                    : 'Edit Dispatch'
                  : locale === 'fa'
                    ? 'انتشار خبر جدید در تحریریه'
                    : 'Publish New Dispatch'}
              </h2>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="p-1.5 text-[#5A5247] dark:text-[#A1AAB9] hover:text-[#141210] dark:hover:text-[#F6F2EA] cursor-pointer"
                aria-label={locale === 'fa' ? 'بستن فرم' : 'Close editor'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {composerError && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-xl border-[0.5px] border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{composerError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitArticle} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#141210] dark:text-[#EDE6D8] mb-1.5">
                    {locale === 'fa' ? 'تیتر فارسی *' : 'Persian Headline *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={titleFa}
                    onChange={(e) => setTitleFa(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#141210] dark:text-[#EDE6D8] mb-1.5">
                    {locale === 'fa' ? 'تیتر انگلیسی (اختیاری)' : 'English Headline (Optional)'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#141210] dark:text-[#EDE6D8] mb-1.5">
                    {locale === 'fa' ? 'دسته‌بندی' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryId)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label[locale]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141210] dark:text-[#EDE6D8] mb-1.5">
                    {locale === 'fa' ? 'منطقه' : 'Region'}
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as RegionId)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA]"
                  >
                    {REGIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label[locale]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141210] dark:text-[#EDE6D8] mb-1.5">
                    {locale === 'fa' ? 'خبرنگار / سرویس' : 'Reporter / Desk'}
                  </label>
                  <input
                    type="text"
                    value={authorFa}
                    onChange={(e) => setAuthorFa(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#141210] dark:text-[#EDE6D8] mb-1.5">
                    {locale === 'fa' ? 'لید خبر (خلاصه فارسی)' : 'Persian Summary Deck'}
                  </label>
                  <textarea
                    rows={2}
                    value={deckFa}
                    onChange={(e) => setDeckFa(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#141210] dark:text-[#EDE6D8] mb-1.5">
                    {locale === 'fa' ? 'خلاصه انگلیسی (اختیاری)' : 'English Summary Deck'}
                  </label>
                  <textarea
                    rows={2}
                    dir="ltr"
                    value={deckEn}
                    onChange={(e) => setDeckEn(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#141210] dark:text-[#EDE6D8] mb-1.5">
                  {locale === 'fa'
                    ? 'متن کامل خبر (پاراگراف‌ها با خط خالی جدا شوند)'
                    : 'Full Story Body (Blank line between paragraphs)'}
                </label>
                <textarea
                  rows={5}
                  value={bodyFa}
                  onChange={(e) => setBodyFa(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA] leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#141210] dark:text-[#EDE6D8]">
                    {locale === 'fa' ? 'انتخاب تصویر جلد از رسانه یا آپلود' : 'Cover Image'}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9A6B27] dark:text-[#E8C680] hover:underline cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>{locale === 'fa' ? 'آپلود تصویر' : 'Upload Image'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleUploadCover}
                    className="hidden"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {mediaAssets.slice(0, 5).map((preset) => {
                    const selected = coverImage === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setCoverImage(preset.url)}
                        className={`text-start rounded-xl border-[0.5px] p-1.5 transition-colors cursor-pointer ${
                          selected
                            ? 'border-[#9A6B27] dark:border-[#E8C680] bg-[#9A6B27]/10 dark:bg-[#E8C680]/10'
                            : 'border-[#D9CEBC] dark:border-[#D4A85B]/18'
                        }`}
                      >
                        <div className="aspect-[16/10] rounded-lg overflow-hidden mb-1.5">
                          <EditorialImage src={preset.url} alt={preset.title} />
                        </div>
                        <span className="block text-[11px] truncate text-[#5A5247] dark:text-[#A1AAB9] px-0.5">
                          {preset.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-3 border-t-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/16 text-xs sm:text-sm">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status === 'published'}
                    onChange={(e) => setStatus(e.target.checked ? 'published' : 'draft')}
                    className="accent-[#9A6B27]"
                  />
                  <span>{locale === 'fa' ? 'انتشار عمومی' : 'Publish immediately'}</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featuredInHero}
                    onChange={(e) => setFeaturedInHero(e.target.checked)}
                    className="accent-[#9A6B27]"
                  />
                  <span>{locale === 'fa' ? 'نمایش در هیرو زنده' : 'Feature in Live Hero'}</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBreaking}
                    onChange={(e) => setIsBreaking(e.target.checked)}
                    className="accent-[#9A6B27]"
                  />
                  <span>{locale === 'fa' ? 'خط فوری' : 'Breaking Wire'}</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="btn-luxury-ink text-xs sm:text-sm">
                  {editingId
                    ? locale === 'fa'
                      ? 'ذخیره تغییرات'
                      : 'Save Changes'
                    : locale === 'fa'
                      ? 'انتشار در نبض ساردو'
                      : 'Publish Dispatch'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-medium text-[#5A5247] dark:text-[#A1AAB9] cursor-pointer"
                >
                  {locale === 'fa' ? 'انصراف' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: ARTICLES MANAGEMENT */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#9A6B27] dark:text-[#E8C680] absolute top-1/2 -translate-y-1/2 start-4 pointer-events-none" />
            <input
              type="search"
              value={articleSearch}
              onChange={(e) => {
                setArticleSearch(e.target.value);
                setVisibleArticleCount(20);
              }}
              placeholder={
                locale === 'fa' ? 'جستجو در فهرست اخبار...' : 'Filter newsroom articles...'
              }
              className="w-full min-h-[44px] ps-11 pe-4 py-2.5 text-sm rounded-xl bg-[#FFFDF9] dark:bg-[#0F131D] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA]"
            />
          </div>

          <div className="space-y-4">
            {filteredAdminArticles.slice(0, visibleArticleCount).map((item) => (
              <article
                key={item.id}
                className="magazine-card group rounded-[22px] p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden"
              >
                <div className="relative z-10 flex items-start gap-5 min-w-0">
                  <div className="w-28 sm:w-32 aspect-[4/3] rounded-[14px] shrink-0 overflow-hidden bg-[#EAE2D3] dark:bg-[#080A0F] border-[0.5px] border-[#141210]/10 dark:border-[#F5F1E8]/10">
                    <EditorialImage
                      src={resolveArticleCoverImage(item)}
                      alt={item.title[locale]}
                      className="magazine-media-img w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5A5247] dark:text-[#A1AAB9]">
                      <span className="font-bold text-[#9A6B27] dark:text-[#E8C680]">
                        {getCategoryLabel(item.category, locale)}
                      </span>
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span>{getRegionLabel(item.region, locale)}</span>
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span>
                        {item.status === 'published'
                          ? locale === 'fa'
                            ? 'منتشرشده'
                            : 'Published'
                          : locale === 'fa'
                            ? 'پیش‌نویس'
                            : 'Draft'}
                      </span>
                      {item.featuredInHero && (
                        <>
                          <span aria-hidden="true" className="opacity-40">·</span>
                          <span className="inline-flex items-center gap-1 text-[#9A6B27] dark:text-[#E8C680]">
                            <Star className="w-3 h-3" />
                            <span>{locale === 'fa' ? 'هیرو' : 'Hero'}</span>
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="font-editorial-display text-lg font-bold text-[#141210] dark:text-[#F6F2EA] leading-snug line-clamp-2">
                      {item.title[locale]}
                    </h3>
                    <p className="text-xs text-[#5A5247] dark:text-[#A1AAB9] tabular-nums">
                      {formatShortDate(item.publishedAt, locale)} · {formatNumber(item.views, locale)}{' '}
                      {locale === 'fa' ? 'بازدید' : 'views'}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreviewArticle(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/22 text-[#141210] dark:text-[#EDE6D8] hover:border-[#9A6B27] dark:hover:border-[#E8C680] rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{locale === 'fa' ? 'نمایش' : 'Read'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditComposer(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/22 text-[#141210] dark:text-[#EDE6D8] hover:border-[#9A6B27] dark:hover:border-[#E8C680] rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{locale === 'fa' ? 'ویرایش' : 'Edit'}</span>
                  </button>
                  {item.status === 'published' && (
                    <a
                      href={`/admin/articles/${encodeURIComponent(item.id)}/share-kit`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/22 text-[#8F6321] dark:text-[#ECC983] hover:border-[#9A6B27] dark:hover:border-[#E8C680] rounded-lg transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{locale === 'fa' ? 'پکیج انتشار' : 'Share Kit'}</span>
                    </a>
                  )}
                  {confirmDeleteId === item.id ? (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteArticle(item.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-3 py-2 text-xs font-bold bg-red-600 text-white rounded-lg cursor-pointer"
                      >
                        {locale === 'fa' ? 'تایید حذف' : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-2 text-xs text-[#5A5247] dark:text-[#A1AAB9] cursor-pointer"
                      >
                        {locale === 'fa' ? 'لغو' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      aria-label={locale === 'fa' ? 'حذف خبر' : 'Delete article'}
                      className="p-2 text-[#5A5247] dark:text-[#A1AAB9] hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </article>
            ))}

            {filteredAdminArticles.length > visibleArticleCount && (
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleArticleCount((prev) => prev + 20)}
                  className="btn-luxury-ink text-xs sm:text-sm"
                >
                  {locale === 'fa'
                    ? `نمایش بیشتر (${formatNumber(visibleArticleCount, locale)} از ${formatNumber(filteredAdminArticles.length, locale)})`
                    : `Load More (${visibleArticleCount} of ${filteredAdminArticles.length})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CITIZEN QUEUE */}
      {activeTab === 'citizen' && (
        <div className="space-y-5">
          {citizenReports.length === 0 ? (
            <div className="luxury-panel rounded-[24px] p-14 text-center text-sm text-[#5A5247] dark:text-[#A1AAB9]">
              {locale === 'fa' ? 'گزارش مردمی ثبت نشده است.' : 'No citizen reports submitted yet.'}
            </div>
          ) : (
            citizenReports.map((report) => (
              <article
                key={report.id}
                className="magazine-card rounded-[22px] p-7 sm:p-8 flex flex-col lg:flex-row lg:items-start justify-between gap-7 overflow-hidden"
              >
                <div className="relative z-10 space-y-3 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5A5247] dark:text-[#A1AAB9]">
                    <span className="font-bold text-[#9A6B27] dark:text-[#E8C680]">
                      {getCategoryLabel(report.category, locale)}
                    </span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span>{getRegionLabel(report.region, locale)}</span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span>{report.reporterName}</span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span>
                      {report.status === 'pending'
                        ? locale === 'fa'
                          ? 'در انتظار بررسی'
                          : 'Pending review'
                        : report.status === 'approved'
                          ? locale === 'fa'
                            ? 'منتشرشده'
                            : 'Published'
                          : locale === 'fa'
                            ? 'بایگانی‌شده'
                            : 'Archived'}
                    </span>
                  </div>

                  <h3 className="font-editorial-display text-xl font-bold text-[#141210] dark:text-[#F6F2EA] leading-snug">
                    {report.title}
                  </h3>
                  <p className="text-sm text-[#5A5247] dark:text-[#A1AAB9] leading-relaxed">
                    {report.description}
                  </p>
                  {report.imageDataUrl && (
                    <img
                      src={report.imageDataUrl}
                      alt={report.title}
                      className="mt-4 max-h-56 rounded-xl object-cover border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20"
                    />
                  )}
                </div>

                <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
                  {report.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onApproveCitizenReport(report)}
                        className="btn-luxury-ink text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{locale === 'fa' ? 'تایید و انتشار' : 'Approve & Publish'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onArchiveCitizenReport(report.id)}
                        className="px-4 py-2.5 text-xs font-semibold border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#5A5247] dark:text-[#A1AAB9] rounded-xl cursor-pointer"
                      >
                        {locale === 'fa' ? 'بایگانی' : 'Archive'}
                      </button>
                    </>
                  )}
                  {onDeleteCitizenReport && (
                    <button
                      type="button"
                      onClick={() => onDeleteCitizenReport(report.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-[0.5px] border-red-500/30 text-red-700 dark:text-red-300 hover:bg-red-500/10 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{locale === 'fa' ? 'حذف' : 'Delete'}</span>
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* TAB 3B: CONTACT MESSAGES INBOX */}
      {activeTab === 'messages' && (
        <div className="space-y-5">
          {contactMessages.length === 0 ? (
            <div className="luxury-panel rounded-[24px] p-14 text-center text-sm text-[#5A5247] dark:text-[#A1AAB9]">
              {locale === 'fa' ? 'هنوز پیامی از فرم تماس ثبت نشده است.' : 'No contact messages received yet.'}
            </div>
          ) : (
            contactMessages.map((msg) => (
              <article
                key={msg.id}
                className="magazine-card rounded-[22px] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-start justify-between gap-5 overflow-hidden"
              >
                <div className="space-y-2.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5A5247] dark:text-[#A1AAB9]">
                    <span className="font-bold text-[#9A6B27] dark:text-[#E8C680]">{msg.name}</span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span dir="ltr">{msg.email}</span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span>{formatShortDate(msg.createdAt, locale)}</span>
                  </div>
                  <h3 className="font-editorial-display text-lg font-bold text-[#141210] dark:text-[#F6F2EA]">
                    {msg.subject}
                  </h3>
                  <p className="text-sm text-[#5A5247] dark:text-[#A1AAB9] leading-relaxed whitespace-pre-line">
                    {msg.message}
                  </p>
                </div>

                {onDeleteContactMessage && (
                  <button
                    type="button"
                    onClick={() => onDeleteContactMessage(msg.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-[0.5px] border-red-500/30 text-red-700 dark:text-red-300 hover:bg-red-500/10 rounded-xl shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{locale === 'fa' ? 'حذف پیام' : 'Delete'}</span>
                  </button>
                )}
              </article>
            ))
          )}
        </div>
      )}

      {/* TAB 4: MEDIA & IMAGE LIBRARY MANAGER */}
      {activeTab === 'media' && (
        <div className="space-y-8">
          <div className="luxury-panel rounded-[24px] p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div className="flex-1 max-w-lg space-y-2">
              <label className="block text-xs font-bold text-[#9A6B27] dark:text-[#E8C680]">
                {locale === 'fa' ? 'افزودن تصویر جدید به کتابخانه رسانه' : 'Upload New Media Asset'}
              </label>
              <input
                type="text"
                value={mediaTitle}
                onChange={(e) => setMediaTitle(e.target.value)}
                placeholder={
                  locale === 'fa' ? 'عنوان توضیحی تصویر (اختیاری)...' : 'Descriptive asset title...'
                }
                className="w-full min-h-[44px] px-4 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA]"
              />
            </div>

            <div>
              <input
                ref={mediaFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleUploadMediaLibraryFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => mediaFileInputRef.current?.click()}
                className="btn-luxury-ink text-xs sm:text-sm"
              >
                <ImagePlus className="w-4 h-4" />
                <span>{locale === 'fa' ? 'آپلود تصویر (JPG / PNG / WebP)' : 'Upload Photo'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allMediaGallery.map((asset) => (
              <div
                key={asset.id}
                className="magazine-card group rounded-[22px] p-4 flex flex-col justify-between gap-4 overflow-hidden"
              >
                <div className="relative z-10 space-y-3.5">
                  <div className="aspect-[16/10] rounded-[14px] overflow-hidden bg-[#EAE2D3] dark:bg-[#080A0F] border-[0.5px] border-[#141210]/10 dark:border-[#F5F1E8]/10">
                    <EditorialImage
                      src={asset.url}
                      alt={asset.title}
                      className="magazine-media-img w-full h-full object-cover"
                    />
                  </div>
                  <div className="px-1 space-y-1">
                    <p className="font-editorial-display text-sm font-bold text-[#141210] dark:text-[#F6F2EA] line-clamp-1">
                      {asset.title}
                    </p>
                    <p className="text-[11px] text-[#5A5247] dark:text-[#A1AAB9] font-mono-tabular">
                      {asset.source === 'editorial'
                        ? locale === 'fa'
                          ? 'آرشیو تحریریه'
                          : 'Editorial Preset'
                        : asset.source === 'd1'
                          ? 'Cloudflare D1 / Uploads'
                          : locale === 'fa'
                            ? 'آپلود جدید'
                            : 'Uploaded'}{' '}
                      · {asset.sizeLabel || 'HD'}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 px-1 pt-3 border-t-[0.5px] border-[#D9CEBC]/70 dark:border-[#D4A85B]/14 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(asset.url)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9A6B27] dark:text-[#E8C680] hover:underline cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{locale === 'fa' ? 'کپی نشانی' : 'Copy URL'}</span>
                  </button>

                  {asset.source === 'upload' && (
                    <button
                      type="button"
                      onClick={() => onDeleteMediaAsset(asset.id)}
                      aria-label={locale === 'fa' ? 'حذف رسانه' : 'Delete media'}
                      className="p-1.5 text-[#5A5247] dark:text-[#A1AAB9] hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SITE SETTINGS & CLOUDFLARE INFRASTRUCTURE */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleSaveSettingsForm}
            className="lg:col-span-8 luxury-panel rounded-[24px] p-7 sm:p-9 space-y-6"
          >
            <h2 className="font-editorial-display text-2xl font-bold text-[#141210] dark:text-[#F6F2EA]">
              {locale === 'fa' ? 'تنظیمات هویت سایت، سئو و پایش' : 'Site Identity, SEO & Monitoring'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {locale === 'fa' ? 'نام فارسی رسانه' : 'Persian Site Name'}
                </label>
                <input
                  type="text"
                  value={settingsDraft.siteNameFa}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, siteNameFa: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {locale === 'fa' ? 'نام انگلیسی رسانه' : 'English Site Name'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={settingsDraft.siteNameEn}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, siteNameEn: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">
                {locale === 'fa' ? 'توضیحات متای سئو (فارسی)' : 'SEO Meta Description (Persian)'}
              </label>
              <textarea
                rows={3}
                value={settingsDraft.seoDescriptionFa}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, seoDescriptionFa: e.target.value })
                }
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {locale === 'fa' ? 'ایمیل رسمی تحریریه' : 'Editorial Email'}
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={settingsDraft.contactEmail}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, contactEmail: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {locale === 'fa' ? 'تلفن سردبیری' : 'Editorial Phone'}
                </label>
                <input
                  type="text"
                  value={settingsDraft.editorialPhone}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, editorialPhone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20"
                />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/16 text-xs sm:text-sm">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsDraft.showBreakingWire}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, showBreakingWire: e.target.checked })
                  }
                  className="accent-[#9A6B27]"
                />
                <span>{locale === 'fa' ? 'نمایش نوار خط فوری زیر هیرو' : 'Show Breaking News Wire'}</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsDraft.monitoringEnabled}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, monitoringEnabled: e.target.checked })
                  }
                  className="accent-[#9A6B27]"
                />
                <span>
                  {locale === 'fa'
                    ? 'فعال بودن سامانه مستقل پایش اخبار'
                    : 'Independent News Monitoring Pipeline Active'}
                </span>
              </label>

              <div className="rounded-xl bg-[#9A6B27]/8 dark:bg-[#E8C680]/8 border-[0.5px] border-[#9A6B27]/25 dark:border-[#E8C680]/25 p-4 text-xs leading-[1.85]">
                <strong className="block text-[#9A6B27] dark:text-[#E8C680] mb-1">
                  {locale === 'fa' ? 'قفل دائمی منشور تحریریه:' : 'Permanent Editorial Charter Lock:'}
                </strong>
                {locale === 'fa'
                  ? 'مسدودسازی آگهی تبلیغاتی، رپورتاژ سفارشی و اطلاعیه‌های ترحیم/مراسم فوت در سامانه پایش و انتشار همواره فعال است.'
                  : 'Blocking of commercial ads, advertorials, and obituary notices is permanently enforced.'}
              </div>
            </div>

            <button type="submit" className="btn-luxury-ink text-xs sm:text-sm">
              <Save className="w-4 h-4" />
              <span>{locale === 'fa' ? 'ذخیره تنظیمات سایت' : 'Save Site Settings'}</span>
            </button>
          </form>

          <div className="lg:col-span-4 space-y-6">
            <div className="luxury-panel rounded-[24px] p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-2.5 text-[#9A6B27] dark:text-[#E8C680]">
                <Database className="w-4.5 h-4.5" />
                <h3 className="font-editorial-display text-lg font-bold text-[#141210] dark:text-[#F6F2EA]">
                  {locale === 'fa' ? 'پیکربندی Cloudflare Workers + D1' : 'Cloudflare Workers + D1'}
                </h3>
              </div>
              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-[#5A5247] dark:text-[#A1AAB9]">Entry Point</dt>
                  <dd className="font-mono-tabular font-semibold">src/worker.js</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#5A5247] dark:text-[#A1AAB9]">Config</dt>
                  <dd className="font-mono-tabular font-semibold">wrangler.jsonc</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#5A5247] dark:text-[#A1AAB9]">D1 Binding</dt>
                  <dd className="font-mono-tabular font-semibold">DB (nabzesardo-cloudflare-db)</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#5A5247] dark:text-[#A1AAB9]">Branch</dt>
                  <dd className="font-mono-tabular font-semibold">cloudflare-migration</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#5A5247] dark:text-[#A1AAB9]">SEO Feeds</dt>
                  <dd className="font-mono-tabular font-semibold">/sitemap.xml · /feed.xml</dd>
                </div>
                <div className="pt-2 flex flex-wrap gap-2">
                  <a href="/admin#monitor" className="text-[11px] font-bold text-[#8F6321] dark:text-[#ECC983] hover:underline">
                    {locale === 'fa' ? 'مدیریت رصد هوشمند ↗' : 'Monitor Console ↗'}
                  </a>
                  <span aria-hidden="true" className="opacity-35">·</span>
                  <a href="/admin#followups" className="text-[11px] font-bold text-[#8F6321] dark:text-[#ECC983] hover:underline">
                    {locale === 'fa' ? 'مدیریت پیگیری‌ها ↗' : 'Follow-up Desk ↗'}
                  </a>
                </div>
              </dl>
            </div>

            <div className="luxury-panel rounded-[24px] p-6 sm:p-7 space-y-4">
              <h3 className="font-editorial-display text-lg font-bold text-[#141210] dark:text-[#F6F2EA]">
                {locale === 'fa' ? 'پشتیبان‌گیری و بازنشانی' : 'Backup & Reset'}
              </h3>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={onExportJson}
                  className="btn-luxury-ink w-full text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{locale === 'fa' ? 'دانلود پشتیبان کامل JSON' : 'Download Full JSON'}</span>
                </button>
                {dataSource !== 'worker-d1' && (
                  <button
                    type="button"
                    onClick={onResetDefaults}
                    className="w-full inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 text-xs font-semibold border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#5A5247] dark:text-[#A1AAB9] hover:text-[#141210] dark:hover:text-[#F6F2EA] rounded-[10px] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{locale === 'fa' ? 'بازنشانی داده‌های نمونه پیش‌نمایش' : 'Reset Preview Data'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
