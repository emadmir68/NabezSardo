import { ArrowLeft, ArrowRight, Home, Search } from 'lucide-react';
import type { ActiveView, Locale } from '../types/news';

interface NotFoundViewProps {
  locale: Locale;
  attemptedPath?: string;
  onNavigate: (view: ActiveView) => void;
}

export function NotFoundView({ locale, attemptedPath, onNavigate }: NotFoundViewProps) {
  return (
    <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-20 sm:py-28 flex items-center justify-center">
      <div className="w-full max-w-xl luxury-panel rounded-[28px] p-8 sm:p-12 text-center space-y-6">
        <p className="font-mono-tabular text-5xl sm:text-6xl font-light text-[#9A6B27] dark:text-[#E8C680] tracking-wider">
          404
        </p>

        <h1 className="font-editorial-display text-2xl sm:text-4xl font-bold text-[#141210] dark:text-[#F6F2EA] leading-[1.4]">
          {locale === 'fa'
            ? 'این صفحه یا روایت در آرشیو یافت نشد'
            : 'This page or dispatch could not be found'}
        </h1>

        <p className="text-sm sm:text-base text-[#5A5247] dark:text-[#A1AAB9] leading-[1.9]">
          {locale === 'fa'
            ? 'نشانی واردشده ممکن است تغییر کرده باشد یا خبر مورد نظر در بایگانی تحریریه منتقل شده باشد.'
            : 'The requested URL may have moved or the dispatch may no longer be available at this address.'}
        </p>

        {attemptedPath && (
          <p
            dir="ltr"
            className="font-mono-tabular text-xs text-[#5A5247]/80 dark:text-[#A1AAB9]/80 truncate"
          >
            {attemptedPath}
          </p>
        )}

        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="btn-luxury-ink text-xs sm:text-sm"
          >
            <Home className="w-4 h-4" />
            <span>{locale === 'fa' ? 'بازگشت به صفحه نخست' : 'Return to Front Page'}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className="inline-flex items-center gap-2 min-h-[42px] px-5 py-2.5 rounded-[10px] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/25 text-xs sm:text-sm font-bold text-[#141210] dark:text-[#F6F2EA] hover:border-[#9A6B27] dark:hover:border-[#E8C680] transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{locale === 'fa' ? 'جست‌وجو در آرشیو' : 'Search Archive'}</span>
            {locale === 'fa' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </section>
  );
}
