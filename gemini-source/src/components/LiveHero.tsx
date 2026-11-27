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
import type { Article, BreakingWireConfig, Locale } from '../types/news';
import {
  cleanEditorialDeck,
  formatEditorialIndex,
  formatNumber,
  formatShortDate,
  getCategoryLabel,
  getRegionLabel,
  resolveArticleCoverImage,
} from '../utils/formatters';
import { EditorialImage } from './EditorialImage';

interface LiveHeroProps {
  slides: Article[];
  breakingArticles: Article[];
  breakingWire?: BreakingWireConfig | null;
  locale: Locale;
  bookmarkedIds: string[];
  onOpenArticle: (article: Article) => void;
  onToggleBookmark: (id: string) => void;
}

const SLIDE_DURATION_MS = 7800;

export function LiveHero({
  slides,
  breakingArticles,
  breakingWire,
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
      className="relative w-full bg-[#06080D] text-[#F6F2EA] overflow-hidden border-b border-[#D4A85B]/25"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative min-h-[64svh] sm:min-h-[70svh] lg:min-h-[76vh] flex flex-col justify-between">
        {/* Widescreen Editorial Cinema Backdrop */}
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
                    src={resolveArticleCoverImage(slide)}
                    alt={slide.title[locale]}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>
            );
          })}

          {/* Calibrated Cinema Scrim for High-Contrast Editorial Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#06080D] via-[#06080D]/62 to-[#06080D]/28 z-10" />
          <div
            className={`absolute inset-0 z-10 ${
              locale === 'fa'
                ? 'bg-gradient-to-l from-[#06080D]/86 via-[#06080D]/38 to-transparent'
                : 'bg-gradient-to-r from-[#06080D]/86 via-[#06080D]/38 to-transparent'
            }`}
          />
          <div className="absolute inset-0 editorial-grain opacity-25 z-10 pointer-events-none" />
        </div>

        {/* Top Editorial Masthead Marker & Playback Controls */}
        <div className="relative z-20 max-w-[1380px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 text-xs sm:text-[13px] text-[#EDE6D8]/92 min-w-0">
            <span className="font-mono-tabular px-2.5 py-1 rounded-full bg-black/45 border border-[#D4A85B]/30 text-[#F1D79A] font-semibold tracking-wider shrink-0 backdrop-blur-md">
              {formatEditorialIndex(currentIndex, locale)} / {formatEditorialIndex(safeSlides.length - 1, locale)}
            </span>
            <span className="font-bold text-[#F1D79A] truncate">
              {getCategoryLabel(activeSlide.category, locale)}
            </span>
            <span aria-hidden="true" className="opacity-45 shrink-0">·</span>
            <span className="truncate text-[#EDE6D8]/85">
              {getRegionLabel(activeSlide.region, locale)}
            </span>
          </div>

          {safeSlides.length > 1 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className="btn-icon-luxury !w-11 !h-11 !bg-[#080B12]/65 !border-[#F5F1E8]/22 !text-[#F6F2EA] hover:!border-[#E8C680] hover:!text-[#F0D496]"
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
                className="btn-icon-luxury !w-11 !h-11 !bg-[#080B12]/65 !border-[#F5F1E8]/22 !text-[#F6F2EA] hover:!border-[#E8C680] hover:!text-[#F0D496]"
                aria-label={locale === 'fa' ? 'خبر ویژه قبلی' : 'Previous featured story'}
              >
                {locale === 'fa' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="btn-icon-luxury !w-11 !h-11 !bg-[#080B12]/65 !border-[#F5F1E8]/22 !text-[#F6F2EA] hover:!border-[#E8C680] hover:!text-[#F0D496]"
                aria-label={locale === 'fa' ? 'خبر ویژه بعدی' : 'Next featured story'}
              >
                {locale === 'fa' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Expansive Cover Typography Stage (No Obstructing Side Box) */}
        <div className="relative z-20 max-w-[1380px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-10 pb-8 sm:pb-10 mt-auto">
          <div className="max-w-4xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-[13px] text-[#EDE6D8]/85 mb-4">
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
                  className={`font-editorial-display font-bold text-[#FDFBF7] mb-4 sm:mb-5 drop-shadow-[0_6px_28px_rgba(0,0,0,0.65)] line-clamp-3 ${
                    locale === 'fa' ? 'leading-[1.36] sm:leading-[1.32]' : 'leading-[1.12]'
                  }`}
                  style={{
                    fontSize:
                      locale === 'fa'
                        ? 'clamp(1.75rem, 4vw, 3.55rem)'
                        : 'clamp(2.15rem, 4.9vw, 4.25rem)',
                  }}
                >
                  {activeSlide.title[locale]}
                </h1>

                {cleanEditorialDeck(activeSlide.title[locale], activeSlide.deck[locale], 200) && (
                  <p className="text-[14.5px] sm:text-[17.5px] text-[#EDE6D8]/90 leading-[1.85] max-w-2xl mb-7 line-clamp-2 sm:line-clamp-3">
                    {cleanEditorialDeck(activeSlide.title[locale], activeSlide.deck[locale], 200)}
                  </p>
                )}

                <div className="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => onOpenArticle(activeSlide)}
                    className="btn-luxury-gold text-[13.5px] sm:text-sm !px-7"
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
                    className="btn-luxury-glass text-[13.5px] sm:text-sm !px-5"
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

          {/* Minimal Numbered Chapter Strip along bottom edge */}
          {safeSlides.length > 1 && (
            <div className="mt-8 sm:mt-10 pt-5 border-t border-[#F5F1E8]/14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
              {safeSlides.slice(0, 4).map((slide, idx) => {
                const isSelected = idx === currentIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    className={`group relative text-start pt-2.5 pb-1 transition-opacity cursor-pointer ${
                      isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-95'
                    }`}
                  >
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-[#F5F1E8]/15 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#C69546] via-[#F1D79A] to-[#E8C680] transition-[width] duration-75 ease-linear"
                        style={{
                          width: isSelected ? `${progress}%` : idx < currentIndex ? '100%' : '0%',
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[10.5px] font-mono-tabular text-[#F1D79A] mb-1">
                      <span className="font-bold">{formatEditorialIndex(idx, locale)}</span>
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span className="font-sans text-[#EDE6D8]/75 truncate">
                        {getCategoryLabel(slide.category, locale)}
                      </span>
                    </div>
                    <p className="font-editorial-display text-xs sm:text-[13.5px] font-bold text-[#FDFBF7] group-hover:text-[#F1D79A] line-clamp-1 leading-relaxed transition-colors">
                      {slide.title[locale]}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sleek Animated Live Editorial Dispatch Wire */}
        {(currentWire || breakingWire) && (
          <div className="relative z-20 border-t border-[#D4A85B]/22 bg-[#04060A]/94 backdrop-blur-2xl">
            <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-[#F0D496] whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ECC983] animate-pulse" />
                  <span>
                    {breakingWire?.kind === 'announcement'
                      ? locale === 'fa'
                        ? 'اطلاعیه تحریریه'
                        : 'Notice'
                      : locale === 'fa'
                        ? breakingWire?.label || 'خط فوری تحریریه'
                        : 'Live Desk Wire'}
                  </span>
                </span>
                <span aria-hidden="true" className="h-3.5 w-[1px] bg-[#D4A85B]/40 shrink-0" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  {breakingWire?.kind === 'breaking' || breakingWire?.kind === 'announcement' ? (
                    <p className="text-xs sm:text-[13.5px] font-medium text-[#F6F2EA]/94 truncate">
                      {locale === 'fa' ? breakingWire.textFa : breakingWire.textEn}
                    </p>
                  ) : currentWire ? (
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
                  ) : (
                    <p className="text-xs sm:text-[13.5px] font-medium text-[#F6F2EA]/80 truncate">
                      {locale === 'fa' ? breakingWire?.textFa : breakingWire?.textEn}
                    </p>
                  )}
                </div>
              </div>
              {currentWire && (
                <span className="hidden md:inline text-xs text-[#A1AAB9] whitespace-nowrap shrink-0">
                  {getRegionLabel(currentWire.region, locale)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
