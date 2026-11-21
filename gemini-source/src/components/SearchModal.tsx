import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpLeft, ArrowUpRight, Search, X } from 'lucide-react';
import { CATEGORIES } from '../data/initialData';
import type { Article, CategoryId, Locale } from '../types/news';
import { formatNumber, formatShortDate, getCategoryLabel, getRegionLabel } from '../utils/formatters';
import { EditorialImage } from './EditorialImage';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  locale: Locale;
  onSelectArticle: (article: Article) => void;
  onSelectCategory: (category: CategoryId) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  articles,
  locale,
  onSelectArticle,
  onSelectCategory,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 60);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  const published = useMemo(
    () => articles.filter((a) => a.status === 'published'),
    [articles]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return published.slice(0, 5);
    return published.filter((item) => {
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
    });
  }, [published, query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#0B0E14]/75 backdrop-blur-sm p-4 sm:pt-20"
      role="dialog"
      aria-modal="true"
      aria-label={locale === 'fa' ? 'جستجوی زنده اخبار' : 'Live editorial search'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-xl luxury-panel overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        <div className="h-[1px] w-full gold-hairline" />
        {/* Input Row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#DDD7CB] dark:border-[#232B3B]">
          <Search className="w-5 h-5 text-[#9A6B2F] dark:text-[#C99B52] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              locale === 'fa'
                ? 'جستجو در تیترها، ساردوئیه، جیرفت، کشاورزی، فرهنگ...'
                : 'Search headlines, Sarduiyeh, Jiroft, agriculture, culture...'
            }
            className="w-full bg-transparent text-sm sm:text-base text-[#181614] dark:text-[#F2EFE9] placeholder:text-[#5C564D]/70 dark:placeholder:text-[#9BA3B4]/70 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs text-[#5C564D] dark:text-[#9BA3B4] hover:text-[#181614] dark:hover:text-[#F2EFE9] cursor-pointer"
            >
              {locale === 'fa' ? 'پاک' : 'Clear'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={locale === 'fa' ? 'بستن جستجو' : 'Close search'}
            className="p-1.5 text-[#5C564D] dark:text-[#9BA3B4] hover:text-[#181614] dark:hover:text-[#F2EFE9] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Desk Shortcuts */}
        <div className="px-5 py-3 border-b border-[#DDD7CB]/70 dark:border-[#232B3B]/70 flex items-center gap-2 overflow-x-auto bg-[#EFECE4]/50 dark:bg-[#121722]/60">
          <span className="text-xs text-[#5C564D] dark:text-[#9BA3B4] whitespace-nowrap shrink-0">
            {locale === 'fa' ? 'میزهای سریع:' : 'Quick desks:'}
          </span>
          {CATEGORIES.slice(0, 5).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                onSelectCategory(cat.id);
                onClose();
              }}
              className="text-xs font-medium text-[#181614] dark:text-[#E5E0D5] hover:text-[#9A6B2F] dark:hover:text-[#C99B52] whitespace-nowrap shrink-0 px-2 py-1 cursor-pointer"
            >
              {cat.label[locale]}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between text-xs text-[#5C564D] dark:text-[#9BA3B4] mb-3">
            <span>
              {query.trim()
                ? locale === 'fa'
                  ? `${formatNumber(results.length, locale)} نتیجه یافت شد`
                  : `${results.length} matching stories`
                : locale === 'fa'
                  ? 'تازه‌ترین خبرهای تحریریه'
                  : 'Recent editorial dispatches'}
            </span>
          </div>

          {results.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-[#181614] dark:text-[#F2EFE9] mb-1">
                {locale === 'fa' ? 'نتیجه‌ای پیدا نشد' : 'No matching dispatches'}
              </p>
              <p className="text-xs text-[#5C564D] dark:text-[#9BA3B4]">
                {locale === 'fa'
                  ? 'واژه دیگری امتحان کنید یا یکی از میزهای خبری بالا را انتخاب نمایید.'
                  : 'Try another keyword or choose one of the regional desks above.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {results.map((item, idx) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.035, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectArticle(item);
                      onClose();
                    }}
                    className="magazine-card group w-full text-start rounded-xl p-4 flex items-center gap-4 cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[#EFE9DD] dark:bg-[#0B0F18] border-[0.75px] border-[#DDD3C2]/70 dark:border-[#F5F1E8]/10">
                      <EditorialImage
                        src={item.coverImage}
                        alt={item.title[locale]}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-[#5C564D] dark:text-[#9BA3B4]">
                        <span className="font-bold text-[#9E6F2C] dark:text-[#E5C17B]">
                          {getCategoryLabel(item.category, locale)}
                        </span>
                        <span aria-hidden="true" className="opacity-40">·</span>
                        <span>{getRegionLabel(item.region, locale)}</span>
                        <span aria-hidden="true" className="opacity-40">·</span>
                        <span>{formatShortDate(item.publishedAt, locale)}</span>
                      </div>
                      <p className="font-editorial-display text-base font-bold text-[#181614] dark:text-[#F2EFE9] group-hover:text-[#9E6F2C] dark:group-hover:text-[#E5C17B] transition-colors duration-300 leading-snug line-clamp-1">
                        {item.title[locale]}
                      </p>
                      <p className="text-xs text-[#5C564D] dark:text-[#9BA3B4] line-clamp-1">
                        {item.deck[locale]}
                      </p>
                    </div>
                    <span className="shrink-0 w-7 h-7 rounded-full border-[0.75px] border-[#DDD3C2]/80 dark:border-[#F5F1E8]/12 flex items-center justify-center text-[#5C564D] dark:text-[#9BA3B4] group-hover:border-[#9E6F2C]/50 dark:group-hover:border-[#E5C17B]/50 group-hover:text-[#9E6F2C] dark:group-hover:text-[#E5C17B] transition-all duration-300">
                      {locale === 'fa' ? (
                        <ArrowUpLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      )}
                    </span>
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
