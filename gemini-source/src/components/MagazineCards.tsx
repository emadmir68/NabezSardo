import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react';
import type { Article, Locale } from '../types/news';
import {
  formatEditorialIndex,
  formatNumber,
  formatShortDate,
  getCategoryLabel,
  getRegionLabel,
} from '../utils/formatters';
import { EditorialImage } from './EditorialImage';

const EDITORIAL_EASE = [0.16, 1, 0.3, 1] as const;

interface CardBaseProps {
  article: Article;
  locale: Locale;
  index?: number;
  isSaved: boolean;
  onOpen: (article: Article) => void;
  onToggleBookmark: (id: string) => void;
}

/**
 * 1. Flagship Magazine Cover Story Card (7-col Hero Spread)
 * Full-bleed cinema plate, generous negative space, frosted glass plaque, sculpted luxury CTA.
 */
export function MagazineLeadCard({
  article,
  locale,
  isSaved,
  onOpen,
  onToggleBookmark,
}: CardBaseProps) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.24, ease: EDITORIAL_EASE }}
      className="lg:col-span-7 relative group rounded-2xl overflow-hidden border-[0.75px] border-[#D9CEBC]/90 dark:border-[#D4A85B]/25 bg-[#070A10] min-h-[470px] sm:min-h-[560px] lg:min-h-[620px] flex flex-col justify-between shadow-[0_30px_70px_-28px_rgba(0,0,0,0.52)]"
    >
      {/* Full-Bleed Editorial Photograph */}
      <div className="absolute inset-0 overflow-hidden">
        <EditorialImage
          src={article.coverImage}
          alt={article.title[locale]}
          fallbackLabel={article.title[locale]}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070C] via-[#05070C]/58 to-[#05070C]/18" />
        {/* Recessed Hairline Inner Frame illuminating on hover */}
        <div className="absolute inset-3.5 sm:inset-4 rounded-xl border-[0.75px] border-[#E8C680]/0 group-hover:border-[#E8C680]/36 transition-colors duration-300 pointer-events-none" />
      </div>

      {/* Top Editorial Kicker & Precision Bookmark */}
      <div className="relative z-10 p-5 sm:p-8 flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 text-xs text-[#F6F2EA]/92 px-3.5 py-2 rounded-lg bg-[#080A10]/50 backdrop-blur-md border-[0.75px] border-[#F5F1E8]/16 group-hover:bg-[#080A10]/70 group-hover:border-[#E8C680]/40 transition-all duration-300">
          <span className="font-bold text-[#F0D496]">
            {getCategoryLabel(article.category, locale)}
          </span>
          <span aria-hidden="true" className="opacity-45">·</span>
          <span>{getRegionLabel(article.region, locale)}</span>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggleBookmark(article.id)}
          aria-label={locale === 'fa' ? 'ذخیره خبر' : 'Save story'}
          className="btn-icon-luxury !w-10 !h-10 !bg-[#080A10]/52 !border-[#F5F1E8]/20 !text-[#F6F2EA] hover:!border-[#E8C680] hover:!text-[#F0D496]"
        >
          {isSaved ? (
            <BookmarkCheck className="w-4 h-4 text-[#F0D496]" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      {/* Bottom Frosted Editorial Plaque */}
      <div className="relative z-10 mt-auto p-4 sm:p-7">
        <div className="rounded-xl p-5 sm:p-8 bg-[#080B12]/52 backdrop-blur-md group-hover:bg-[#0B101C]/78 group-hover:backdrop-blur-2xl border-[0.75px] border-[#F5F1E8]/12 group-hover:border-[#E8C680]/36 transition-all duration-300">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#EDE6D8]/82 mb-3.5">
            <span className="font-medium text-[#FDFBF7]">{article.author[locale]}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>{formatShortDate(article.publishedAt, locale)}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
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
              className={`font-editorial-display text-[22px] sm:text-3xl lg:text-[34px] font-bold text-[#FDFBF7] group-hover:text-[#F0D496] transition-colors duration-200 mb-3.5 ${
                locale === 'fa' ? 'leading-[1.45] sm:leading-[1.38]' : 'leading-[1.18]'
              }`}
            >
              {article.title[locale]}
            </h3>
            <p className="text-[13.5px] sm:text-[15.5px] text-[#EDE6D8]/86 leading-[1.85] max-w-2xl mb-6 line-clamp-3">
              {article.deck[locale]}
            </p>
          </button>

          <div className="pt-4 sm:pt-5 border-t-[0.75px] border-[#F5F1E8]/15 flex items-center justify-between gap-4">
            <span className="text-xs text-[#EDE6D8]/75 font-mono-tabular">
              {locale === 'fa'
                ? `${formatNumber(article.views, locale)} بازدید`
                : `${formatNumber(article.views, locale)} reads`}
            </span>

            <button
              type="button"
              onClick={() => onOpen(article)}
              className="btn-luxury-gold !min-h-[40px] !px-4 sm:!px-5 !py-2 text-xs sm:text-[13px]"
            >
              <span>{locale === 'fa' ? 'مطالعه پرونده' : 'Read Story'}</span>
              {locale === 'fa' ? (
                <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/**
 * 2. Secondary Horizontal Magazine Card (5-col Editorial Stack)
 * Balanced on mobile (clean crop, generous text column) and spacious on desktop with hover glassmorphism.
 */
export function MagazineSecondaryCard({
  article,
  locale,
  index = 0,
  isSaved,
  onOpen,
  onToggleBookmark,
}: CardBaseProps) {
  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
      className="magazine-card group rounded-2xl p-4 sm:p-6 flex gap-4 sm:gap-5 items-stretch flex-1 overflow-hidden"
    >
      {/* Top Specular Gold Hairline Glow */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#9A6B27]/0 dark:via-[#E8C680]/0 group-hover:via-[#9A6B27]/60 dark:group-hover:via-[#E8C680]/65 transition-all duration-300 pointer-events-none" />

      <button
        type="button"
        onClick={() => onOpen(article)}
        className="relative w-24 h-28 sm:w-36 sm:h-auto shrink-0 rounded-xl overflow-hidden bg-[#ECE4D5] dark:bg-[#0B0F18] cursor-pointer self-center sm:self-stretch"
      >
        <EditorialImage
          src={article.coverImage}
          alt={article.title[locale]}
          fallbackLabel={article.title[locale]}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F]/45 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        <span className="absolute top-2 start-2 font-mono-tabular text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#080A10]/65 backdrop-blur-md text-[#F0D496] border-[0.5px] border-[#F5F1E8]/18">
          {formatEditorialIndex(index, locale)}
        </span>
      </button>

      <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#5A5247] dark:text-[#A1AAB9] mb-1.5 sm:mb-2">
            <span className="font-bold text-[#9A6B27] dark:text-[#E8C680]">
              {getCategoryLabel(article.category, locale)}
            </span>
            <span aria-hidden="true" className="opacity-45">·</span>
            <span>{getRegionLabel(article.region, locale)}</span>
          </div>

          <button
            type="button"
            onClick={() => onOpen(article)}
            className="text-start cursor-pointer block w-full"
          >
            <h3
              className={`font-editorial-display text-[16px] sm:text-[19px] font-bold text-[#141210] dark:text-[#F6F2EA] group-hover:text-[#9A6B27] dark:group-hover:text-[#E8C680] transition-colors duration-200 mb-1.5 sm:mb-2 line-clamp-2 ${
                locale === 'fa' ? 'leading-[1.52]' : 'leading-[1.28]'
              }`}
            >
              {article.title[locale]}
            </h3>
          </button>

          <p className="hidden sm:line-clamp-2 text-[13px] text-[#5A5247] dark:text-[#A1AAB9] leading-[1.75]">
            {article.deck[locale]}
          </p>
        </div>

        <div className="pt-2.5 border-t-[0.75px] border-[#D9CEBC]/70 dark:border-[#D4A85B]/14 flex items-center justify-between gap-2 text-[11px] sm:text-xs text-[#5A5247] dark:text-[#A1AAB9]">
          <span className="truncate">{formatShortDate(article.publishedAt, locale)}</span>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => onToggleBookmark(article.id)}
              aria-label={locale === 'fa' ? 'ذخیره خبر' : 'Save story'}
              className="w-8 h-8 inline-flex items-center justify-center rounded-full border-[0.75px] border-[#D9CEBC]/80 dark:border-[#D4A85B]/18 hover:border-[#9A6B27] dark:hover:border-[#E8C680] hover:text-[#9A6B27] dark:hover:text-[#E8C680] transition-colors cursor-pointer"
            >
              {isSaved ? (
                <BookmarkCheck className="w-3.5 h-3.5 text-[#9A6B27] dark:text-[#E8C680]" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
            </motion.button>
            <button
              type="button"
              onClick={() => onOpen(article)}
              aria-label={locale === 'fa' ? 'مطالعه خبر' : 'Open story'}
              className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-[#141210]/6 dark:bg-[#E8C680]/12 text-[#9A6B27] dark:text-[#E8C680] group-hover:bg-[#9A6B27] group-hover:text-[#FDFBF7] dark:group-hover:bg-[#E8C680] dark:group-hover:text-[#080A0F] transition-colors cursor-pointer"
            >
              {locale === 'fa' ? (
                <ArrowLeft className="w-3.5 h-3.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/**
 * 3. Tall Visual Portrait Dossier Card (Photojournalism Poster Gallery)
 * Dramatic vertical crop, recessed hairline inset, frosted glass plaque rising on hover.
 */
export function MagazinePortraitDossierCard({
  article,
  locale,
  index = 0,
  onOpen,
}: Omit<CardBaseProps, 'isSaved' | 'onToggleBookmark'>) {
  return (
    <motion.article
      whileHover={{ y: -5 }}
      transition={{ duration: 0.24, ease: EDITORIAL_EASE }}
      onClick={() => onOpen(article)}
      className="group relative rounded-2xl overflow-hidden min-h-[410px] sm:min-h-[465px] flex flex-col justify-between border-[0.75px] border-[#D9CEBC]/85 dark:border-[#D4A85B]/22 bg-[#070A10] cursor-pointer shadow-[0_26px_60px_-26px_rgba(0,0,0,0.52)]"
    >
      <div className="absolute inset-0 overflow-hidden">
        <EditorialImage
          src={article.coverImage}
          alt={article.title[locale]}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070C] via-[#05070C]/45 to-transparent" />
        <div className="absolute inset-3.5 rounded-xl border-[0.75px] border-[#E8C680]/0 group-hover:border-[#E8C680]/42 transition-colors duration-300 pointer-events-none" />
      </div>

      {/* Top Editorial Folio */}
      <div className="relative z-10 p-5 flex items-center justify-between">
        <span className="font-mono-tabular text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#080A10]/55 backdrop-blur-md border-[0.5px] border-[#F5F1E8]/16 text-[#F0D496]">
          {formatEditorialIndex(index, locale)}
        </span>
        <span className="text-[11px] font-medium text-[#F6F2EA]/90 px-3 py-1 rounded-lg bg-[#080A10]/45 backdrop-blur-md border-[0.5px] border-[#F5F1E8]/14">
          {getRegionLabel(article.region, locale)}
        </span>
      </div>

      {/* Bottom Frosted Glass Editorial Caption */}
      <div className="relative z-10 p-4 sm:p-5">
        <div className="rounded-xl p-5 sm:p-6 bg-[#080B12]/54 backdrop-blur-md group-hover:bg-[#0B101C]/80 group-hover:backdrop-blur-2xl border-[0.75px] border-[#F5F1E8]/14 group-hover:border-[#E8C680]/38 transition-all duration-300 group-hover:-translate-y-1">
          <p className="text-xs font-bold text-[#F0D496] mb-2">
            {getCategoryLabel(article.category, locale)}
          </p>

          <h3
            className={`font-editorial-display text-[19px] sm:text-[21px] font-bold text-[#FDFBF7] group-hover:text-[#F0D496] transition-colors duration-200 mb-4 ${
              locale === 'fa' ? 'leading-[1.48]' : 'leading-[1.25]'
            }`}
          >
            {article.title[locale]}
          </h3>

          <div className="flex items-center justify-between text-xs text-[#EDE6D8]/80 pt-3.5 border-t-[0.75px] border-[#F5F1E8]/15">
            <span className="truncate">{article.author[locale]}</span>
            <span className="inline-flex items-center gap-1.5 text-[#F0D496] font-bold shrink-0">
              <span>{locale === 'fa' ? 'مشاهده پرونده' : 'Read Dossier'}</span>
              {locale === 'fa' ? (
                <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              )}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/**
 * 4. Primary High-End Magazine Grid Card (Desks & Archive Grid)
 * Full-bleed edge-to-edge editorial photograph, Persian Naskh display serif,
 * generous negative space, tactile circular bookmark + visible luxury read trigger.
 */
export function MagazineArticleCard({
  article,
  locale,
  index = 0,
  isSaved,
  onOpen,
  onToggleBookmark,
}: CardBaseProps) {
  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
      className="magazine-card group rounded-2xl overflow-hidden flex flex-col justify-between"
    >
      {/* Top Specular Gold Hairline Glow */}
      <div className="absolute inset-x-0 top-0 z-20 h-[1px] bg-gradient-to-r from-transparent via-[#9A6B27]/0 dark:via-[#E8C680]/0 group-hover:via-[#9A6B27]/65 dark:group-hover:via-[#E8C680]/70 transition-all duration-300 pointer-events-none" />

      <div>
        <button
          type="button"
          onClick={() => onOpen(article)}
          className="block w-full text-start cursor-pointer"
        >
          {/* Full-Bleed Edge-to-Edge Editorial Photograph */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#ECE4D5] dark:bg-[#0B0F18] border-b-[0.75px] border-[#D9CEBC]/70 dark:border-[#D4A85B]/14">
            <EditorialImage
              src={article.coverImage}
              alt={article.title[locale]}
              fallbackLabel={article.title[locale]}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.065]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06080D]/72 via-[#06080D]/10 to-transparent opacity-80 group-hover:opacity-92 transition-opacity duration-300" />

            {/* Top Folio Index & Region Stamp */}
            <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 text-[11px] font-mono-tabular font-semibold bg-[#080A10]/60 backdrop-blur-md text-[#F0D496] rounded-md border-[0.5px] border-[#F5F1E8]/16">
                {formatEditorialIndex(index, locale)}
              </span>
              <span className="px-2.5 py-1 text-[11px] font-medium bg-[#080A10]/50 backdrop-blur-md text-[#F6F2EA]/92 rounded-md border-[0.5px] border-[#F5F1E8]/14">
                {getRegionLabel(article.region, locale)}
              </span>
            </div>

            {/* Bottom Frosted Glass Category Strip */}
            <div className="absolute inset-x-3.5 bottom-3 flex items-center justify-between text-[11px] text-[#F6F2EA]">
              <span className="px-2.5 py-1 rounded-md bg-[#080A10]/58 backdrop-blur-md border-[0.5px] border-[#E8C680]/28 font-bold text-[#F0D496]">
                {getCategoryLabel(article.category, locale)}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#080A10]/52 backdrop-blur-md border-[0.5px] border-[#F5F1E8]/14 tabular-nums text-[#EDE6D8]/90">
                {locale === 'fa'
                  ? `${formatNumber(article.readTimeMin, locale)} دقیقه`
                  : `${article.readTimeMin} min`}
              </span>
            </div>
          </div>

          {/* Airy Editorial Typography Block */}
          <div className="px-5 sm:px-7 pt-5 sm:pt-7 pb-5">
            <div className="flex items-center gap-2 text-xs text-[#5A5247] dark:text-[#A1AAB9] mb-3">
              <span className="font-medium text-[#141210] dark:text-[#EDE6D8]">
                {article.author[locale]}
              </span>
              <span aria-hidden="true" className="opacity-40">·</span>
              <span>{formatShortDate(article.publishedAt, locale)}</span>
            </div>

            <h3
              className={`font-editorial-display text-[19px] sm:text-[22px] font-bold text-[#141210] dark:text-[#F6F2EA] group-hover:text-[#9A6B27] dark:group-hover:text-[#E8C680] transition-colors duration-200 mb-3 ${
                locale === 'fa' ? 'leading-[1.5]' : 'leading-[1.25]'
              }`}
            >
              {article.title[locale]}
            </h3>

            <p className="text-[13.5px] sm:text-[14px] text-[#5A5247] dark:text-[#A1AAB9] line-clamp-3 leading-[1.85]">
              {article.deck[locale]}
            </p>
          </div>
        </button>
      </div>

      {/* Expanding Champagne Hairline + Sculpted Action Footer */}
      <div className="px-5 sm:px-7 pb-5 sm:pb-6 pt-1">
        <div className="relative h-[0.75px] w-full bg-[#D9CEBC]/75 dark:bg-[#D4A85B]/16 mb-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#9A6B27] via-[#F0D496] to-[#9A6B27] scale-x-0 group-hover:scale-x-100 origin-center transition-transform duration-300 ease-out" />
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpen(article)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold border-[0.75px] border-[#D9CEBC] dark:border-[#D4A85B]/24 bg-[#F5F0E6]/70 dark:bg-[#141B2B]/65 text-[#141210] dark:text-[#F6F2EA] group-hover:border-[#9A6B27] dark:group-hover:border-[#E8C680] group-hover:bg-[#141210] group-hover:text-[#F6F2EA] dark:group-hover:bg-[#E8C680] dark:group-hover:text-[#080A0F] transition-all duration-200 cursor-pointer"
          >
            <span>{locale === 'fa' ? 'مطالعه روایت' : 'Read Story'}</span>
            {locale === 'fa' ? (
              <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            )}
          </button>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] font-mono-tabular text-[#5A5247] dark:text-[#A1AAB9]">
              {locale === 'fa'
                ? `${formatNumber(article.views, locale)} بازدید`
                : `${formatNumber(article.views, locale)}`}
            </span>

            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => onToggleBookmark(article.id)}
              aria-label={locale === 'fa' ? 'ذخیره خبر' : 'Toggle bookmark'}
              className="btn-icon-luxury !w-9 !h-9"
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 text-[#9A6B27] dark:text-[#E8C680]" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/**
 * 5. Archive Broadsheet Index Row Card (Compact List View)
 * Clean mobile stacking + refined desktop broadsheet layout with crisp tactile actions.
 */
export function MagazineIndexRowCard({
  article,
  locale,
  index = 0,
  isSaved,
  onOpen,
  onToggleBookmark,
}: CardBaseProps) {
  return (
    <motion.article
      layout
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
      className="magazine-card group rounded-2xl overflow-hidden flex flex-col sm:flex-row sm:items-stretch"
    >
      <div className="absolute inset-x-0 top-0 z-10 h-[1px] bg-gradient-to-r from-transparent via-[#9A6B27]/0 dark:via-[#E8C680]/0 group-hover:via-[#9A6B27]/60 dark:group-hover:via-[#E8C680]/60 transition-all duration-300 pointer-events-none" />

      <button
        type="button"
        onClick={() => onOpen(article)}
        className="relative w-full sm:w-52 aspect-[16/9] sm:aspect-auto shrink-0 overflow-hidden bg-[#ECE4D5] dark:bg-[#0B0F18] cursor-pointer"
      >
        <EditorialImage
          src={article.coverImage}
          alt={article.title[locale]}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />
        <span className="absolute top-3 start-3 font-mono-tabular text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#080A10]/62 backdrop-blur-md text-[#F0D496] border-[0.5px] border-[#F5F1E8]/16">
          {formatEditorialIndex(index, locale)}
        </span>
      </button>

      <div className="flex-1 min-w-0 p-5 sm:p-6 flex flex-col justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5A5247] dark:text-[#A1AAB9] mb-2">
            <span className="font-bold text-[#9A6B27] dark:text-[#E8C680]">
              {getCategoryLabel(article.category, locale)}
            </span>
            <span aria-hidden="true" className="opacity-45">·</span>
            <span>{getRegionLabel(article.region, locale)}</span>
            <span aria-hidden="true" className="opacity-45">·</span>
            <span>{formatShortDate(article.publishedAt, locale)}</span>
          </div>

          <button
            type="button"
            onClick={() => onOpen(article)}
            className="text-start block w-full cursor-pointer"
          >
            <h3
              className={`font-editorial-display text-lg sm:text-[21px] font-bold text-[#141210] dark:text-[#F6F2EA] group-hover:text-[#9A6B27] dark:group-hover:text-[#E8C680] transition-colors duration-200 mb-2 ${
                locale === 'fa' ? 'leading-[1.48]' : 'leading-[1.25]'
              }`}
            >
              {article.title[locale]}
            </h3>
          </button>
          <p className="text-[13px] sm:text-sm text-[#5A5247] dark:text-[#A1AAB9] line-clamp-2 leading-[1.8]">
            {article.deck[locale]}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t-[0.75px] border-[#D9CEBC]/65 dark:border-[#D4A85B]/14">
          <span className="text-xs font-mono-tabular text-[#5A5247] dark:text-[#A1AAB9]">
            {locale === 'fa'
              ? `${formatNumber(article.views, locale)} بازدید`
              : `${formatNumber(article.views, locale)} views`}
          </span>

          <div className="flex items-center gap-2.5">
            <motion.button
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => onToggleBookmark(article.id)}
              aria-label={locale === 'fa' ? 'ذخیره خبر' : 'Save story'}
              className="btn-icon-luxury !w-9 !h-9"
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 text-[#9A6B27] dark:text-[#E8C680]" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </motion.button>
            <button
              type="button"
              onClick={() => onOpen(article)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#141210]/6 dark:bg-[#E8C680]/12 text-[#9A6B27] dark:text-[#E8C680] group-hover:bg-[#9A6B27] group-hover:text-[#FDFBF7] dark:group-hover:bg-[#E8C680] dark:group-hover:text-[#080A0F] transition-colors cursor-pointer"
            >
              <span>{locale === 'fa' ? 'مطالعه' : 'Read'}</span>
              {locale === 'fa' ? (
                <ArrowLeft className="w-3.5 h-3.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
