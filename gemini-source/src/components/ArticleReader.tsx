import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Check,
  Share2,
} from 'lucide-react';
import type { Article, Locale } from '../types/news';
import {
  cleanEditorialDeck,
  formatNumber,
  formatShortDate,
  getCategoryLabel,
  getRegionLabel,
  resolveArticleCoverImage,
} from '../utils/formatters';
import { EditorialImage } from './EditorialImage';

interface ArticleReaderProps {
  article: Article;
  relatedArticles: Article[];
  locale: Locale;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onClose: () => void;
  onSelectRelated: (article: Article) => void;
  onNotify: (text: string) => void;
}

type FontScale = 'sm' | 'md' | 'lg';

export function ArticleReader({
  article,
  relatedArticles,
  locale,
  isBookmarked,
  onToggleBookmark,
  onClose,
  onSelectRelated,
  onNotify,
}: ArticleReaderProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [fontScale, setFontScale] = useState<FontScale>('md');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [article.id]);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      setScrollProgress(Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/#news/${article.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onNotify(
        locale === 'fa'
          ? 'پیوند خبر در حافظه کپی شد.'
          : 'Story link copied to clipboard.'
      );
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      onNotify(
        locale === 'fa'
          ? 'آدرس خبر آماده اشتراک‌گذاری است.'
          : 'Story link ready to share.'
      );
    }
  };

  const proseSizeClass =
    fontScale === 'sm'
      ? 'text-[15.5px] leading-[1.92]'
      : fontScale === 'lg'
        ? 'text-[19px] leading-[1.98]'
        : 'text-[17px] leading-[1.95]';

  return (
    <article className="relative w-full pb-24">
      {/* Sticky Gold Reading Depth Bar */}
      <div className="fixed top-[68px] inset-x-0 z-30 h-[2px] bg-[#DDD3C2]/40 dark:bg-[#232B3D]/60">
        <div
          className="h-full bg-gradient-to-r from-[#9E6F2C] via-[#E5C17B] to-[#C6964B] transition-[width] duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Full-Bleed Luxury Magazine Article Masthead */}
      <header className="relative w-full bg-[#07090E] text-[#F5F1E8] overflow-hidden border-b border-[#D4A85B]/25">
        <div className="absolute inset-0 overflow-hidden">
          <EditorialImage
            src={resolveArticleCoverImage(article)}
            alt={article.title[locale]}
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-[#07090E]/72 to-[#07090E]/45" />
        </div>

        <div className="relative z-10 max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-12 sm:pb-16">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 mb-10 border-b border-[#F5F1E8]/15">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#EDE6D8]/85 hover:text-[#E5C17B] transition-colors cursor-pointer"
            >
              {locale === 'fa' ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )}
              <span>{locale === 'fa' ? 'بازگشت به صفحه اخبار' : 'Back to Front Page'}</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <div
                className="inline-flex items-center rounded-xl border-[0.75px] border-[#F5F1E8]/20 bg-[#080A10]/60 backdrop-blur-md p-0.5"
                role="group"
                aria-label={locale === 'fa' ? 'تنظیم اندازه متن' : 'Adjust reading font size'}
              >
                {(['sm', 'md', 'lg'] as FontScale[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFontScale(size)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      fontScale === size
                        ? 'bg-gradient-to-b from-[#F0D496] to-[#C69546] text-[#080A0F]'
                        : 'text-[#EDE6D8]/80 hover:text-[#F5F1E8]'
                    }`}
                  >
                    {size === 'sm' ? 'A-' : size === 'md' ? 'A' : 'A+'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onToggleBookmark(article.id)}
                className="btn-luxury-glass !min-h-[38px] !px-3.5 !py-1.5 text-xs"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-3.5 h-3.5 text-[#F0D496]" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
                <span>
                  {isBookmarked
                    ? locale === 'fa'
                      ? 'ذخیره‌شده'
                      : 'Saved'
                    : locale === 'fa'
                      ? 'ذخیره'
                      : 'Save'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="btn-luxury-glass !min-h-[38px] !px-3.5 !py-1.5 text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#F0D496]" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{locale === 'fa' ? 'اشتراک' : 'Share'}</span>
              </button>
            </div>
          </div>

          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-[#EDE6D8]/85 mb-4">
              <span className="font-bold text-[#E5C17B]">
                {getCategoryLabel(article.category, locale)}
              </span>
              <span aria-hidden="true" className="opacity-45">·</span>
              <span>{getRegionLabel(article.region, locale)}</span>
              <span aria-hidden="true" className="opacity-45">·</span>
              <span>{formatShortDate(article.publishedAt, locale)}</span>
              <span aria-hidden="true" className="opacity-45">·</span>
              <span className="tabular-nums">
                {locale === 'fa'
                  ? `${formatNumber(article.readTimeMin, locale)} دقیقه مطالعه`
                  : `${article.readTimeMin} min read`}
              </span>
            </div>

            <h1
              className={`font-editorial-display font-bold text-[#FDFBF7] mb-5 ${
                locale === 'fa' ? 'leading-[1.42]' : 'leading-[1.18]'
              }`}
              style={{
                fontSize:
                  locale === 'fa'
                    ? 'clamp(1.75rem, 3.6vw, 3.2rem)'
                    : 'clamp(1.95rem, 4vw, 3.45rem)',
              }}
            >
              {article.title[locale]}
            </h1>

            {cleanEditorialDeck(article.title[locale], article.deck[locale], 260) && (
              <p className="text-base sm:text-xl text-[#EDE6D8]/88 leading-relaxed mb-7">
                {cleanEditorialDeck(article.title[locale], article.deck[locale], 260)}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#EDE6D8]/80">
              <span className="font-semibold text-[#F5F1E8]">{article.author[locale]}</span>
              <span aria-hidden="true" className="text-[#E5C17B]/60">·</span>
              <span>{article.authorRole[locale]}</span>
              <span aria-hidden="true" className="text-[#E5C17B]/60">·</span>
              <span className="tabular-nums">
                {locale === 'fa'
                  ? `${formatNumber(article.views, locale)} بازدید`
                  : `${formatNumber(article.views, locale)} views`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Framed Documentary Feature Plate */}
      <figure className="max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-10 -mt-8 relative z-20 mb-14">
        <div className="luxury-panel rounded-xl overflow-hidden p-2 sm:p-3">
          <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#EFE9DD] dark:bg-[#0B0F18]">
            <EditorialImage
              src={resolveArticleCoverImage(article)}
              alt={article.title[locale]}
              fallbackLabel={article.title[locale]}
              className="w-full h-full object-cover"
            />
          </div>
          <figcaption className="px-3 pt-3 pb-1 text-xs sm:text-sm italic text-[#5F584D] dark:text-[#9AA3B5]">
            {article.imageCaption[locale]}
          </figcaption>
        </div>
      </figure>

      {/* Asymmetric Reading Canvas (8-Col Prose / 4-Col Luxury Dossier Rail) */}
      <div className="max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        <div className="lg:col-span-8 min-w-0">
          <div className={`w-full min-w-0 max-w-[68ch] space-y-7 text-[#161412] dark:text-[#EAE5DC] ${proseSizeClass}`}>
            {article.body[locale].map((paragraph, index) => (
              <div key={index} className="space-y-7">
                <p
                  dir={locale === 'fa' ? 'rtl' : 'ltr'}
                  className={locale === 'fa' ? 'article-prose-paragraph-fa' : 'article-prose-paragraph-en'}
                >
                  {paragraph}
                </p>

                {index === 0 && article.pullQuote && (
                  <blockquote className="my-10 luxury-panel rounded-xl p-7 sm:p-8 text-center">
                    <div className="w-12 h-[1px] mx-auto mb-5 bg-[#9E6F2C] dark:bg-[#E5C17B]" />
                    <p className="font-editorial-display text-xl sm:text-2xl italic font-medium text-[#161412] dark:text-[#F5F1E8] leading-relaxed">
                      {article.pullQuote[locale]}
                    </p>
                    <div className="w-12 h-[1px] mx-auto mt-5 bg-[#9E6F2C] dark:bg-[#E5C17B]" />
                  </blockquote>
                )}
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="luxury-panel rounded-xl overflow-hidden">
            <div className="h-[1px] w-full gold-hairline" />
            <div className="p-6">
              <h2 className="text-xs font-bold text-[#9E6F2C] dark:text-[#E5C17B] mb-4">
                {locale === 'fa' ? 'شناسنامه روایت' : 'Dispatch Dossier'}
              </h2>
              <dl className="divide-y divide-[#DDD3C2]/70 dark:divide-[#D4A85B]/12 text-xs sm:text-sm">
                <div className="py-3 flex justify-between gap-4">
                  <dt className="text-[#5F584D] dark:text-[#9AA3B5]">
                    {locale === 'fa' ? 'میز خبری' : 'Desk'}
                  </dt>
                  <dd className="font-semibold text-[#161412] dark:text-[#F5F1E8]">
                    {getCategoryLabel(article.category, locale)}
                  </dd>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <dt className="text-[#5F584D] dark:text-[#9AA3B5]">
                    {locale === 'fa' ? 'حوزه جغرافیایی' : 'Region'}
                  </dt>
                  <dd className="font-semibold text-[#161412] dark:text-[#F5F1E8]">
                    {getRegionLabel(article.region, locale)}
                  </dd>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <dt className="text-[#5F584D] dark:text-[#9AA3B5]">
                    {locale === 'fa' ? 'تاریخ انتشار' : 'Published'}
                  </dt>
                  <dd className="font-semibold text-[#161412] dark:text-[#F5F1E8]">
                    {formatShortDate(article.publishedAt, locale)}
                  </dd>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <dt className="text-[#5F584D] dark:text-[#9AA3B5]">
                    {locale === 'fa' ? 'زمان خوانش' : 'Read Time'}
                  </dt>
                  <dd className="font-semibold text-[#161412] dark:text-[#F5F1E8] tabular-nums">
                    {locale === 'fa'
                      ? `${formatNumber(article.readTimeMin, locale)} دقیقه`
                      : `${article.readTimeMin} min`}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {relatedArticles.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[11px] font-bold tracking-[0.04em] text-[#9A6B27] dark:text-[#E8C680]">
                  {locale === 'fa' ? 'روایت‌های مرتبط' : 'Related Dispatches'}
                </h2>
                <span className="h-[0.5px] flex-1 mx-4 bg-[#D9CEBC]/80 dark:bg-[#D4A85B]/16" />
              </div>

              <div className="space-y-4">
                {relatedArticles.map((rel, idx) => (
                  <motion.article
                    key={rel.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: idx * 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="magazine-card group rounded-[20px] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectRelated(rel)}
                      className="relative z-10 w-full text-start p-5 sm:p-6 flex items-center gap-4 sm:gap-5 cursor-pointer"
                    >
                      <div className="relative w-20 h-20 rounded-[12px] overflow-hidden shrink-0 bg-[#EAE2D3] dark:bg-[#0B0F18] border-[0.5px] border-[#141210]/10 dark:border-[#F5F1E8]/10">
                        <EditorialImage
                          src={resolveArticleCoverImage(rel)}
                          alt={rel.title[locale]}
                          className="magazine-media-img w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-[11px] text-[#5A5247] dark:text-[#A1AAB9] flex items-center gap-1.5">
                          <span className="font-bold text-[#9A6B27] dark:text-[#E8C680]">
                            {getRegionLabel(rel.region, locale)}
                          </span>
                          <span aria-hidden="true" className="opacity-35">·</span>
                          <span>{formatShortDate(rel.publishedAt, locale)}</span>
                        </p>
                        <p className="font-editorial-display text-[15px] font-bold text-[#141210] dark:text-[#F6F2EA] group-hover:text-[#9A6B27] dark:group-hover:text-[#E8C680] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] leading-[1.52] line-clamp-2">
                          {rel.title[locale]}
                        </p>
                      </div>

                      <span className="magazine-circle-action !w-8 !h-8 shrink-0 group-hover:border-[#9A6B27] dark:group-hover:border-[#E8C680] group-hover:text-[#9A6B27] dark:group-hover:text-[#E8C680]">
                        {locale === 'fa' ? (
                          <ArrowUpLeft className="w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        )}
                      </span>
                    </button>
                  </motion.article>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
