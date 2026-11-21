import { useEffect, useState } from 'react';
import { ChevronDown, MapPin, RotateCcw } from 'lucide-react';
import { CATEGORIES, EDITORIAL_IMAGES, REGIONS } from '../data/initialData';
import type { Article, CategoryId, Locale, RegionId } from '../types/news';
import { formatNumber, getRegionLabel } from '../utils/formatters';
import { MagazineArticleCard, MagazineLeadCard } from './MagazineCards';

interface RegionsViewProps {
  articles: Article[];
  locale: Locale;
  selectedRegion: RegionId | 'all';
  onSelectRegion: (region: RegionId | 'all') => void;
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
  onOpenArticle: (article: Article) => void;
}

const REGION_PROFILES: Record<
  RegionId,
  {
    elevation: { fa: string; en: string };
    focus: { fa: string; en: string };
    image: string;
  }
> = {
  sarduiyeh: {
    elevation: { fa: 'ارتفاعات ۲۶۰۰ متری · بخش کوهستانی', en: '2,600m Highlands · Mountain District' },
    focus: {
      fa: 'گزارش‌های میدانی از بخش ساردوئیه، دلفارد، راه‌های مواصلاتی، باغات سردسیری و مطالبات روستایی.',
      en: 'Field reporting from Sarduiyeh, Delfard, mountain roads, highland orchards, and village infrastructure.',
    },
    image: EDITORIAL_IMAGES.sarduiyehHighlands,
  },
  jiroft: {
    elevation: { fa: 'مرکز اقتصادی و کشاورزی جنوب کرمان', en: 'Agricultural & Civic Hub of South Kerman' },
    focus: {
      fa: 'پوشش تحلیلی اقتصاد کشاورزی، شهرسازی، دانشگاه‌ها، میراث تمدنی هلیل‌رود و رویدادهای شهرستان جیرفت.',
      en: 'Analytical coverage of agro-economics, urban life, universities, Halil Rud heritage, and Jiroft civic affairs.',
    },
    image: EDITORIAL_IMAGES.jiroftAgriculture,
  },
  anbarabad: {
    elevation: { fa: 'دشت حاصلخیز و نخلستان‌های جنوب', en: 'Fertile Plains & Palm Groves' },
    focus: {
      fa: 'روایت‌های کشاورزی، مدیریت آب، پروژه‌های عمرانی و مسائل اجتماعی شهرستان عنبرآباد.',
      en: 'Reporting on farming, water stewardship, public works, and community affairs across Anbarabad.',
    },
    image: EDITORIAL_IMAGES.kermanHeritage,
  },
  kahnuj: {
    elevation: { fa: 'دروازه ارتباطی جنوب استان', en: 'Southern Regional Gateway' },
    focus: {
      fa: 'اخبار معدن، حمل‌ونقل، آموزش و توسعه‌یافتگی در شهرستان کهنوج و مناطق همجوار.',
      en: 'Dispatches covering mining, transit corridors, education, and development in Kahnuj.',
    },
    image: EDITORIAL_IMAGES.mountainWeather,
  },
  'south-kerman': {
    elevation: { fa: 'پهنه هفت شهرستان جنوب کرمان', en: 'Greater South Kerman Region' },
    focus: {
      fa: 'پرونده‌های کلان منطقه‌ای، زیرساخت‌های استانی، اقلیم، فرهنگ و سیاست‌گذاری توسعه جنوب کرمان.',
      en: 'Macro regional dossiers, infrastructure, climate, culture, and policy shaping all of South Kerman.',
    },
    image: EDITORIAL_IMAGES.communityCulture,
  },
};

