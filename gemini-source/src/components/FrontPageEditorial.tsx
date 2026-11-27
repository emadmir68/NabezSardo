import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ChevronDown,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
} from 'lucide-react';
import { CATEGORIES, REGIONS } from '../data/initialData';
import type { Article, CategoryId, Locale, RegionId } from '../types/news';
import {
  formatEditorialIndex,
  formatNumber,
  formatShortDate,
  getCategoryLabel,
  getRegionLabel,
  hasRealEditorialPhoto,
} from '../utils/formatters';
import {
  MagazineArticleCard,
  MagazineHairlineRow,
  MagazineIndexRowCard,
  MagazineLeadCard,
  MagazinePortraitDossierCard,
  MagazineSecondaryCard,
} from './MagazineCards';

interface FrontPageEditorialProps {
  articles: Article[];
  locale: Locale;
  selectedCategory: CategoryId | 'all';
  onSelectCategory: (category: CategoryId | 'all') => void;
  selectedRegion: RegionId | 'all';
  onSelectRegion: (region: RegionId | 'all') => void;
  savedOnly: boolean;
  onToggleSavedOnly: () => void;
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
  onOpenArticle: (article: Article) => void;
  onGoToSubmit: () => void;
  mode: 'home' | 'desks' | 'archive';
}

