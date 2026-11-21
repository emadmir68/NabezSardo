import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from 'lucide-react';
import type { Article, Locale } from '../types/news';
import {
  formatNumber,
  formatShortDate,
  getCategoryLabel,
  getRegionLabel,
} from '../utils/formatters';
import { EditorialImage } from './EditorialImage';
import { EDITORIAL_IMAGES } from '../data/initialData';

interface LiveHeroProps {
  slides: Article[];
  breakingArticles: Article[];
  locale: Locale;
  bookmarkedIds: string[];
  onOpenArticle: (article: Article) => void;
  onToggleBookmark: (id: string) => void;
}

const SLIDE_DURATION_MS = 7800;

// Use a clearly labelled regional archive photograph for auto-generated icon
// covers. Genuine uploaded news photographs are never replaced.
function heroCover(article: Article): string {
  const source=article.coverImage||'';
  if(!/\/uploads\/auto-cover-[^/?]+\.svg(?:\?|$)/i.test(source))return source;
  if(article.category==='agriculture')return EDITORIAL_IMAGES.jiroftAgriculture;
  if(article.category==='weather')return EDITORIAL_IMAGES.mountainWeather;
  if(article.category==='culture')return EDITORIAL_IMAGES.kermanHeritage;
  if(article.category==='social'||article.category==='opinion')return EDITORIAL_IMAGES.communityCulture;
  return EDITORIAL_IMAGES.sarduiyehHighlands;
}
function hasArchiveCover(article: Article): boolean {
  return /\/uploads\/auto-cover-[^/?]+\.svg(?:\?|$)/i.test(article.coverImage||'');
}