export function RegionsView({
  articles,
  locale,
  selectedRegion,
  onSelectRegion,
  bookmarkedIds,
  onToggleBookmark,
  onOpenArticle,
}: RegionsViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    setVisibleCount(10);
  }, [selectedRegion, categoryFilter]);

  const published = articles.filter((a) => a.status === 'published');
  const regionFiltered = published.filter((article) => {
    if (selectedRegion !== 'all' && article.region !== selectedRegion) return false;
    if (categoryFilter !== 'all' && article.category !== categoryFilter) return false;
    return true;
  });

  const activeProfile = selectedRegion !== 'all' ? REGION_PROFILES[selectedRegion] : null;
  const leadStory = regionFiltered[0];
  const restStories = leadStory ? regionFiltered.slice(1) : [];

  return (
    <div className="w-full">
      {/* Cinematic Regional Masthead */}
      <section
        className="w-full border-b-[0.5px] border-[#D9CEBC]/80 dark:border-[#D4A85B]/18 bg-[#07090E] text-[#F6F2EA]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 22% 18%, rgba(212, 168, 91, 0.18), transparent 52%)',
        }}
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
          <div className="max-w-3xl mb-10 sm:mb-12">
            <p className="inline-flex items-center gap-2 text-xs font-bold text-[#F0D496] mb-3">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {locale === 'fa' ? 'دفاتر و پوشش جغرافیایی نبض ساردو' : 'Nabz Sardo Regional Bureaus'}
              </span>
            </p>
            <h1
              className={`font-editorial-display text-3xl sm:text-5xl font-bold text-[#FDFBF7] mb-4 ${
                locale === 'fa' ? 'leading-[1.4]' : 'leading-tight'
              }`}
            >
              {selectedRegion !== 'all'
                ? locale === 'fa'
                  ? `اخبار و روایت‌های ${getRegionLabel(selectedRegion, 'fa')}`
                  : `${getRegionLabel(selectedRegion, 'en')} Bureau`
                : locale === 'fa'
                  ? 'نقشه خبری جنوب کرمان'
                  : 'South Kerman Regional Coverage'}
            </h1>
            <p className="text-sm sm:text-base text-[#EDE6D8]/82 leading-[1.88]">
              {activeProfile
                ? activeProfile.focus[locale]
                : locale === 'fa'
                  ? 'انتخاب هر منطقه برای دسترسی متمرکز به گزارش‌های میدانی، مطالبات محلی و پرونده‌های اختصاصی همان شهرستان.'
                  : 'Select any regional bureau below for focused field reporting, civic dispatches, and local investigations.'}
            </p>
          </div>

          {/* Interactive Regional Bureau Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            <button
              type="button"
              onClick={() => onSelectRegion('all')}
              className={`text-start rounded-[18px] p-4 sm:p-5 border-[0.5px] backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer hover:-translate-y-0.5 ${
                selectedRegion === 'all'
                  ? 'bg-[#171F32]/92 border-[#E8C680] shadow-[0_18px_36px_-18px_rgba(212,168,91,0.5)]'
                  : 'bg-[#10141F]/74 border-[#F5F1E8]/14 hover:border-[#E8C680]/45 hover:bg-[#141B2B]/86'
              }`}
            >
              <p className="text-[11px] font-mono-tabular text-[#F0D496] mb-2">
                {locale === 'fa'
                  ? `${formatNumber(published.length, locale)} خبر`
                  : `${published.length} stories`}
              </p>
              <p className="font-editorial-display text-[15px] sm:text-base font-bold text-[#FDFBF7]">
                {locale === 'fa' ? 'همه مناطق' : 'All Regions'}
              </p>
            </button>

            {REGIONS.map((reg) => {
              const count = published.filter((a) => a.region === reg.id).length;
              const active = selectedRegion === reg.id;
              return (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => onSelectRegion(reg.id)}
                  className={`text-start rounded-[18px] p-4 sm:p-5 border-[0.5px] backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer hover:-translate-y-0.5 ${
                    active
                      ? 'bg-[#171F32]/92 border-[#E8C680] shadow-[0_18px_36px_-18px_rgba(212,168,91,0.5)]'
                      : 'bg-[#10141F]/74 border-[#F5F1E8]/14 hover:border-[#E8C680]/45 hover:bg-[#141B2B]/86'
                  }`}
                >
                  <p className="text-[11px] font-mono-tabular text-[#F0D496] mb-2">
                    {locale === 'fa'
                      ? `${formatNumber(count, locale)} خبر`
                      : `${count} stories`}
                  </p>
                  <p className="font-editorial-display text-[15px] sm:text-base font-bold text-[#FDFBF7]">
                    {reg.label[locale]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Regional Feed Body */}
      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20">
        {/* Category Refinement Strip */}
        <div className="luxury-panel rounded-[20px] p-4 sm:p-5 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-[#141210] text-[#F6F2EA] dark:bg-gradient-to-b dark:from-[#F0D496] dark:to-[#C69546] dark:text-[#080A0F]'
                  : 'text-[#5A5247] dark:text-[#A1AAB9] hover:text-[#141210] dark:hover:text-[#F6F2EA]'
              }`}
            >
              {locale === 'fa' ? 'همه موضوعات' : 'All Topics'}
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-[#141210] text-[#F6F2EA] dark:bg-gradient-to-b dark:from-[#F0D496] dark:to-[#C69546] dark:text-[#080A0F]'
                    : 'text-[#5A5247] dark:text-[#A1AAB9] hover:text-[#141210] dark:hover:text-[#F6F2EA]'
                }`}
              >
                {cat.label[locale]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-[#5A5247] dark:text-[#A1AAB9] shrink-0">
            <span className="tabular-nums font-medium">
              {locale === 'fa'
                ? `${formatNumber(regionFiltered.length, locale)} روایت`
                : `${regionFiltered.length} stories`}
            </span>
            {(selectedRegion !== 'all' || categoryFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  onSelectRegion('all');
                  setCategoryFilter('all');
                }}
                className="inline-flex items-center gap-1 font-bold text-[#9A6B27] dark:text-[#E8C680] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{locale === 'fa' ? 'بازنشانی' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        {regionFiltered.length === 0 ? (
          <div className="luxury-panel rounded-[24px] py-16 px-6 text-center">
            <p className="font-editorial-display text-2xl font-bold text-[#141210] dark:text-[#F6F2EA] mb-3">
              {locale === 'fa'
                ? 'در این منطقه و موضوع هنوز خبری ثبت نشده است'
                : 'No dispatches published for this selection yet'}
            </p>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className="btn-luxury-ink mt-4 text-xs sm:text-sm"
            >
              {locale === 'fa' ? 'نمایش تمام خبرهای منطقه' : 'View All Regional Stories'}
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {leadStory && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-9 items-stretch">
                <MagazineLeadCard
                  article={leadStory}
                  locale={locale}
                  isSaved={bookmarkedIds.includes(leadStory.id)}
                  onOpen={onOpenArticle}
                  onToggleBookmark={onToggleBookmark}
                />

                <div className="lg:col-span-5 luxury-panel rounded-[26px] p-7 sm:p-9 flex flex-col justify-between gap-6">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-[#9A6B27] dark:text-[#E8C680]">
                      {locale === 'fa' ? 'شناسنامه دفتر منطقه‌ای' : 'Bureau Brief'}
                    </p>
                    <h2 className="font-editorial-display text-2xl sm:text-3xl font-bold text-[#141210] dark:text-[#F6F2EA] leading-[1.42]">
                      {selectedRegion !== 'all'
                        ? getRegionLabel(selectedRegion, locale)
                        : locale === 'fa'
                          ? 'پهنه کامل جنوب کرمان'
                          : 'Greater South Kerman'}
                    </h2>
                    <p className="text-xs font-medium text-[#9A6B27] dark:text-[#E8C680]">
                      {activeProfile
                        ? activeProfile.elevation[locale]
                        : locale === 'fa'
                          ? 'ساردوئیه · جیرفت · عنبرآباد · کهنوج'
                          : 'Sarduiyeh · Jiroft · Anbarabad · Kahnuj'}
                    </p>
                    <p className="text-sm text-[#5A5247] dark:text-[#A1AAB9] leading-[1.9]">
                      {activeProfile
                        ? activeProfile.focus[locale]
                        : locale === 'fa'
                          ? 'تمامی گزارش‌های میدانی، مطالبات عمرانی، کشاورزی و تحولات اجتماعی پنج محور اصلی جنوب استان کرمان در یک نمای یکپارچه.'
                          : 'Unified editorial view across all five core districts of South Kerman Province.'}
                    </p>
                  </div>

                  <div className="pt-5 border-t-[0.5px] border-[#D9CEBC]/80 dark:border-[#D4A85B]/16 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[#5A5247] dark:text-[#A1AAB9] mb-1">
                        {locale === 'fa' ? 'خبرهای منتشرشده' : 'Published'}
                      </p>
                      <p className="font-mono-tabular text-2xl font-bold text-[#141210] dark:text-[#F6F2EA]">
                        {formatNumber(regionFiltered.length, locale)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#5A5247] dark:text-[#A1AAB9] mb-1">
                        {locale === 'fa' ? 'مجموع بازدید' : 'Total Reads'}
                      </p>
                      <p className="font-mono-tabular text-2xl font-bold text-[#9A6B27] dark:text-[#E8C680]">
                        {formatNumber(
                          regionFiltered.reduce((sum, item) => sum + item.views, 0),
                          locale
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {restStories.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 sm:gap-8">
                {restStories.slice(0, visibleCount).map((article, idx) => (
                  <MagazineArticleCard
                    key={article.id}
                    article={article}
                    locale={locale}
                    index={idx + 1}
                    isSaved={bookmarkedIds.includes(article.id)}
                    onOpen={onOpenArticle}
                    onToggleBookmark={onToggleBookmark}
                  />
                ))}
              </div>
            )}

            {restStories.length > visibleCount && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 9)}
                  className="btn-luxury-ink !px-7 text-xs sm:text-sm"
                >
                  <span>
                    {locale === 'fa'
                      ? `نمایش خبرهای بیشتر (${formatNumber(visibleCount, locale)} از ${formatNumber(restStories.length, locale)})`
                      : `Load More (${visibleCount} of ${restStories.length})`}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
