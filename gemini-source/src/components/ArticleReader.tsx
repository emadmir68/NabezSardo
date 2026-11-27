import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  Share2,
} from 'lucide-react';
import type { Article, Locale } from '../types/news';
import {
  cleanEditorialDeck,
  formatNumber,
  formatShortDate,
  getCategoryLabel,
  getRegionLabel,
  hasRealEditorialPhoto,
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
  onReportCorrection?: (article: Article) => void;
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
  onReportCorrection,
  onNotify,
}: ArticleReaderProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [fontScale, setFontScale] = useState<FontScale>('md');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const hasPhoto = hasRealEditorialPhoto(article);
  const hasVideo = Boolean(article.videoUrl);

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

  const shareUrl = `${window.location.origin}/news/${
    article.shortCode ? encodeURIComponent(article.shortCode) : encodeURIComponent(article.slug)
  }`;

  const handleShare = async () => {
    const title = article.title[locale];
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: cleanEditorialDeck(title, article.deck[locale], 180) || title, url: shareUrl });
        return;
      } catch {
        // User dismissed or share unavailable; fall back to copying link
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      onNotify(locale === 'fa' ? 'پیوند کوتاه خبر در حافظه کپی شد.' : 'Story short link copied.');
      window.setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      onNotify(locale === 'fa' ? 'آدرس خبر آماده اشتراک‌گذاری است.' : 'Story link ready to share.');
    }
  };

  const handleCopyPreparedMessage = async () => {
    const headline = article.title[locale];
    const lead = cleanEditorialDeck(headline, article.deck[locale], 220);
    const bodyText = article.body[locale].slice(0, 2).join('\n\n');
    const message = [headline, lead, bodyText, `${shareUrl}`].filter(Boolean).join('\n\n');
    try {
      await navigator.clipboard.writeText(message);
      setCopiedText(true);
      onNotify(locale === 'fa' ? 'متن آماده اشتراک‌گذاری کپی شد.' : 'Formatted story text copied.');
      window.setTimeout(() => setCopiedText(false), 2200);
    } catch {
      onNotify(locale === 'fa' ? 'کپی متن انجام نشد.' : 'Could not copy formatted text.');
    }
  };

  const proseSizeClass =
    fontScale === 'sm'
      ? 'text-[15.5px] leading-[1.92]'
      : fontScale === 'lg'
        ? 'text-[19px] leading-[1.98]'
        : 'text-[17px] leading-[1.95]';

  const captionText = article.imageCaption?.[locale]?.trim() || '';

  const normalizeComparable = (value: string) =>
    String(value || '')
      .replace(/\u200c/g, ' ')
      .replace(/[\u064A\u0649\u06CC]/g, '\u06CC')
      .replace(/[\u0643\u06A9]/g, '\u06A9')
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const titleNorm = normalizeComparable(article.title[locale]);
  const renderedBody: string[] = [];
  const seenBody = new Set<string>();
  for (const rawParagraph of article.body[locale]) {
    let p = String(rawParagraph || '').trim();
    if (!p) continue;
    let pNorm = normalizeComparable(p);
    if (!pNorm) continue;
    if (titleNorm && titleNorm.length >= 12 && pNorm.startsWith(titleNorm) && pNorm.length > titleNorm.length + 12) {
      const stripped = p.slice(article.title[locale].length).replace(/^[\s،,:؛.!؟—–-]+/u, '').trim();
      if (normalizeComparable(stripped).length >= 12) {
        p = stripped;
        pNorm = normalizeComparable(p);
      }
    }
    if (seenBody.has(pNorm)) continue;
    seenBody.add(pNorm);
    renderedBody.push(p);
  }
  if (renderedBody.length > 1 && titleNorm && normalizeComparable(renderedBody[0]) === titleNorm) {
    renderedBody.shift();
  }

  const rawDeck = cleanEditorialDeck(article.title[locale], article.deck[locale], 280);
  const deckNorm = normalizeComparable(rawDeck);
  const firstBodyNorm = normalizeComparable(renderedBody[0] || '');
  const distinctDeck =
    rawDeck &&
    deckNorm &&
    (!firstBodyNorm || (!firstBodyNorm.startsWith(deckNorm.slice(0, 28)) && !deckNorm.startsWith(firstBodyNorm.slice(0, 28))))
      ? rawDeck
      : '';

  const authorName = (article.author[locale] || '').trim();
  const authorRoleName = (article.authorRole[locale] || '').trim();
  const showAuthorRole = Boolean(
    authorRoleName && normalizeComparable(authorRoleName) !== normalizeComparable(authorName),
  );

  return (
    <article className="relative w-full pb-24">
      {/* Top Viewport Gold Reading Depth Bar */}
      <div className="fixed top-0 inset-x-0 z-50 h-[3px] bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-[#8F6321] via-[#ECC983] to-[#BA8433] transition-[width] duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Editorial Article Masthead (Real photo atmospheric plate OR clean Obsidian geometric header — zero text ghosts) */}
      <header className="relative w-full bg-[#080A10] text-[#F5F1E8] overflow-hidden border-b border-[#D4A85B]/25">
        {hasPhoto ? (
          <div className="absolute inset-0 overflow-hidden">
            <EditorialImage
              src={article.coverImage}
              alt=""
              className="w-full h-full object-cover opacity-35 scale-105 blur-[2px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080A10] via-[#080A10]/80 to-[#080A10]/55" />
          </div>
        ) : (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 82% 18%, rgba(212, 168, 91, 0.16), transparent 52%), radial-gradient(circle at 12% 88%, rgba(29, 43, 69, 0.45), transparent 55%)',
            }}
          />
        )}

        <div className="relative z-10 max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-10 pt-7 pb-12 sm:pb-16">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-7 mb-9 border-b border-[#F5F1E8]/15">
            <button
              type="button"
              onClick={onClose}
              className="btn-luxury-glass !min-h-[44px] !px-4 text-xs sm:text-sm"
            >
              {locale === 'fa' ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )}
              <span>{locale === 'fa' ? 'بازگشت به صفحه اخبار' : 'Back to Front Page'}</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex items-center rounded-xl border border-[#F5F1E8]/20 bg-[#0D121E]/80 backdrop-blur-md p-1"
                role="group"
                aria-label={locale === 'fa' ? 'تنظیم اندازه متن' : 'Adjust reading font size'}
              >
                {(['sm', 'md', 'lg'] as FontScale[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFontScale(size)}
                    className={`min-w-[36px] min-h-[34px] px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      fontScale === size
                        ? 'bg-gradient-to-b from-[#F1D79A] to-[#BA8433] text-[#080A10]'
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
                className="btn-luxury-glass !min-h-[44px] !px-4 text-xs"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4 text-[#F1D79A]" />
                ) : (
                  <Bookmark className="w-4 h-4" />
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
                className="btn-luxury-glass !min-h-[44px] !px-4 text-xs"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-[#F1D79A]" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                <span>{locale === 'fa' ? 'اشتراک' : 'Share'}</span>
              </button>
            </div>
          </div>

          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-[#EDE6D8]/85 mb-4">
              {article.kicker && (
                <>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D4A85B]/18 border border-[#D4A85B]/35 text-[#F1D79A] font-semibold">
                    {article.kicker}
                  </span>
                  <span aria-hidden="true" className="opacity-45">·</span>
                </>
              )}
              <span className="font-bold text-[#ECC983]">
                {getCategoryLabel(article.category, locale)}
              </span>
              <span aria-hidden="true" className="opacity-45">·</span>
              <span>{article.locationLabel || getRegionLabel(article.region, locale)}</span>
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
                locale === 'fa' ? 'leading-[1.4]' : 'leading-[1.16]'
              }`}
              style={{
                fontSize:
                  locale === 'fa'
                    ? 'clamp(1.75rem, 3.6vw, 3.15rem)'
                    : 'clamp(1.95rem, 4vw, 3.4rem)',
              }}
            >
              {article.title[locale]}
            </h1>

            {distinctDeck && (
              <p className="text-base sm:text-xl text-[#EDE6D8]/88 leading-relaxed mb-7">
                {distinctDeck}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#EDE6D8]/80">
              <span className="font-semibold text-[#F5F1E8]">{authorName}</span>
              {showAuthorRole && (
                <>
                  <span aria-hidden="true" className="text-[#ECC983]/60">·</span>
                  <span>{authorRoleName}</span>
                </>
              )}
              <span aria-hidden="true" className="text-[#ECC983]/60">·</span>
              <span className="tabular-nums">
                {locale === 'fa'
                  ? `${formatNumber(article.views, locale)} بازدید`
                  : `${formatNumber(article.views, locale)} views`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Media Frame: Rendered ONLY when genuine editorial photograph or video exists */}
      {(hasVideo || hasPhoto) && (
        <figure className="max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-10 -mt-8 relative z-20 mb-12">
          <div className="luxury-panel rounded-2xl overflow-hidden p-2 sm:p-3">
            <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-[#0B0F18]">
              {hasVideo ? (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  poster={hasPhoto ? article.coverImage : undefined}
                  className="w-full h-full object-contain bg-black"
                >
                  <source src={article.videoUrl} type={article.videoType || 'video/mp4'} />
                </video>
              ) : (
                <EditorialImage
                  src={article.coverImage}
                  alt={article.title[locale]}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {captionText && (
              <figcaption className="px-3 pt-3 pb-1 text-xs sm:text-sm text-[#5B5246] dark:text-[#A3ADBF]">
                {captionText}
              </figcaption>
            )}
          </div>
        </figure>
      )}

      {/* Asymmetric Reading Canvas */}
      <div
        className={`max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start ${
          !hasVideo && !hasPhoto ? 'pt-12' : ''
        }`}
      >
        <div className="lg:col-span-8 space-y-10">
          <div className={`max-w-[68ch] space-y-6 text-[#161310] dark:text-[#EAE5DC] ${proseSizeClass}`}>
            {renderedBody.map((paragraph, index) => (
              <div key={index} className="space-y-6">
                <p
                  className={
                    index === 0
                      ? 'first-line:font-semibold first-line:text-[#161310] dark:first-line:text-[#F6F2EA]'
                      : undefined
                  }
                >
                  {paragraph}
                </p>

                {index === 0 && article.pullQuote && (
                  <blockquote className="my-8 luxury-panel rounded-2xl p-6 sm:p-8 text-center relative">
                    <span
                      aria-hidden="true"
                      className="block font-editorial-display text-4xl text-[#8F6321]/40 dark:text-[#ECC983]/45 leading-none mb-2"
                    >
                      «
                    </span>
                    <div className="w-12 h-[1px] mx-auto mb-5 bg-[#8F6321] dark:bg-[#ECC983]" />
                    <p className="font-editorial-display text-xl sm:text-2xl italic font-medium text-[#161310] dark:text-[#F5F1E8] leading-relaxed">
                      {article.pullQuote[locale]}
                    </p>
                    <div className="w-12 h-[1px] mx-auto mt-5 bg-[#8F6321] dark:bg-[#ECC983]" />
                  </blockquote>
                )}
              </div>
            ))}
          </div>

          {/* Photo Gallery Grid if present */}
          {article.gallery && article.gallery.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#8F6321] dark:text-[#ECC983]">
                {locale === 'fa' ? 'گزارش تصویری' : 'Photo Gallery'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {article.gallery.map((src, i) => (
                  <div
                    key={i}
                    className="aspect-[16/10] rounded-xl overflow-hidden border border-[#D9CEBA] dark:border-[#252E42] bg-[#0B0F18]"
                  >
                    <EditorialImage
                      src={src}
                      alt={`${article.title[locale]} - ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share & Correction Responsibility Bar */}
          <div className="luxury-panel rounded-2xl p-6 space-y-5 max-w-[68ch]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#161310] dark:text-[#F5F1E8]">
                  {locale === 'fa' ? 'اشتراک‌گذاری و مسئولیت تحریریه' : 'Share & Editorial Integrity'}
                </h2>
                <p className="text-xs text-[#5B5246] dark:text-[#A3ADBF] mt-0.5">
                  {locale === 'fa'
                    ? 'پیوند کوتاه یا متن آماده انتشار در پیام‌رسان‌ها را کپی کنید.'
                    : 'Copy the short story URL or formatted message.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button type="button" onClick={handleShare} className="btn-luxury-ink !text-xs">
                  {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  <span>{locale === 'fa' ? 'کپی لینک کوتاه' : 'Copy Short Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyPreparedMessage}
                  className="btn-editorial-outline !text-xs"
                >
                  {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{locale === 'fa' ? 'کپی متن آماده' : 'Copy Full Post'}</span>
                </button>
              </div>
            </div>

            {onReportCorrection && (
              <div className="pt-4 border-t border-[#D9CEBA]/70 dark:border-[#252E42] flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[#5B5246] dark:text-[#A3ADBF]">
                  {locale === 'fa'
                    ? 'متوجه خطای اطلاعاتی یا نکته تکمیلی شده‌اید؟'
                    : 'Spotted an error or have an update?'}
                </span>
                <button
                  type="button"
                  onClick={() => onReportCorrection(article)}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold text-[#8F6321] dark:text-[#ECC983] hover:bg-[#8F6321]/10 dark:hover:bg-[#ECC983]/12 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{locale === 'fa' ? 'گزارش خطا / درخواست اصلاح' : 'Request Correction'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="luxury-panel rounded-2xl overflow-hidden">
            <div className="h-[2px] w-full gold-hairline" />
            <div className="p-6">
              <h2 className="text-xs font-bold text-[#8F6321] dark:text-[#ECC983] mb-4">
                {locale === 'fa' ? 'شناسنامه روایت' : 'Dispatch Dossier'}
              </h2>
              <dl className="divide-y divide-[#D9CEBA]/70 dark:divide-[#252E42] text-xs sm:text-sm">
                <div className="py-3 flex justify-between gap-4">
                  <dt className="text-[#5B5246] dark:text-[#A3ADBF]">
                    {locale === 'fa' ? 'میز خبری' : 'Desk'}
                  </dt>
                  <dd className="font-semibold text-[#161310] dark:text-[#F5F1E8]">
                    {getCategoryLabel(article.category, locale)}
                  </dd>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <dt className="text-[#5B5246] dark:text-[#A3ADBF]">
                    {locale === 'fa' ? 'حوزه جغرافیایی' : 'Region'}
                  </dt>
                  <dd className="font-semibold text-[#161310] dark:text-[#F5F1E8]">
                    {article.locationLabel || getRegionLabel(article.region, locale)}
                  </dd>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <dt className="text-[#5B5246] dark:text-[#A3ADBF]">
                    {locale === 'fa' ? 'تاریخ انتشار' : 'Published'}
                  </dt>
                  <dd className="font-semibold text-[#161310] dark:text-[#F5F1E8]">
                    {formatShortDate(article.publishedAt, locale)}
                  </dd>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <dt className="text-[#5B5246] dark:text-[#A3ADBF]">
                    {locale === 'fa' ? 'زمان خوانش' : 'Read Time'}
                  </dt>
                  <dd className="font-semibold text-[#161310] dark:text-[#F5F1E8] tabular-nums">
                    {locale === 'fa'
                      ? `${formatNumber(article.readTimeMin, locale)} دقیقه`
                      : `${article.readTimeMin} min`}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {relatedArticles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold text-[#8F6321] dark:text-[#ECC983]">
                  {locale === 'fa' ? 'روایت‌های مرتبط' : 'Related Dispatches'}
                </h2>
                <span className="h-[1px] flex-1 mx-4 bg-[#D9CEBA]/80 dark:bg-[#252E42]" />
              </div>

              <div className="space-y-3.5">
                {relatedArticles.map((rel, idx) => (
                  <motion.article
                    key={rel.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: idx * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="magazine-card group rounded-2xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectRelated(rel)}
                      className="relative z-10 w-full text-start p-4 sm:p-5 flex items-center gap-4 cursor-pointer"
                    >
                      {hasRealEditorialPhoto(rel) ? (
                        <div className="relative w-18 h-18 rounded-xl overflow-hidden shrink-0 bg-[#0B0F18] border border-[#D9CEBA]/50 dark:border-[#252E42]">
                          <EditorialImage
                            src={rel.coverImage}
                            alt={rel.title[locale]}
                            className="magazine-media-img w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-xl shrink-0 bg-[#EFE7D8] dark:bg-[#171E30] border border-[#D9CEBA] dark:border-[#252E42] flex items-center justify-center" aria-hidden="true">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#8F6321] dark:bg-[#ECC983]" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="text-[11px] text-[#5B5246] dark:text-[#A3ADBF] flex items-center gap-1.5">
                          <span className="font-bold text-[#8F6321] dark:text-[#ECC983]">
                            {rel.locationLabel || getRegionLabel(rel.region, locale)}
                          </span>
                          <span aria-hidden="true" className="opacity-35">·</span>
                          <span>{formatShortDate(rel.publishedAt, locale)}</span>
                        </p>
                        <p className="font-editorial-display text-[14.5px] font-bold text-[#161310] dark:text-[#F5F1E8] group-hover:text-[#8F6321] dark:group-hover:text-[#ECC983] transition-colors leading-[1.5] line-clamp-2">
                          {rel.title[locale]}
                        </p>
                      </div>

                      <span className="magazine-circle-action !w-9 !h-9 !min-w-[36px] !min-h-[36px] shrink-0">
                        {locale === 'fa' ? (
                          <ArrowUpLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
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
