import { useMemo, useState } from 'react';
import { ChevronDown, RotateCcw, Search, X } from 'lucide-react';
import { CATEGORIES, REGIONS } from '../data/initialData';
import type { Article, CategoryId, Locale, RegionId } from '../types/news';
import { formatNumber, getCategoryLabel, getRegionLabel } from '../utils/formatters';
import { MagazineArticleCard } from './MagazineCards';

interface SearchPageViewProps {
  articles: Article[];
  locale: Locale;
  initialQuery?: string;
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
  onOpenArticle: (article: Article) => void;
}

export function SearchPageView({
  articles,
  locale,
  initialQuery = '',
  bookmarkedIds,
  onToggleBookmark,
  onOpenArticle,
}: SearchPageViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryId | 'all'>('all');
  const [region, setRegion] = useState<RegionId | 'all'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [visibleCount, setVisibleCount] = useState(12);

  const published = useMemo(
    () => articles.filter((a) => a.status === 'published'),
    [articles]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return published
      .filter((item) => {
        if (category !== 'all' && item.category !== category) return false;
        if (region !== 'all' && item.region !== region) return false;
        if (!q) return true;
        const haystack = [
          item.title.fa,
          item.title.en,
          item.deck.fa,
          item.deck.en,
          item.author.fa,
          item.author.en,
          getCategoryLabel(item.category, 'fa'),
          getCategoryLabel(item.category, 'en'),
          getRegionLabel(item.region, 'fa'),
          getRegionLabel(item.region, 'en'),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) =>
        sortBy === 'popular'
          ? b.views - a.views
          : new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
  }, [published, query, category, region, sortBy]);

  const hasFilters = Boolean(query.trim()) || category !== 'all' || region !== 'all';

  return (
    <div className="w-full">
      <section
        className="w-full border-b-[0.5px] border-[#D9CEBC]/80 dark:border-[#D4A85B]/18 bg-[#07090E] text-[#F6F2EA]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 75% 20%, rgba(212, 168, 91, 0.18), transparent 52%)',
        }}
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
          <p className="text-xs font-bold text-[#F0D496] mb-3">
            {locale === 'fa' ? 'موتور جست‌وجوی تحریریه نبض ساردو' : 'Nabz Sardo Editorial Search'}
          </p>
          <h1
            className={`font-editorial-display text-3xl sm:text-5xl font-bold text-[#FDFBF7] mb-7 ${
              locale === 'fa' ? 'leading-[1.4]' : 'leading-tight'
            }`}
          >
            {locale === 'fa'
              ? 'جست‌وجو در آرشیو و روایت‌های جنوب کرمان'
              : 'Search Across All Regional Dispatches'}
          </h1>

          {/* Sculpted Full-Width Search Input */}
          <div className="max-w-3xl relative">
            <Search className="w-5 h-5 text-[#F0D496] absolute top-1/2 -translate-y-1/2 start-5 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(12);
              }}
              placeholder={
                locale === 'fa'
                  ? 'کلیدواژه، نام منطقه، خبرنگار یا موضوع خبر را بنویسید...'
                  : 'Search headlines, regions, reporters, or topics...'
              }
              className="w-full min-h-[56px] ps-13 pe-12 py-4 rounded-[18px] bg-[#111624]/90 backdrop-blur-xl border-[0.5px] border-[#F5F1E8]/22 text-sm sm:text-base text-[#FDFBF7] placeholder:text-[#A1AAB9] focus:outline-none focus:border-[#E8C680] shadow-[0_20px_50px_-24px_rgba(0,0,0,0.8)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={locale === 'fa' ? 'پاک کردن جستجو' : 'Clear search'}
                className="absolute top-1/2 -translate-y-1/2 end-4 p-1.5 text-[#A1AAB9] hover:text-[#FDFBF7] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="luxury-panel rounded-[20px] p-5 sm:p-6 mb-10 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryId | 'all')}
              aria-label={locale === 'fa' ? 'فیلتر دسته‌بندی' : 'Filter by category'}
              className="flex-1 min-h-[42px] px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#0B0F18] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA]"
            >
              <option value="all">{locale === 'fa' ? 'همه میزهای خبری' : 'All Desks'}</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label[locale]}
                </option>
              ))}
            </select>

            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as RegionId | 'all')}
              aria-label={locale === 'fa' ? 'فیلتر منطقه' : 'Filter by region'}
              className="flex-1 min-h-[42px] px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#0B0F18] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA]"
            >
              <option value="all">{locale === 'fa' ? 'همه مناطق' : 'All Regions'}</option>
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label[locale]}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-7 flex flex-wrap items-center justify-between md:justify-end gap-4">
            <div className="inline-flex rounded-xl border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 bg-[#F5F0E6]/70 dark:bg-[#0B0F18] p-1">
              <button
                type="button"
                onClick={() => setSortBy('latest')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortBy === 'latest'
                    ? 'bg-[#141210] text-[#F6F2EA] dark:bg-gradient-to-b dark:from-[#F0D496] dark:to-[#C69546] dark:text-[#080A0F]'
                    : 'text-[#5A5247] dark:text-[#A1AAB9]'
                }`}
              >
                {locale === 'fa' ? 'جدیدترین' : 'Latest'}
              </button>
              <button
                type="button"
                onClick={() => setSortBy('popular')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortBy === 'popular'
                    ? 'bg-[#141210] text-[#F6F2EA] dark:bg-gradient-to-b dark:from-[#F0D496] dark:to-[#C69546] dark:text-[#080A0F]'
                    : 'text-[#5A5247] dark:text-[#A1AAB9]'
                }`}
              >
                {locale === 'fa' ? 'پربازدیدترین' : 'Most Read'}
              </button>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-[#5A5247] dark:text-[#A1AAB9]">
              <span className="tabular-nums font-semibold">
                {locale === 'fa'
                  ? `${formatNumber(matches.length, locale)} نتیجه`
                  : `${matches.length} results`}
              </span>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setCategory('all');
                    setRegion('all');
                  }}
                  className="inline-flex items-center gap-1 font-bold text-[#9A6B27] dark:text-[#E8C680] hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{locale === 'fa' ? 'پاک‌سازی' : 'Reset'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="luxury-panel rounded-[24px] py-20 px-6 text-center">
            <p className="font-editorial-display text-2xl font-bold text-[#141210] dark:text-[#F6F2EA] mb-3">
              {locale === 'fa' ? 'خبری مطابق با جست‌وجوی شما یافت نشد' : 'No matching stories found'}
            </p>
            <p className="text-sm text-[#5A5247] dark:text-[#A1AAB9] mb-6">
              {locale === 'fa'
                ? 'واژه دیگری را امتحان کنید یا فیلتر منطقه و میز خبری را تغییر دهید.'
                : 'Try broader keywords or reset the regional and desk filters.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('all');
                setRegion('all');
              }}
              className="btn-luxury-ink text-xs sm:text-sm"
            >
              {locale === 'fa' ? 'نمایش تمام خبرها' : 'Show All Stories'}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 sm:gap-8">
              {matches.slice(0, visibleCount).map((article, idx) => (
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

            {matches.length > visibleCount && (
              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="btn-luxury-ink !px-7 text-xs sm:text-sm"
                >
                  <span>
                    {locale === 'fa'
                      ? `نمایش نتایج بیشتر (${formatNumber(visibleCount, locale)} از ${formatNumber(matches.length, locale)})`
                      : `Load More (${visibleCount} of ${matches.length})`}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
