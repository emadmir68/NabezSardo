import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bookmark, Globe, Menu, Moon, PenSquare, Search, Sun, X } from 'lucide-react';
import type { ActiveView, Locale, ThemeMode } from '../types/news';
import { formatJalaliDate, formatLiveClock, formatNumber } from '../utils/formatters';

interface TopBarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  locale: Locale;
  onToggleLocale: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  bookmarkCount: number;
  pendingReportsCount: number;
  onOpenSavedArchive: () => void;
}

export function TopBar({
  activeView,
  onNavigate,
  locale,
  onToggleLocale,
  theme,
  onToggleTheme,
  onOpenSearch,
  bookmarkCount,
  pendingReportsCount,
  onOpenSavedArchive,
}: TopBarProps) {
  const [now, setNow] = useState(() => new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems: { id: ActiveView; label: { fa: string; en: string } }[] = [
    { id: 'home', label: { fa: 'صفحه نخست', en: 'Front Page' } },
    { id: 'desks', label: { fa: 'میزهای خبری', en: 'Desks' } },
    { id: 'regions', label: { fa: 'مناطق', en: 'Regions' } },
    { id: 'archive', label: { fa: 'آرشیو', en: 'Archive' } },
    { id: 'studio', label: { fa: 'تحریریه', en: 'Studio' } },
  ];

  const secondaryMobileLinks: { id: ActiveView; label: { fa: string; en: string } }[] = [
    { id: 'search', label: { fa: 'جست‌وجوی پیشرفته', en: 'Search' } },
    { id: 'about', label: { fa: 'درباره نبض ساردو', en: 'About Us' } },
    { id: 'contact', label: { fa: 'تماس با تحریریه', en: 'Contact' } },
  ];

  const handleNav = (view: ActiveView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="w-full">
      {/* Operational Edition Ribbon (Non-Sticky, Mobile-Tuned) */}
      <div
        role="region"
        aria-label={locale === 'fa' ? 'نوار زمان و تنظیمات نسخه' : 'Edition and utility bar'}
        className="w-full border-b-[0.5px] border-[#D9CEBC]/85 dark:border-[#D4A85B]/16 bg-[#EAE1D2] dark:bg-[#05070B] text-[#5A5247] dark:text-[#A1AAB9] text-[11px] sm:text-xs"
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 h-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className="truncate font-semibold text-[#141210] dark:text-[#EDE6D8]">
              {formatJalaliDate(now, locale)}
            </span>
            <span aria-hidden="true" className="text-[#9A6B27] dark:text-[#D4A85B]/70">·</span>
            <span className="font-mono-tabular whitespace-nowrap shrink-0 text-[#9A6B27] dark:text-[#E8C680]">
              {formatLiveClock(now, locale)}
            </span>
            <span aria-hidden="true" className="hidden lg:inline opacity-35">·</span>
            <span className="hidden lg:inline truncate">
              {locale === 'fa'
                ? 'نشریه مستقل ساردوئیه، جیرفت و جنوب کرمان'
                : 'Independent Journal of Sarduiyeh, Jiroft & South Kerman'}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSearch}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[#141210] dark:text-[#EDE6D8] hover:bg-[#141210]/6 dark:hover:bg-[#F5F1E8]/8 hover:text-[#9A6B27] dark:hover:text-[#E8C680] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label={locale === 'fa' ? 'جستجوی زنده اخبار' : 'Open live search'}
            >
              <Search className="w-3.5 h-3.5" strokeWidth={1.9} />
              <span className="hidden sm:inline font-medium">{locale === 'fa' ? 'جستجو' : 'Search'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSavedArchive}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[#141210] dark:text-[#EDE6D8] hover:bg-[#141210]/6 dark:hover:bg-[#F5F1E8]/8 hover:text-[#9A6B27] dark:hover:text-[#E8C680] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label={locale === 'fa' ? 'اخبار نشان‌شده' : 'Saved stories'}
            >
              <Bookmark className="w-3.5 h-3.5" strokeWidth={1.9} />
              <span className="tabular-nums font-medium">{formatNumber(bookmarkCount, locale)}</span>
            </button>

            <button
              type="button"
              onClick={onToggleLocale}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-[#141210] dark:text-[#EDE6D8] hover:bg-[#141210]/6 dark:hover:bg-[#F5F1E8]/8 hover:text-[#9A6B27] dark:hover:text-[#E8C680] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label={locale === 'fa' ? 'تغییر زبان به انگلیسی' : 'Switch language to Persian'}
            >
              <Globe className="w-3.5 h-3.5" strokeWidth={1.9} />
              <span className="font-semibold">{locale === 'fa' ? 'EN' : 'فا'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[#141210] dark:text-[#EDE6D8] hover:bg-[#141210]/6 dark:hover:bg-[#F5F1E8]/8 hover:text-[#9A6B27] dark:hover:text-[#E8C680] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label={
                theme === 'dark'
                  ? locale === 'fa'
                    ? 'تغییر به تم روشن'
                    : 'Switch to light theme'
                  : locale === 'fa'
                    ? 'تغییر به تم تاریک'
                    : 'Switch to dark theme'
              }
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-[#E8C680]" strokeWidth={1.9} />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#9A6B27]" strokeWidth={1.9} />
              )}
              <span className="hidden sm:inline font-medium">
                {theme === 'dark'
                  ? locale === 'fa'
                    ? 'روشن'
                    : 'Light'
                  : locale === 'fa'
                    ? 'تاریک'
                    : 'Dark'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Top Bar — Animated Glass Header (Strict 3-Zone Contract) */}
      <header
        className={`sticky top-0 z-40 w-full border-b-[0.5px] transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          scrolled
            ? 'border-[#C9B99F]/70 dark:border-[#E8C680]/26 bg-[#F5F0E6]/82 dark:bg-[#07090E]/82 backdrop-blur-2xl shadow-[0_14px_38px_-22px_rgba(0,0,0,0.42)]'
            : 'border-[#D9CEBC]/75 dark:border-[#D4A85B]/16 bg-[#F5F0E6]/92 dark:bg-[#07090E]/90 backdrop-blur-xl'
        }`}
      >
        <div
          className={`max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4 sm:gap-8 transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            scrolled ? 'h-[62px] sm:h-[68px]' : 'h-[66px] sm:h-[74px]'
          }`}
        >
          {/* Zone 1: Editorial Masthead Wordmark */}
          <button
            type="button"
            onClick={() => handleNav('home')}
            className="group inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span
              aria-hidden="true"
              className="w-1.5 h-6 sm:h-7 rounded-full bg-gradient-to-b from-[#E8C680] via-[#C69546] to-[#9A6B27] opacity-90 group-hover:scale-y-110 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            />
            <span className="font-editorial-display text-[23px] sm:text-[30px] font-bold tracking-tight text-[#141210] dark:text-[#F6F2EA] group-hover:text-[#9A6B27] dark:group-hover:text-[#E8C680] transition-colors leading-none">
              {locale === 'fa' ? 'نبض ساردو' : 'Nabz Sardo'}
            </span>
          </button>

          {/* Zone 2: 5 Clean Single-Line Nav Links */}
          <nav
            aria-label={locale === 'fa' ? 'ناوبری اصلی' : 'Primary navigation'}
            className="hidden md:flex items-center gap-6 lg:gap-8 h-full"
          >
            {navItems.map((item) => {
              const isActive =
                activeView === item.id || (item.id === 'studio' && activeView === 'admin-login');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`relative h-full inline-flex items-center px-1 text-[14px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'text-[#161310] dark:text-[#F5F1E8]'
                      : 'text-[#5B5246] dark:text-[#A3ADBF] hover:text-[#161310] dark:hover:text-[#F5F1E8]'
                  }`}
                >
                  <span>{item.label[locale]}</span>
                  {item.id === 'studio' && pendingReportsCount > 0 && (
                    <span className="ms-1.5 text-xs font-mono-tabular text-[#8F6321] dark:text-[#ECC983]">
                      ({formatNumber(pendingReportsCount, locale)})
                    </span>
                  )}
                  <span
                    className={`absolute inset-x-0 bottom-0 h-[2px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] bg-gradient-to-r from-transparent via-[#8F6321] dark:via-[#ECC983] to-transparent ${
                      isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-50'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Sculpted Luxury Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleNav('submit')}
              className="btn-luxury-ink !min-h-[44px] !px-3.5 sm:!px-5 text-xs sm:text-[13px] whitespace-nowrap shrink-0"
            >
              <PenSquare className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              <span className="sm:hidden">{locale === 'fa' ? 'ارسال خبر' : 'Submit'}</span>
              <span className="hidden sm:inline">
                {locale === 'fa' ? 'ارسال خبر مردمی' : 'Submit Report'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden btn-icon-luxury !w-11 !h-11"
              aria-label={locale === 'fa' ? 'باز کردن منو' : 'Toggle navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* Frosted Luxury Mobile Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden border-t-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/18 bg-[#F5F0E6]/98 dark:bg-[#090C14]/98 backdrop-blur-2xl"
            >
              <div className="px-4 py-4 space-y-1.5">
                {navItems.map((item) => {
                  const isActive =
                    activeView === item.id ||
                    (item.id === 'studio' && activeView === 'admin-login');
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNav(item.id)}
                      className={`w-full text-start px-4 py-3.5 rounded-xl text-[15px] font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#9A6B27]/12 text-[#9A6B27] dark:bg-[#E8C680]/12 dark:text-[#E8C680] border-[0.5px] border-[#9A6B27]/30 dark:border-[#E8C680]/28'
                          : 'text-[#141210] dark:text-[#F6F2EA] hover:bg-[#141210]/5 dark:hover:bg-[#F5F1E8]/5'
                      }`}
                    >
                      <span>{item.label[locale]}</span>
                      {item.id === 'studio' && pendingReportsCount > 0 && (
                        <span className="text-xs font-mono-tabular text-[#9A6B27] dark:text-[#E8C680]">
                          ({formatNumber(pendingReportsCount, locale)})
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="pt-2.5 mt-2.5 border-t-[0.5px] border-[#D9CEBC]/70 dark:border-[#D4A85B]/16 grid grid-cols-3 gap-2">
                  {secondaryMobileLinks.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleNav(sub.id)}
                      className="px-3 py-2.5 rounded-xl text-xs font-semibold text-center border-[0.5px] border-[#D9CEBC]/70 dark:border-[#D4A85B]/18 text-[#5A5247] dark:text-[#A1AAB9] hover:text-[#141210] dark:hover:text-[#F6F2EA] cursor-pointer"
                    >
                      {sub.label[locale]}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
}
