import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react';
import type { Article, Locale } from '../types/news';
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

interface CardBaseProps {
  article: Article;
  locale: Locale;
  index?: number;
  isSaved: boolean;
  onOpen: (article: Article) => void;
  onToggleBookmark: (id: string) => void;
}

/**
 * 1. Flagship Magazine Cover Plate (7-col Editorial Spotlight)
 * Full-bleed photograph, 0.5px recessed gallery hairline, ultra-subtle frosted glass plaque,
 * pure unboxed typography, layered elevation shadows, and cubic-bezier hover choreography.
 */
export function MagazineLeadCard({
  article,
  locale,
  isSaved,
  onOpen,
  onToggleBookmark,
}: CardBaseProps) {
  const cleanDeck = cleanEditorialDeck(article.title[locale], article.deck[locale], 185);

  return (
    <article className="magazine-plate lg:col-span-7 group rounded-[26px] overflow-hidden bg-[#070A10] min-h-[500px] sm:min-h-[580px] lg:min-h-[650px] flex flex-col justify-between">
      {/* Full-Bleed Editorial Photograph */}
      <div className="absolute inset-0 overflow-hidden">
        <EditorialImage
          src={resolveArticleCoverImage(article)}
          alt={article.title[locale]}
          fallbackLabel={article.title[locale]}
          className="magazine-media-img w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070C]/92 via-[#05070C]/42 to-[#05070C]/28 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
        {/* Recessed 0.5px Gallery Inner Frame */}
        <div
          aria-hidden="true"
          className="absolute inset-4 sm:inset-5 rounded-[18px] border-[0.5px] border-[#F5F1E8]/12 group-hover:border-[#F0D496]/36 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none"
        />
      </div>

      {/* Top Editorial Line (Unboxed Typography + Tactile Hairline Bookmark) */}
      <div className="relative z-10 px-7 pt-7 sm:px-10 sm:pt-9 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-[#F6F2EA]/90 tracking-[0.01em]">
          <span className="font-bold text-[#F0D496]">
            {getCategoryLabel(article.category, locale)}
          </span>
          <span aria-hidden="true" className="opacity-45">
            ·
          </span>
          <span className="font-medium text-[#EDE6D8]/85">
            {getRegionLabel(article.region, locale)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onToggleBookmark(article.id)}
          aria-label={locale === 'fa' ? 'ذخیره خبر' : 'Save story'}
          className="magazine-circle-action !w-10 !h-10 !bg-[#080B12]/48 !border-[#F5F1E8]/22 !text-[#F6F2EA] hover:!border-[#F0D496]/70 hover:!text-[#F0D496] hover:!bg-[#0D1320]/76"
        >
          {isSaved ? (
            <BookmarkCheck className="w-4 h-4 text-[#F0D496]" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Bottom Ultra-Subtle Glassmorphism Editorial Plaque */}
      <div className="relative z-10 mt-auto p-5 sm:p-8 lg:p-9">
        <div className="magazine-glass-plaque rounded-[20px] p-6 sm:p-8 lg:p-9">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#EDE6D8]/78 mb-4">
            <span className="font-medium text-[#FDFBF7]">{article.author[locale]}</span>
            <span aria-hidden="true" className="opacity-40">
              ·
            </span>
            <span>{formatShortDate(article.publishedAt, locale)}</span>
            <span aria-hidden="true" className="opacity-40">
              ·
            </span>
            <span className="tabular-nums">
              {locale === 'fa'
                ? `${formatNumber(article.readTimeMin, locale)} دقیقه مطالعه`
                : `${article.readTimeMin} min read`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpen(article)}
            className="text-start block w-full cursor-pointer"
          >
            <h3
              className={`font-editorial-display text-[22px] sm:text-[30px] lg:text-[33px] font-bold text-[#FDFBF7] group-hover:text-[#F0D496] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] mb-4 line-clamp-3 ${
                locale === 'fa' ? 'leading-[1.46] sm:leading-[1.38]' : 'leading-[1.16]'
              }`}
            >
              {article.title[locale]}
            </h3>

            {cleanDeck && (
              <p className="text-[13.5px] sm:text-[15px] text-[#EDE6D8]/82 leading-[1.9] max-w-2xl mb-7 line-clamp-2">
                {cleanDeck}
              </p>
            )}
          </button>

          <div className="magazine-hairline !bg-[#F5F1E8]/14 mb-5" />

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-[#EDE6D8]/70 font-mono-tabular">
              {locale === 'fa'
                ? `${formatNumber(article.views, locale)} بازدید`
                : `${formatNumber(article.views, locale)} reads`}
            </span>

            <button
              type="button"
              onClick={() => onOpen(article)}
              className="group/cta inline-flex items-center gap-2.5 text-xs sm:text-[13px] font-bold text-[#F0D496] hover:text-[#FDFBF7] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer py-1"
            >
              <span>{locale === 'fa' ? 'مطالعه پرونده کامل' : 'Read Full Story'}</span>
              <span className="w-8 h-8 rounded-full border-[0.5px] border-[#F0D496]/45 bg-[#F0D496]/10 inline-flex items-center justify-center transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[#F0D496] group-hover:text-[#080A0F] group-hover:border-[#F0D496]">
                {locale === 'fa' ? (
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-0.5" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5" />
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * 2. Secondary Editorial Stack Card (5-col Companion Column)
 * Generous outer glass padding, nested-radius framed photograph, unboxed typographic index,
 * 0.5px hairline divider, and velvety cubic-bezier hover lift.
 */
export function MagazineSecondaryCard({
  article,
  locale,
  index = 0,
  isSaved,
  onOpen,
  onToggleBookmark,
}: CardBaseProps) {
  const cleanDeck = cleanEditorialDeck(article.title[locale], article.deck[locale], 130);

  return (
    <article className="magazine-card group rounded-[22px] p-5 sm:p-6 lg:p-7 flex gap-5 sm:gap-6 items-stretch flex-1 overflow-hidden">
      {/* Framed Gallery Thumbnail (Nested Radius: 22px - ~10px = 12px/14px) */}
      <button
        type="button"
        onClick={() => onOpen(article)}
        className="relative w-24 h-28 sm:w-36 sm:h-auto shrink-0 rounded-[14px] overflow-hidden bg-[#EAE2D3] dark:bg-[#0B0F18] border-[0.5px] border-[#141210]/10 dark:border-[#F5F1E8]/10 cursor-pointer self-center sm:self-stretch"
      >
        <EditorialImage
          src={resolveArticleCoverImage(article)}
          alt={article.title[locale]}
          fallbackLabel={article.title[locale]}
          className="magazine-media-img w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F]/28 via-transparent to-transparent opacity-45 group-hover:opacity-20 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
      </button>

      <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-[#5A5247] dark:text-[#A1AAB9] mb-2.5">
            <span className="font-mono-tabular font-semibold text-[#9A6B27]/85 dark:text-[#E8C680]/85">
              {formatEditorialIndex(index, locale)}
            </span>
            <span aria-hidden="true" className="opacity-35">
              /
            </span>
            <span className="font-bold text-[#9A6B27] dark:text-[#E8C680]">
              {getCategoryLabel(article.category, locale)}
            </span>
            <span aria-hidden="true" className="opacity-35">
              ·
            </span>
            <span>{getRegionLabel(article.region, locale)}</span>
          </div>

          <button
            type="button"
            onClick={() => onOpen(article)}
            className="text-start cursor-pointer block w-full"
          >
            <h3
              className={`font-editorial-display text-[16px] sm:text-[18.5px] font-bold text-[#141210] dark:text-[#F6F2EA] group-hover:text-[#9A6B27] dark:group-hover:text-[#E8C680] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] mb-2 line-clamp-2 ${
                locale === 'fa' ? 'leading-[1.54]' : 'leading-[1.28]'
              }`}
            >
              {article.title[locale]}
            </h3>
          </button>

          {cleanDeck && (
            <p className="hidden sm:line-clamp-2 text-[13px] text-[#5A5247]/90 dark:text-[#A1AAB9]/90 leading-[1.82]">
              {cleanDeck}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="magazine-hairline" />

          <div className="flex items-center justify-between gap-3 text-[11px] sm:text-xs text-[#5A5247] dark:text-[#A1AAB9]">
            <span className="truncate">{formatShortDate(article.publishedAt, locale)}</span>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onToggleBookmark(article.id)}
                aria-label={locale === 'fa' ? 'ذخیره خبر' : 'Save story'}
                className="magazine-circle-action !w-8 !h-8"
              >
                {isSaved ? (
                  <BookmarkCheck className="w-3.5 h-3.5 text-[#9A6B27] dark:text-[#E8C680]" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onOpen(article)}
                aria-label={locale === 'fa' ? 'مطالعه خبر' : 'Open story'}
                className="magazine-circle-action !w-8 !h-8 text-[#9A6B27] dark:text-[#E8C680] group-hover:border-[#9A6B27] dark:group-hover:border-[#E8C680] group-hover:bg-[#141210] group-hover:text-[#F6F2EA] dark:group-hover:bg-[#E8C680] dark:group-hover:text-[#080A0F]"
              >
                {locale === 'fa' ? (
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-0.5" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * 3. Tall Art-Monograph Portrait Dossier Card (Photojournalism Gallery)
 * Dramatic vertical plate, recessed 0.5px frame, unboxed folio metadata over gentle scrim,
 * and floating frosted glass caption chamber that elevates smoothly on hover.
 */
export function MagazinePortraitDossierCard({
  article,
  locale,
  index = 0,
  onOpen,
}: Omit<CardBaseProps, 'isSaved' | 'onToggleBookmark'>) {
  return (
    <article
      onClick={() => onOpen(article)}
      className="magazine-plate group rounded-[26px] overflow-hidden min-h-[430px] sm:min-h-[490px] flex flex-col justify-between bg-[#070A10] cursor-pointer"
    >
      <div className="absolute inset-0 overflow-hidden">
        <EditorialImage
          src={resolveArticleCoverImage(article)}
          alt={article.title[locale]}
          className="magazine-media-img w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070C]/92 via-[#05070C]/32 to-[#05070C]/34" />
        {/* Recessed 0.5px Inner Gallery Border */}
        <div
          aria-hidden="true"
          className="absolute inset-4 rounded-[18px] border-[0.5px] border-[#F5F1E8]/12 group-hover:border-[#F0D496]/38 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none"
        />
      </div>

      {/* Top Unboxed Editorial Folio */}
      <div className="relative z-10 px-7 pt-7 flex items-center justify-between text-xs">
        <span className="font-mono-tabular font-semibold tracking-[0.06em] text-[#F0D496]">
          {formatEditorialIndex(index, locale)}
        </span>
        <span className="font-medium text-[#F6F2EA]/85">
          {getRegionLabel(article.region, locale)}
        </span>
      </div>

      {/* Bottom Frosted Glass Caption Chamber */}
      <div className="relative z-10 p-5 sm:p-6">
        <div className="magazine-glass-plaque rounded-[18px] p-6 sm:p-7">
          <p className="text-xs font-bold text-[#F0D496] mb-2.5">
            {getCategoryLabel(article.category, locale)}
          </p>

          <h3
            className={`font-editorial-display text-[19px] sm:text-[21px] font-bold text-[#FDFBF7] group-hover:text-[#F0D496] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] mb-5 line-clamp-3 ${
              locale === 'fa' ? 'leading-[1.48]' : 'leading-[1.24]'
            }`}
          >
            {article.title[locale]}
          </h3>

          <div className="magazine-hairline !bg-[#F5F1E8]/14 mb-4" />

          <div className="flex items-center justify-between gap-3 text-xs text-[#EDE6D8]/78">
            <span className="truncate">{article.author[locale]}</span>
            <span className="inline-flex items-center gap-1.5 text-[#F0D496] font-bold shrink-0">
              <span>{locale === 'fa' ? 'مشاهده' : 'Open'}</span>
              {locale === 'fa' ? (
                <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-1" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1" />
              )}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * 4. Primary High-End Magazine Grid Card (Home Desks & Archive Grid)
 * Completely rewritten from scratch:
 * - Ultra-subtle frosted glass surface with 0.5px hairline border & 4-layer shadow depth
 * - Generous outer breathing padding (p-4 sm:p-5) framing a clean, zero-clutter photograph (nested radius math)
 * - Spacious editorial typography chamber (px-2.5 sm:px-3.5 pt-6 sm:pt-7 pb-2) with pure unboxed metadata
 * - Center-expanding 0.5px gold hairline + silky cubic-bezier hover micro-interactions
 */
export function MagazineArticleCard({
  article,
  locale,
  index = 0,
  isSaved,
  onOpen,
  onToggleBookmark,
}: CardBaseProps) {
  const cleanDeck = cleanEditorialDeck(article.title[locale], article.deck[locale], 160);

  return (
    <article className="magazine-card group rounded-[24px] p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
      <div className="relative z-10">
        <button
          type="button"
          onClick={() => onOpen(article)}
          className="block w-full text-start cursor-pointer"
        >
          {/* Clean, Uncluttered Framed Editorial Plate (Zero Floating Pills) */}
          <div className="relative aspect-[16/10] w-full rounded-[14px] overflow-hidden bg-[#EAE2D3] dark:bg-[#0B0F18] border-[0.5px] border-[#141210]/10 dark:border-[#F5F1E8]/10">
            <EditorialImage
              src={resolveArticleCoverImage(article)}
              alt={article.title[locale]}
              fallbackLabel={article.title[locale]}
              className="magazine-media-img w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F]/24 via-transparent to-transparent opacity-55 group-hover:opacity-25 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
          </div>

          {/* Spacious Editorial Typography Chamber */}
          <div className="px-2.5 sm:px-3.5 pt-6 sm:pt-7 pb-5 sm:pb-6">
            {/* Pure Unboxed Typographic Metadata Line */}
            <div className="flex flex-wrap items-center gap-2 text-[11.5px] sm:text-xs text-[#5A5247] dark:text-[#A1AAB9] mb-3.5">
              <span className="font-mono-tabular font-semibold text-[#9A6B27]/80 dark:text-[#E8C680]/80">
                {formatEditorialIndex(index, locale)}
              </span>
              <span aria-hidden="true" className="opacity-35">
                /
              </span>
              <span className="font-bold text-[#9A6B27] dark:text-[#E8C680]">
                {getCategoryLabel(article.category, locale)}
              </span>
              <span aria-hidden="true" className="opacity-35">
                ·
              </span>
              <span>{getRegionLabel(article.region, locale)}</span>
              <span aria-hidden="true" className="opacity-35">
                ·
              </span>
              <span className="tabular-nums">
                {locale === 'fa'
                  ? `${formatNumber(article.readTimeMin, locale)} دقیقه`
                  : `${article.readTimeMin} min`}
              </span>
            </div>

            <h3
              className={`font-editorial-display text-[19px] sm:text-[21.5px] font-bold text-[#141210] dark:text-[#F6F2EA] group-hover:text-[#9A6B27] dark:group-hover:text-[#E8C680] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] mb-3.5 line-clamp-3 ${
                locale === 'fa' ? 'leading-[1.52]' : 'leading-[1.24]'
              }`}
            >
              {article.title[locale]}
            </h3>

            {cleanDeck && (
              <p className="text-[13.5px] sm:text-[14.5px] text-[#5A5247]/92 dark:text-[#A1AAB9]/90 line-clamp-2 leading-[1.9]">
                {cleanDeck}
              </p>
            )}
          </div>
        </button>
      </div>

      {/* Breathing Footer with Center-Expanding 0.5px Gold Hairline */}
      <div className="relative z-10 px-2.5 sm:px-3.5 pb-2 pt-1">
        <div className="magazine-hairline mb-4 sm:mb-5" />

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2 text-[11.5px] sm:text-xs text-[#5A5247] dark:text-[#A1AAB9]">
            <span className="truncate font-medium text-[#141210]/85 dark:text-[#EDE6D8]/85">
              {article.author[locale]}
            </span>
            <span aria-hidden="true" className="opacity-35 shrink-0">
              ·
            </span>
            <span className="shrink-0 tabular-nums">
              {formatShortDate(article.publishedAt, locale)}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleBookmark(article.id)}
              aria-label={locale === 'fa' ? 'ذخیره خبر' : 'Toggle bookmark'}
              className="magazine-circle-action"
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 text-[#9A6B27] dark:text-[#E8C680]" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onOpen(article)}
              aria-label={locale === 'fa' ? 'مطالعه روایت' : 'Read story'}
              className="magazine-circle-action text-[#9A6B27] dark:text-[#E8C680] group-hover:border-[#9A6B27] dark:group-hover:border-[#E8C680] group-hover:bg-[#141210] group-hover:text-[#F6F2EA] dark:group-hover:bg-[#E8C680] dark:group-hover:text-[#080A0F]"
            >
              {locale === 'fa' ? (
                <ArrowLeft className="w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-0.5" />
              ) : (
                <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * 5. Archive Broadsheet Index Row Card (List View)
 * Framed horizontal plate, generous inner breathing margins, unboxed typography,
 * 0.5px expanding hairline, and synchronized hover glide.
 */
export function MagazineIndexRowCard({
  article,
  locale,
  index = 0,
  isSaved,
  onOpen,
  onToggleBookmark,
}: CardBaseProps) {
  const cleanDeck = cleanEditorialDeck(article.title[locale], article.deck[locale], 165);

  return (
    <article className="magazine-card group rounded-[22px] p-4 sm:p-5 lg:p-6 flex flex-col sm:flex-row sm:items-stretch gap-5 sm:gap-7 overflow-hidden">
      <button
        type="button"
        onClick={() => onOpen(article)}
        className="relative w-full sm:w-56 aspect-[16/10] sm:aspect-auto shrink-0 rounded-[14px] overflow-hidden bg-[#EAE2D3] dark:bg-[#0B0F18] border-[0.5px] border-[#141210]/10 dark:border-[#F5F1E8]/10 cursor-pointer"
      >
        <EditorialImage
          src={resolveArticleCoverImage(article)}
          alt={article.title[locale]}
          className="magazine-media-img w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F]/24 via-transparent to-transparent opacity-50 group-hover:opacity-20 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
      </button>

      <div className="relative z-10 flex-1 min-w-0 py-1 sm:py-1.5 flex flex-col justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5A5247] dark:text-[#A1AAB9] mb-3">
            <span className="font-mono-tabular font-semibold text-[#9A6B27]/85 dark:text-[#E8C680]/85">
              {formatEditorialIndex(index, locale)}
            </span>
            <span aria-hidden="true" className="opacity-35">
              /
            </span>
            <span className="font-bold text-[#9A6B27] dark:text-[#E8C680]">
              {getCategoryLabel(article.category, locale)}
            </span>
            <span aria-hidden="true" className="opacity-35">
              ·
            </span>
            <span>{getRegionLabel(article.region, locale)}</span>
            <span aria-hidden="true" className="opacity-35">
              ·
            </span>
            <span>{formatShortDate(article.publishedAt, locale)}</span>
          </div>

          <button
            type="button"
            onClick={() => onOpen(article)}
            className="text-start block w-full cursor-pointer"
          >
            <h3
              className={`font-editorial-display text-[19px] sm:text-[21px] font-bold text-[#141210] dark:text-[#F6F2EA] group-hover:text-[#9A6B27] dark:group-hover:text-[#E8C680] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] mb-2.5 line-clamp-2 ${
                locale === 'fa' ? 'leading-[1.5]' : 'leading-[1.24]'
              }`}
            >
              {article.title[locale]}
            </h3>
          </button>

          {cleanDeck && (
            <p className="text-[13.5px] sm:text-sm text-[#5A5247]/92 dark:text-[#A1AAB9]/90 line-clamp-2 leading-[1.88]">
              {cleanDeck}
            </p>
          )}
        </div>

        <div className="space-y-3.5">
          <div className="magazine-hairline" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#5A5247] dark:text-[#A1AAB9] font-mono-tabular">
              <span>
                {locale === 'fa'
                  ? `${formatNumber(article.views, locale)} بازدید`
                  : `${formatNumber(article.views, locale)} views`}
              </span>
              <span aria-hidden="true" className="opacity-35">
                ·
              </span>
              <span>
                {locale === 'fa'
                  ? `${formatNumber(article.readTimeMin, locale)} دقیقه`
                  : `${article.readTimeMin} min`}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onToggleBookmark(article.id)}
                aria-label={locale === 'fa' ? 'ذخیره خبر' : 'Save story'}
                className="magazine-circle-action"
              >
                {isSaved ? (
                  <BookmarkCheck className="w-4 h-4 text-[#9A6B27] dark:text-[#E8C680]" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onOpen(article)}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#141210] dark:text-[#F6F2EA] group-hover:text-[#9A6B27] dark:group-hover:text-[#E8C680] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ps-1"
              >
                <span>{locale === 'fa' ? 'مطالعه روایت' : 'Read Story'}</span>
                <span className="magazine-circle-action !w-9 !h-9 text-[#9A6B27] dark:text-[#E8C680] group-hover:border-[#9A6B27] dark:group-hover:border-[#E8C680] group-hover:bg-[#141210] group-hover:text-[#F6F2EA] dark:group-hover:bg-[#E8C680] dark:group-hover:text-[#080A0F]">
                  {locale === 'fa' ? (
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-0.5" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5" />
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