export function FrontPageEditorial({
  articles,
  locale,
  selectedCategory,
  onSelectCategory,
  selectedRegion,
  onSelectRegion,
  savedOnly,
  onToggleSavedOnly,
  bookmarkedIds,
  onToggleBookmark,
  onOpenArticle,
  onGoToSubmit,
  mode,
}: FrontPageEditorialProps) {
  const [archiveQuery, setArchiveQuery] = useState('');
  const [archiveSort, setArchiveSort] = useState<'latest' | 'popular'>('latest');
  const [archiveLayout, setArchiveLayout] = useState<'grid' | 'list'>('grid');
  const pageSize = mode === 'home' ? 8 : 12;
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(mode === 'home' ? 8 : 12);
  }, [mode, selectedCategory, selectedRegion, savedOnly, archiveQuery, archiveSort]);

  const published = articles.filter((a) => a.status === 'published');

  // Prioritize real photographic stories for flagship visual spreads (prevents SVG placeholders in showcases)
  const photoStories = published.filter((a) => hasRealEditorialPhoto(a));
  const visualPool =
    photoStories.length >= 6
      ? photoStories
      : [
          ...photoStories,
          ...published.filter((a) => !photoStories.some((p) => p.id === a.id)),
        ];

  const leadFeature = visualPool[0];
  const secondaryFeatures = published
    .filter((a) => a.id !== leadFeature?.id)
    .slice(0, 3);
  const usedSpotlightIds = new Set(
    [leadFeature?.id, ...secondaryFeatures.map((s) => s.id)].filter(Boolean)
  );
  const visualDossiers = visualPool
    .filter((a) => !usedSpotlightIds.has(a.id))
    .slice(0, 3);
  const finalVisualDossiers =
    visualDossiers.length >= 3 ? visualDossiers : visualPool.slice(1, 4);

  const filteredArticles = published
    .filter((article) => {
      if (selectedCategory !== 'all' && article.category !== selectedCategory) return false;
      if (selectedRegion !== 'all' && article.region !== selectedRegion) return false;
      if (savedOnly && !bookmarkedIds.includes(article.id)) return false;
      if (mode === 'archive' && archiveQuery.trim()) {
        const q = archiveQuery.trim().toLowerCase();
        const hay = `${article.title.fa} ${article.title.en} ${article.deck.fa} ${article.deck.en} ${article.author.fa}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (mode === 'archive' && archiveSort === 'popular') {
        return b.views - a.views;
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

  const mostRead = [...published].sort((a, b) => b.views - a.views).slice(0, 5);
  const quickDispatches = published.slice(0, 4);

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedRegion !== 'all' ||
    savedOnly ||
    (mode === 'archive' && archiveQuery.trim().length > 0);

  const resetFilters = () => {
    onSelectCategory('all');
    onSelectRegion('all');
    if (savedOnly) onToggleSavedOnly();
    setArchiveQuery('');
  };

  return (
    <div className="w-full">
      {/* Dedicated Luxury Masthead for News Desks Page */}
      {mode === 'desks' && (
        <section
          className="w-full border-b-[0.75px] border-[#D9CEBC] dark:border-[#D4A85B]/20 bg-[#07090E] text-[#F6F2EA]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 20%, rgba(212, 168, 91, 0.18), transparent 50%)',
          }}
        >
          <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
            <div className="max-w-3xl mb-10 sm:mb-12">
              <p className="text-xs font-bold text-[#F0D496] mb-2.5">
                {locale === 'fa' ? 'میزهای تخصصی تحریریه نبض ساردو' : 'Nabz Sardo Editorial Desks'}
              </p>
              <h1
                className={`font-editorial-display text-3xl sm:text-5xl font-bold text-[#FDFBF7] mb-4 ${
                  locale === 'fa' ? 'leading-[1.4]' : 'leading-tight'
                }`}
              >
                {locale === 'fa'
                  ? 'روایت دقیق هفت حوزه کلیدی جنوب کرمان'
                  : 'Seven Dedicated Desks Covering South Kerman'}
              </h1>
              <p className="text-sm sm:text-base text-[#EDE6D8]/82 leading-[1.85]">
                {locale === 'fa'
                  ? 'میز موضوعی دلخواه خود را انتخاب کنید تا گزارش‌های میدانی، تحلیل‌ها و خبرهای تخصصی آن حوزه به‌صورت یکپارچه نمایش داده شوند.'
                  : 'Select an editorial desk below to explore dedicated field reporting, regional economics, climate alerts, and cultural essays.'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {CATEGORIES.map((cat) => {
                const count = published.filter((a) => a.category === cat.id).length;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSelectCategory(isSelected ? 'all' : cat.id)}
                    className={`group text-start rounded-2xl p-4 sm:p-6 border-[0.75px] backdrop-blur-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${
                      isSelected
                        ? 'bg-[#171F32]/92 border-[#E8C680] shadow-[0_18px_36px_-18px_rgba(212,168,91,0.55)]'
                        : 'bg-[#10141F]/78 border-[#F5F1E8]/14 hover:border-[#E8C680]/45 hover:bg-[#141B2B]/88'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono-tabular mb-3">
                      <span className="text-[#F0D496] font-semibold">{cat.code}</span>
                      <span className="text-[#A1AAB9]">
                        {locale === 'fa'
                          ? `${formatNumber(count, locale)} روایت`
                          : `${count} stories`}
                      </span>
                    </div>
                    <p className="font-editorial-display text-[15px] sm:text-lg font-bold text-[#FDFBF7] group-hover:text-[#F0D496] transition-colors leading-snug">
                      {cat.label[locale]}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Dedicated Luxury Masthead for Archive Page */}
      {mode === 'archive' && (
        <section
          className="w-full border-b-[0.75px] border-[#D9CEBC] dark:border-[#D4A85B]/20 bg-[#07090E] text-[#F6F2EA]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 82% 18%, rgba(212, 168, 91, 0.18), transparent 50%)',
          }}
        >
          <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="max-w-2xl">
                <p className="text-xs font-bold text-[#F0D496] mb-2.5">
                  {locale === 'fa' ? 'بایگانی دیجیتال و فهرست مطالعه' : 'Digital Broadsheet Archive'}
                </p>
                <h1
                  className={`font-editorial-display text-3xl sm:text-5xl font-bold text-[#FDFBF7] mb-4 ${
                    locale === 'fa' ? 'leading-[1.4]' : 'leading-tight'
                  }`}
                >
                  {locale === 'fa'
                    ? 'آرشیو جامع روایت‌های نبض ساردو'
                    : 'Complete Nabz Sardo Archive'}
                </h1>
                <p className="text-sm sm:text-base text-[#EDE6D8]/82 leading-[1.85]">
                  {locale === 'fa'
                    ? 'جستجوی مستقیم در تمامی خبرها، مرتب‌سازی بر اساس تازه‌ترین یا پربازدیدترین‌ها، و دسترسی سریع به فهرست نشان‌شده‌ها.'
                    : 'Search every published dispatch, sort by recency or readership, and switch between magazine cards or compact broadsheet index.'}
                </p>
              </div>

              <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 sm:min-w-[260px]">
                  <Search className="w-4 h-4 text-[#F0D496] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={archiveQuery}
                    onChange={(e) => setArchiveQuery(e.target.value)}
                    placeholder={
                      locale === 'fa' ? 'جستجو در آرشیو...' : 'Filter archive...'
                    }
                    className="w-full min-h-[44px] ps-10 pe-4 py-2.5 text-sm rounded-xl bg-[#111624] border-[0.75px] border-[#F5F1E8]/18 text-[#F6F2EA] placeholder:text-[#A1AAB9] focus:outline-none focus:border-[#E8C680]"
                  />
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="inline-flex flex-1 sm:flex-none rounded-xl border-[0.75px] border-[#F5F1E8]/18 bg-[#111624] p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setArchiveSort('latest')}
                      className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        archiveSort === 'latest'
                          ? 'bg-gradient-to-b from-[#F0D496] to-[#C69546] text-[#080A0F]'
                          : 'text-[#EDE6D8]/80 hover:text-[#F6F2EA]'
                      }`}
                    >
                      {locale === 'fa' ? 'تازه‌ترین' : 'Latest'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setArchiveSort('popular')}
                      className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        archiveSort === 'popular'
                          ? 'bg-gradient-to-b from-[#F0D496] to-[#C69546] text-[#080A0F]'
                          : 'text-[#EDE6D8]/80 hover:text-[#F6F2EA]'
                      }`}
                    >
                      {locale === 'fa' ? 'پربازدیدترین' : 'Most Read'}
                    </button>
                  </div>

                  <div className="inline-flex rounded-xl border-[0.75px] border-[#F5F1E8]/18 bg-[#111624] p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setArchiveLayout('grid')}
                      aria-label={locale === 'fa' ? 'نمایش کارتی' : 'Card grid view'}
                      className={`p-2 rounded-lg transition-all cursor-pointer ${
                        archiveLayout === 'grid'
                          ? 'bg-gradient-to-b from-[#F0D496] to-[#C69546] text-[#080A0F]'
                          : 'text-[#EDE6D8]/80 hover:text-[#F6F2EA]'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setArchiveLayout('list')}
                      aria-label={locale === 'fa' ? 'نمایش فهرستی' : 'Compact list view'}
                      className={`p-2 rounded-lg transition-all cursor-pointer ${
                        archiveLayout === 'list'
                          ? 'bg-gradient-to-b from-[#F0D496] to-[#C69546] text-[#080A0F]'
                          : 'text-[#EDE6D8]/80 hover:text-[#F6F2EA]'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tier 2: High-End Magazine Flagship Spread (Home View) */}
      {mode === 'home' && leadFeature && (
        <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-6 sm:pb-8 mb-8 sm:mb-12 border-b-[0.75px] border-[#D9CEBC] dark:border-[#D4A85B]/18">
            <div>
              <p className="text-xs font-bold text-[#9A6B27] dark:text-[#E8C680] mb-2">
                {locale === 'fa' ? '۰۱. گزیده ویژه تحریریه' : '01. Editorial Spotlight'}
              </p>
              <h2
                className={`font-editorial-display text-2xl sm:text-4xl font-bold text-[#141210] dark:text-[#F6F2EA] ${
                  locale === 'fa' ? 'leading-[1.4]' : 'leading-tight'
                }`}
              >
                {locale === 'fa'
                  ? 'روایت‌های شاخص جنوب کرمان'
                  : 'Flagship Dispatches Across South Kerman'}
              </h2>
            </div>
            <p className="text-[13.5px] sm:text-sm text-[#5A5247] dark:text-[#A1AAB9] max-w-md leading-[1.85]">
              {locale === 'fa'
                ? 'گزارش‌های میدانی، پرونده‌های تحلیلی و روایت‌های اختصاصی از ساردوئیه، جیرفت و شهرهای جنوبی استان.'
                : 'Signature field reports and regional essays crafted across Sarduiyeh, Jiroft, and South Kerman.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-9 lg:gap-10 items-stretch">
            <MagazineLeadCard
              article={leadFeature}
              locale={locale}
              isSaved={bookmarkedIds.includes(leadFeature.id)}
              onOpen={onOpenArticle}
              onToggleBookmark={onToggleBookmark}
            />

            <div className="lg:col-span-5 flex flex-col justify-between gap-5 sm:gap-6">
              {secondaryFeatures.map((story, idx) => (
                <MagazineSecondaryCard
                  key={story.id}
                  article={story}
                  locale={locale}
                  index={idx}
                  isSaved={bookmarkedIds.includes(story.id)}
                  onOpen={onOpenArticle}
                  onToggleBookmark={onToggleBookmark}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Visual Photojournalism Dossiers Strip — Obsidian Exhibition Band */}
      {mode === 'home' && finalVisualDossiers.length > 0 && (
        <section className="dark w-full border-y border-[#D4A85B]/20 bg-[#07090F] text-[#F5F1E8]">
          <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-8 sm:mb-12">
              <div>
                <p className="text-xs font-bold text-[#ECC983] mb-2">
                  {locale === 'fa' ? '۰۲. پرونده‌های تصویری و میدانی' : '02. Visual Dossiers'}
                </p>
                <h2
                  className={`font-editorial-display text-2xl sm:text-4xl font-bold text-[#FDFBF7] ${
                    locale === 'fa' ? 'leading-[1.4]' : 'leading-tight'
                  }`}
                >
                  {locale === 'fa'
                    ? 'ساردوئیه و جنوب کرمان در قاب تحریریه'
                    : 'South Kerman Through the Editorial Lens'}
                </h2>
              </div>
              <span className="text-xs text-[#A3ADBF]">
                {locale === 'fa'
                  ? 'منتخب روایت‌های مستند و تحلیلی هفته'
                  : 'Curated visual journalism of the week'}
              </span>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-8 no-scrollbar pb-2 md:pb-0">
              {finalVisualDossiers.map((dossier, idx) => (
                <div
                  key={dossier.id}
                  className="w-[82vw] sm:w-[60vw] md:w-auto shrink-0 snap-center"
                >
                  <MagazinePortraitDossierCard
                    article={dossier}
                    locale={locale}
                    index={idx}
                    onOpen={onOpenArticle}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tier 3: High-End Magazine Regional Desk Grid & Side Rail */}
      <section className="relative overflow-x-clip">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-75 dark:opacity-55"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 55% 42% at 15% 18%, rgba(212, 168, 91, 0.08), transparent 70%), radial-gradient(ellipse 48% 38% at 85% 62%, rgba(154, 107, 39, 0.065), transparent 70%)',
          }}
        />
        <div className="relative z-10 max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
        {mode === 'home' && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-6 sm:pb-8 mb-8 sm:mb-10 border-b-[0.5px] border-[#D9CEBC]/85 dark:border-[#D4A85B]/16">
            <div>
              <p className="text-xs font-bold text-[#9A6B27] dark:text-[#E8C680] mb-2">
                {locale === 'fa' ? '۰۳. میزهای خبری و جغرافیای منطقه' : '03. Regional Desks & Archive'}
              </p>
              <h2
                className={`font-editorial-display text-2xl sm:text-4xl font-bold text-[#141210] dark:text-[#F6F2EA] ${
                  locale === 'fa' ? 'leading-[1.4]' : 'leading-tight'
                }`}
              >
                {locale === 'fa'
                  ? 'تازه‌ترین روایت‌ها به تفکیک میز خبری'
                  : 'Latest Dispatches by Desk'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5A5247] dark:text-[#A1AAB9]">
              <span className="tabular-nums font-medium">
                {locale === 'fa'
                  ? `${formatNumber(filteredArticles.length, locale)} خبر آماده مطالعه`
                  : `${filteredArticles.length} curated stories`}
              </span>
              {hasActiveFilters && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 text-[#9A6B27] dark:text-[#E8C680] hover:underline font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{locale === 'fa' ? 'پاک‌کردن فیلترها' : 'Reset filters'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Sculpted Luxury Desk Filter Bar */}
        <div className="luxury-panel rounded-2xl p-4 sm:p-6 mb-10 sm:mb-12 space-y-4">
          <div
            role="tablist"
            aria-label={locale === 'fa' ? 'فیلتر میزهای خبری' : 'Filter by news desk'}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'all'}
              onClick={() => onSelectCategory('all')}
              className={`min-h-[40px] px-4 py-2 text-xs sm:text-[13px] font-bold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#141210] text-[#F6F2EA] dark:bg-gradient-to-b dark:from-[#F0D496] dark:to-[#C69546] dark:text-[#080A0F] shadow-sm'
                  : 'bg-[#F5F0E6] text-[#5A5247] hover:text-[#141210] dark:bg-[#0B0F18] dark:text-[#A1AAB9] dark:hover:text-[#F6F2EA] border-[0.75px] border-[#D9CEBC]/60 dark:border-[#D4A85B]/12 hover:border-[#9A6B27]/50 dark:hover:border-[#E8C680]/35'
              }`}
            >
              {locale === 'fa' ? 'همه میزها' : 'All Desks'}
            </button>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`min-h-[40px] px-4 py-2 text-xs sm:text-[13px] font-bold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#141210] text-[#F6F2EA] dark:bg-gradient-to-b dark:from-[#F0D496] dark:to-[#C69546] dark:text-[#080A0F] shadow-sm'
                      : 'bg-[#F5F0E6] text-[#5A5247] hover:text-[#141210] dark:bg-[#0B0F18] dark:text-[#A1AAB9] dark:hover:text-[#F6F2EA] border-[0.75px] border-[#D9CEBC]/60 dark:border-[#D4A85B]/12 hover:border-[#9A6B27]/50 dark:hover:border-[#E8C680]/35'
                  }`}
                >
                  {cat.label[locale]}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t-[0.75px] border-[#D9CEBC]/70 dark:border-[#D4A85B]/14">
            <div className="flex items-center gap-3.5 text-xs overflow-x-auto no-scrollbar pb-0.5">
              <span className="text-[#5A5247] dark:text-[#A1AAB9] font-bold shrink-0">
                {locale === 'fa' ? 'منطقه:' : 'Region:'}
              </span>
              <button
                type="button"
                onClick={() => onSelectRegion('all')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedRegion === 'all'
                    ? 'text-[#9A6B27] dark:text-[#E8C680] font-bold underline underline-offset-4'
                    : 'text-[#5A5247] dark:text-[#A1AAB9] hover:text-[#141210] dark:hover:text-[#F6F2EA]'
                }`}
              >
                {locale === 'fa' ? 'همه مناطق' : 'All Regions'}
              </button>
              {REGIONS.map((reg) => (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => onSelectRegion(reg.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedRegion === reg.id
                      ? 'text-[#9A6B27] dark:text-[#E8C680] font-bold underline underline-offset-4'
                      : 'text-[#5A5247] dark:text-[#A1AAB9] hover:text-[#141210] dark:hover:text-[#F6F2EA]'
                  }`}
                >
                  {reg.label[locale]}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              {hasActiveFilters && mode !== 'home' && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs text-[#9A6B27] dark:text-[#E8C680] hover:underline font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{locale === 'fa' ? 'بازنشانی' : 'Reset'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onToggleSavedOnly}
                className={`inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 text-xs font-bold rounded-xl border-[0.75px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  savedOnly
                    ? 'border-[#9A6B27] bg-[#9A6B27]/12 text-[#9A6B27] dark:border-[#E8C680] dark:bg-[#E8C680]/15 dark:text-[#E8C680]'
                    : 'border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#5A5247] dark:text-[#A1AAB9] hover:text-[#141210] dark:hover:text-[#F6F2EA]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>
                  {locale === 'fa'
                    ? `نشان‌شده‌ها (${formatNumber(bookmarkedIds.length, locale)})`
                    : `Saved (${bookmarkedIds.length})`}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Main 8-Col Magazine Grid/List + 4-Col Side Rail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-8">
            {filteredArticles.length === 0 ? (
              <div className="luxury-panel rounded-2xl py-16 sm:py-20 px-6 sm:px-8 text-center">
                <p className="font-editorial-display text-2xl font-bold text-[#141210] dark:text-[#F6F2EA] mb-3">
                  {locale === 'fa'
                    ? 'خبری با این فیلترها یافت نشد'
                    : 'No stories match the current filters'}
                </p>
                <p className="text-sm text-[#5A5247] dark:text-[#A1AAB9] mb-7">
                  {locale === 'fa'
                    ? 'برای مشاهده تمام روایت‌های تحریریه، فیلترهای فعال را بازنشانی کنید.'
                    : 'Reset active category, region, or saved filters to view all published stories.'}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn-luxury-ink text-xs sm:text-sm"
                >
                  {locale === 'fa' ? 'نمایش همه خبرها' : 'Show All Stories'}
                </button>
              </div>
            ) : mode === 'archive' && archiveLayout === 'list' ? (
              <div className="space-y-6 sm:space-y-7">
                {filteredArticles.slice(0, visibleCount).map((article, idx) => (
                  <MagazineIndexRowCard
                    key={article.id}
                    article={article}
                    locale={locale}
                    index={idx}
                    isSaved={bookmarkedIds.includes(article.id)}
                    onOpen={onOpenArticle}
                    onToggleBookmark={onToggleBookmark}
                  />
                ))}
              </div>
            ) : mode === 'home' && !hasActiveFilters ? (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 lg:gap-8">
                  {filteredArticles.slice(0, Math.min(4, visibleCount)).map((article, idx) => (
                    <MagazineArticleCard
                      key={article.id}
                      article={article}
                      locale={locale}
                      index={idx}
                      isSaved={bookmarkedIds.includes(article.id)}
                      onOpen={onOpenArticle}
                      onToggleBookmark={onToggleBookmark}
                    />
                  ))}
                </div>

                {filteredArticles.length > 4 && visibleCount > 4 && (
                  <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-[11px] font-bold tracking-wider uppercase text-[#8F6321] dark:text-[#ECC983]">
                        {locale === 'fa' ? 'فهرست روزنامه‌ای روایت‌ها' : 'BROADSHEET DISPATCH LEDGER'}
                      </span>
                      <span className="text-xs text-[#5B5246] dark:text-[#A3ADBF] font-mono-tabular">
                        {formatNumber(Math.min(visibleCount, filteredArticles.length) - 4, locale)}
                      </span>
                    </div>
                    <div className="broadsheet-ledger">
                      {filteredArticles.slice(4, visibleCount).map((article, idx) => (
                        <MagazineHairlineRow
                          key={article.id}
                          article={article}
                          locale={locale}
                          index={idx + 4}
                          isSaved={bookmarkedIds.includes(article.id)}
                          onOpen={onOpenArticle}
                          onToggleBookmark={onToggleBookmark}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7 sm:gap-8 lg:gap-10">
                {filteredArticles.slice(0, visibleCount).map((article, idx) => (
                  <MagazineArticleCard
                    key={article.id}
                    article={article}
                    locale={locale}
                    index={idx}
                    isSaved={bookmarkedIds.includes(article.id)}
                    onOpen={onOpenArticle}
                    onToggleBookmark={onToggleBookmark}
                  />
                ))}
              </div>
            )}

            {filteredArticles.length > visibleCount && (
              <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + pageSize)}
                  className="btn-luxury-ink w-full sm:w-auto !px-7 text-xs sm:text-sm"
                >
                  <span>
                    {locale === 'fa'
                      ? `نمایش خبرهای بیشتر (${formatNumber(Math.min(visibleCount, filteredArticles.length), locale)} از ${formatNumber(filteredArticles.length, locale)})`
                      : `Load More Stories (${Math.min(visibleCount, filteredArticles.length)} of ${filteredArticles.length})`}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* 4-Col Refined Side Rail */}
          <aside className="lg:col-span-4 space-y-6 sm:space-y-8">
            <div className="luxury-panel rounded-2xl overflow-hidden">
              <div className="h-[1px] w-full gold-hairline" />
              <div className="p-6 sm:p-7">
                <div className="flex items-center justify-between pb-4 mb-5 border-b-[0.75px] border-[#D9CEBC]/80 dark:border-[#D4A85B]/16">
                  <h3 className="font-editorial-display text-xl font-bold text-[#141210] dark:text-[#F6F2EA]">
                    {locale === 'fa' ? 'پربازدیدترین روایت‌ها' : 'Most Read'}
                  </h3>
                  <span className="text-xs font-mono-tabular text-[#9A6B27] dark:text-[#E8C680]">
                    {locale === 'fa' ? 'برگزیده مخاطبان' : 'Top 05'}
                  </span>
                </div>

                <ol className="divide-y divide-[#D9CEBC]/65 dark:divide-[#D4A85B]/12">
                  {mostRead.map((item, idx) => (
                    <li key={item.id} className="py-4 sm:py-5 first:pt-0 last:pb-0">
                      <button
                        type="button"
                        onClick={() => onOpenArticle(item)}
                        className="group w-full text-start flex items-start gap-4 cursor-pointer"
                      >
                        <span className="font-mono-tabular text-2xl font-light text-[#9A6B27] dark:text-[#E8C680] leading-none pt-1 shrink-0 transition-transform duration-200 group-hover:scale-105">
                          {formatEditorialIndex(idx, locale)}
                        </span>
                        <div className="min-w-0">
                          <p
                            className={`font-editorial-display text-[15px] font-bold text-[#141210] dark:text-[#F6F2EA] group-hover:text-[#9A6B27] dark:group-hover:text-[#E8C680] transition-colors mb-1.5 ${
                              locale === 'fa' ? 'leading-[1.52]' : 'leading-snug'
                            }`}
                          >
                            {item.title[locale]}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#5A5247] dark:text-[#A1AAB9]">
                            <span>{getRegionLabel(item.region, locale)}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">
                              {locale === 'fa'
                                ? `${formatNumber(item.views, locale)} بازدید`
                                : `${formatNumber(item.views, locale)} views`}
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="luxury-panel rounded-2xl p-6 sm:p-7">
              <h3 className="font-editorial-display text-xl font-bold text-[#141210] dark:text-[#F6F2EA] pb-4 mb-5 border-b-[0.75px] border-[#D9CEBC]/80 dark:border-[#D4A85B]/16">
                {locale === 'fa' ? 'خبرهای کوتاه منطقه' : 'Regional Briefs'}
              </h3>

              <ul className="space-y-4 sm:space-y-5">
                {quickDispatches.map((brief) => (
                  <li
                    key={brief.id}
                    className="pb-4 sm:pb-5 last:pb-0 border-b-[0.75px] last:border-b-0 border-[#D9CEBC]/55 dark:border-[#D4A85B]/10"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenArticle(brief)}
                      className="group w-full text-start cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-[11px] text-[#5A5247] dark:text-[#A1AAB9] mb-1.5">
                        <span className="text-[#9A6B27] dark:text-[#E8C680] font-bold">
                          {getCategoryLabel(brief.category, locale)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatShortDate(brief.publishedAt, locale)}</span>
                      </div>
                      <p className="font-editorial-display text-[15px] font-bold text-[#141210] dark:text-[#EDE6D8] group-hover:text-[#9A6B27] dark:group-hover:text-[#E8C680] transition-colors leading-[1.52]">
                        {brief.title[locale]}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="relative overflow-hidden rounded-2xl p-7 sm:p-8 border-[0.75px] border-[#D4A85B]/42 bg-[#0E131E] text-[#F6F2EA] shadow-[0_28px_60px_-26px_rgba(0,0,0,0.72)]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 85% 12%, rgba(212, 168, 91, 0.24), transparent 55%)',
              }}
            >
              <div className="absolute inset-3 rounded-xl border-[0.5px] border-[#D4A85B]/22 pointer-events-none" />
              <div className="relative z-10">
                <p className="text-xs font-bold text-[#F0D496] mb-2.5">
                  {locale === 'fa' ? 'میز شهروندخبرنگار جنوب کرمان' : 'Citizen Journalism Salon'}
                </p>
                <h4
                  className={`font-editorial-display text-2xl font-bold text-[#FDFBF7] mb-3.5 ${
                    locale === 'fa' ? 'leading-[1.45]' : 'leading-snug'
                  }`}
                >
                  {locale === 'fa'
                    ? 'از دل منطقه، برای آینده منطقه.'
                    : 'From the heart of the region, for its future.'}
                </h4>
                <p className="text-sm text-[#EDE6D8]/84 leading-[1.85] mb-7">
                  {locale === 'fa'
                    ? 'رویداد، مطالبه روستایی یا گزارش تصویری از ساردوئیه، جیرفت و شهرهای اطراف دارید؟ مستقیم به تحریریه بفرستید.'
                    : 'Share a field report, civic observation, or photograph from Sarduiyeh, Jiroft, and nearby towns directly with our editors.'}
                </p>
                <button
                  type="button"
                  onClick={onGoToSubmit}
                  className="btn-luxury-gold w-full sm:w-auto text-xs sm:text-[13px]"
                >
                  <span>{locale === 'fa' ? 'ارسال گزارش مردمی' : 'Submit a Field Report'}</span>
                  {locale === 'fa' ? (
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                  ) : (
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  )}
                </button>
              </div>
            </div>
          </aside>
        </div>
        </div>
      </section>
    </div>
  );
}