export function LiveHero({
  slides,
  breakingArticles,
  locale,
  bookmarkedIds,
  onOpenArticle,
  onToggleBookmark,
}: LiveHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [wireIndex, setWireIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const safeSlides = slides.length > 0 ? slides : [];
  const currentIndex = safeSlides.length > 0 ? activeIndex % safeSlides.length : 0;
  const activeSlide = safeSlides[currentIndex];

  useEffect(() => {
    if (safeSlides.length <= 1 || isPaused) return;
    const stepMs = 50;
    const increment = (stepMs / SLIDE_DURATION_MS) * 100;

    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev + increment >= 100) {
          setActiveIndex((idx) => (idx + 1) % safeSlides.length);
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => window.clearInterval(interval);
  }, [safeSlides.length, isPaused, currentIndex]);

  useEffect(() => {
    if (breakingArticles.length <= 1) return;
    const wireTimer = window.setInterval(() => {
      setWireIndex((prev) => (prev + 1) % breakingArticles.length);
    }, 5200);
    return () => window.clearInterval(wireTimer);
  }, [breakingArticles.length]);

  if (!activeSlide) return null;

  const isBookmarked = bookmarkedIds.includes(activeSlide.id);

  const goToSlide = (idx: number) => {
    setActiveIndex(idx);
    setProgress(0);
  };

  const handleNext = () => goToSlide((currentIndex + 1) % safeSlides.length);
  const handlePrev = () =>
    goToSlide((currentIndex - 1 + safeSlides.length) % safeSlides.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || safeSlides.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 42) return;
    if (locale === 'fa') {
      if (delta > 0) handleNext();
      else handlePrev();
    } else {
      if (delta < 0) handleNext();
      else handlePrev();
    }
  };

  const currentWire = breakingArticles[wireIndex % Math.max(1, breakingArticles.length)];

  return (
    <section
      aria-label={locale === 'fa' ? 'هیرو زنده اخبار برگزیده' : 'Live featured stories hero'}
      className="relative w-full bg-[#06080D] text-[#F6F2EA] overflow-hidden border-b-[0.75px] border-[#D4A85B]/25"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative min-h-[72svh] lg:min-h-[80vh] flex flex-col justify-between">
        {/* Full-Bleed Animated Editorial Cinema Backdrop */}
        <div className="absolute inset-0 overflow-hidden">
          {safeSlides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
                  isActive ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none -z-10'
                }`}
              >
                <div
                  key={`${slide.id}-${isActive ? 'live' : 'idle'}`}
                  className={`w-full h-full ${isActive && !isPaused ? 'animate-ken-burns' : ''}`}
                >
                  <EditorialImage
                    src={heroCover(slide)}
                    alt={slide.title[locale]}
                    fallbackLabel={slide.title[locale]}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>
            );
          })}

          {/* Multi-layer Cinema Scrim for Razor-Sharp Persian/English Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#06080D] via-[#06080D]/68 to-[#06080D]/32 z-10" />
          <div
            className={`absolute inset-0 z-10 ${
              locale === 'fa'
                ? 'bg-gradient-to-l from-[#06080D]/88 via-[#06080D]/42 to-[#06080D]/35'
                : 'bg-gradient-to-r from-[#06080D]/88 via-[#06080D]/42 to-[#06080D]/35'
            }`}
          />
          <div
            className="absolute inset-0 z-10 opacity-50 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 20% 18%, rgba(212, 168, 91, 0.22), transparent 46%)',
            }}
          />
          <div className="absolute inset-0 editorial-grain opacity-30 z-10 pointer-events-none" />
        </div>

        {/* Top Editorial Masthead Bar inside Hero */}
        <div className="relative z-20 max-w-[1380px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-9 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 text-xs sm:text-[13px] text-[#EDE6D8]/92 min-w-0">
            <span className="font-mono-tabular text-[#F0D496] font-semibold tracking-wider shrink-0">
              {locale === 'fa' ? 'خبرهای برگزیده' : 'Featured Stories'}
            </span>
            <span aria-hidden="true" className="w-5 sm:w-8 h-[0.75px] bg-[#E8C680]/60 shrink-0" />
            <span className="font-bold text-[#F0D496] truncate">
              {getCategoryLabel(activeSlide.category, locale)}
            </span>
            {hasArchiveCover(activeSlide)&&(
              <span className="hidden sm:inline text-[10px] text-[#F0D496]/65 whitespace-nowrap">
                {locale==='fa'?'تصویر آرشیوی منطقه':'Regional archive photo'}
              </span>
            )}
            <span aria-hidden="true" className="opacity-40 shrink-0">·</span>
            <span className="truncate text-[#EDE6D8]/85">
              {getRegionLabel(activeSlide.region, locale)}
            </span>
          </div>

          {safeSlides.length > 1 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className="btn-icon-luxury !w-9 !h-9 sm:!w-10 sm:!h-10 !bg-[#080B12]/55 !border-[#F5F1E8]/20 !text-[#F6F2EA] hover:!border-[#E8C680] hover:!text-[#F0D496]"
                aria-label={
                  isPaused
                    ? locale === 'fa'
                      ? 'ادامه پخش خودکار اسلایدر'
                      : 'Resume live slideshow'
                    : locale === 'fa'
                      ? 'توقف پخش خودکار اسلایدر'
                      : 'Pause live slideshow'
                }
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handlePrev}
                className="btn-icon-luxury !w-9 !h-9 sm:!w-10 sm:!h-10 !bg-[#080B12]/55 !border-[#F5F1E8]/20 !text-[#F6F2EA] hover:!border-[#E8C680] hover:!text-[#F0D496]"
                aria-label={locale === 'fa' ? 'خبر ویژه قبلی' : 'Previous featured story'}
              >
                {locale === 'fa' ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="btn-icon-luxury !w-9 !h-9 sm:!w-10 sm:!h-10 !bg-[#080B12]/55 !border-[#F5F1E8]/20 !text-[#F6F2EA] hover:!border-[#E8C680] hover:!text-[#F0D496]"
                aria-label={locale === 'fa' ? 'خبر ویژه بعدی' : 'Next featured story'}
              >
                {locale === 'fa' ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Asymmetric Luxury Magazine Cover Stage */}
        <div className="relative z-20 max-w-[1380px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12 lg:py-14 my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-end">
            {/* Primary Cover Headline & Sculpted CTA Stage (8 cols) */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.44, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-[48rem]"
                >
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-[13px] text-[#EDE6D8]/85 mb-4 sm:mb-5">
                    <span className="font-semibold text-[#FDFBF7]">{activeSlide.author[locale]}</span>
                    <span aria-hidden="true" className="text-[#E8C680]/60">·</span>
                    <span>{formatShortDate(activeSlide.publishedAt, locale)}</span>
                    <span aria-hidden="true" className="text-[#E8C680]/60">·</span>
                    <span className="tabular-nums">
                      {locale === 'fa'
                        ? `${formatNumber(activeSlide.readTimeMin, locale)} دقیقه مطالعه`
                        : `${activeSlide.readTimeMin} min read`}
                    </span>
                  </div>

                  <h1
                    className={`font-editorial-display font-bold text-[#FDFBF7] mb-4 sm:mb-6 drop-shadow-[0_6px_28px_rgba(0,0,0,0.6)] ${
                      locale === 'fa' ? 'leading-[1.38] sm:leading-[1.34]' : 'leading-[1.12]'
                    }`}
                    style={{
                      fontSize:
                        locale === 'fa'
                          ? 'clamp(1.5rem, 3vw, 2.8rem)'
                          : 'clamp(2.1rem, 4.8vw, 4.1rem)',
                    }}
                  >
                    {activeSlide.title[locale]}
                  </h1>

                  <p className="text-[14.5px] sm:text-[17px] text-[#EDE6D8]/90 leading-[1.85] max-w-2xl mb-7 sm:mb-9 line-clamp-3 sm:line-clamp-none">
                    {activeSlide.deck[locale]}
                  </p>

                  {/* Sculpted Luxury CTA Pair — Full Ergonomics on Mobile & Desktop */}
                  <div className="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => onOpenArticle(activeSlide)}
                      className="btn-luxury-gold text-[13.5px] sm:text-sm !px-7 !py-3.5"
                    >
                      <span>{locale === 'fa' ? 'مطالعه روایت کامل' : 'Read Cover Story'}</span>
                      {locale === 'fa' ? (
                        <ArrowLeft className="w-4 h-4 shrink-0" />
                      ) : (
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleBookmark(activeSlide.id)}
                      className="btn-luxury-glass text-[13.5px] sm:text-sm !px-5 !py-3.5"
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 text-[#F0D496]" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                      <span>
                        {isBookmarked
                          ? locale === 'fa'
                            ? 'ذخیره در فهرست'
                            : 'Saved'
                          : locale === 'fa'
                            ? 'نشان‌کردن خبر'
                            : 'Save Story'}
                      </span>
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop Floating Frosted-Glass Edition Cover Index (4 cols) */}
            {safeSlides.length > 1 && (
              <div className="hidden lg:block lg:col-span-4">
                <div className="rounded-2xl bg-[#090D16]/68 backdrop-blur-2xl border-[0.75px] border-[#F5F1E8]/14 shadow-[0_32px_70px_-28px_rgba(0,0,0,0.88)] overflow-hidden">
                  <div className="px-5 py-3.5 border-b-[0.75px] border-[#F5F1E8]/10 flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-[0.06em] text-[#F0D496]">
                      {locale === 'fa' ? 'فهرست جلد شماره زنده' : 'LIVE COVER EDITION'}
                    </span>
                    <span className="font-mono-tabular text-[11px] text-[#A1AAB9]">
                      {locale === 'fa' ? 'روایت‌های برگزیده' : 'Featured Stories'}
                    </span>
                  </div>

                  <div className="divide-y divide-[#F5F1E8]/8">
                    {safeSlides.slice(0, 4).map((slide, idx) => {
                      const isSelected = idx === currentIndex;
                      return (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => goToSlide(idx)}
                          className={`group relative w-full text-start p-4 flex items-center gap-3.5 transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-[#171F32]/75'
                              : 'hover:bg-[#131929]/55'
                          }`}
                        >
                          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border-[0.75px] border-[#F5F1E8]/16">
                            <EditorialImage
                              src={heroCover(slide)}
                              alt={slide.title[locale]}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[11px] mb-1">
                              <span className="font-mono-tabular font-semibold text-[#F0D496]">
                                {getRegionLabel(slide.region, locale)}
                              </span>
                              <span aria-hidden="true" className="opacity-35">·</span>
                              <span className="text-[#EDE6D8]/70 truncate">
                                {getCategoryLabel(slide.category, locale)}
                              </span>
                            </div>
                            <p
                              className={`font-editorial-display text-[14.5px] font-bold line-clamp-2 leading-[1.45] transition-colors ${
                                isSelected
                                  ? 'text-[#FDFBF7]'
                                  : 'text-[#EDE6D8]/78 group-hover:text-[#F0D496]'
                              }`}
                            >
                              {slide.title[locale]}
                            </p>
                          </div>

                          {/* Active Champagne Reading Bar */}
                          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#F5F1E8]/8">
                            <div
                              className="h-full bg-gradient-to-r from-[#C69546] via-[#F0D496] to-[#E8C680] transition-[width] duration-75 ease-linear"
                              style={{
                                width: isSelected ? `${progress}%` : idx < currentIndex ? '100%' : '0%',
                              }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile & Tablet Horizontal Snap-Scroll Chapter Rail (Zero Vertical Bloat!) */}
          {safeSlides.length > 1 && (
            <div className="lg:hidden mt-8 -mx-4 px-4 flex items-stretch gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1">
              {safeSlides.slice(0, 4).map((slide, idx) => {
                const isSelected = idx === currentIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    className={`snap-start w-[240px] sm:w-[270px] shrink-0 text-start rounded-xl p-3 backdrop-blur-xl border-[0.75px] transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#141B2B]/88 border-[#E8C680]/70 shadow-[0_14px_30px_-14px_rgba(0,0,0,0.85)]'
                        : 'bg-[#090D16]/62 border-[#F5F1E8]/14'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border-[0.75px] border-[#F5F1E8]/15">
                        <EditorialImage
                          src={heroCover(slide)}
                          alt={slide.title[locale]}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10.5px] text-[#F0D496] font-mono-tabular mb-0.5">
                          <span>{getRegionLabel(slide.region, locale)}</span>
                          <span aria-hidden="true" className="opacity-40">·</span>
                          <span className="font-sans text-[#EDE6D8]/75 truncate">
                            {getCategoryLabel(slide.category, locale)}
                          </span>
                        </div>
                        <p className="font-editorial-display text-[13px] font-bold text-[#FDFBF7] line-clamp-2 leading-[1.4]">
                          {slide.title[locale]}
                        </p>
                      </div>
                    </div>

                    <div className="w-full h-[2px] bg-[#F5F1E8]/12 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#C69546] to-[#F3D79A] transition-[width] duration-75 ease-linear"
                        style={{
                          width: isSelected ? `${progress}%` : idx < currentIndex ? '100%' : '0%',
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sleek Animated Live Editorial Dispatch Wire */}
        {currentWire && (
          <div className="relative z-20 border-t-[0.75px] border-[#D4A85B]/22 bg-[#04060A]/94 backdrop-blur-2xl">
            <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-3.5 flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                <span className="text-[11px] sm:text-xs font-bold text-[#F0D496] whitespace-nowrap shrink-0">
                  {locale === 'fa' ? 'خط فوری تحریریه' : 'Live Desk Wire'}
                </span>
                <span aria-hidden="true" className="h-3.5 w-[0.75px] bg-[#D4A85B]/40 shrink-0" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.button
                      key={currentWire.id}
                      type="button"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      onClick={() => onOpenArticle(currentWire)}
                      className="block w-full text-xs sm:text-[13.5px] font-medium text-[#F6F2EA]/94 hover:text-[#F0D496] truncate transition-colors text-start cursor-pointer"
                    >
                      {currentWire.title[locale]}
                    </motion.button>
                  </AnimatePresence>
                </div>
              </div>
              <span className="hidden md:inline text-xs text-[#A1AAB9] whitespace-nowrap shrink-0">
                {getRegionLabel(currentWire.region, locale)}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
