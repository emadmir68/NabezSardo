import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Play } from 'lucide-react';
import type { Article, CategoryId, Locale } from '../types/news';
import {
  cleanEditorialDeck,
  formatEditorialIndex,
  formatNumber,
  formatRelativeTime,
  getCategoryLabel,
  getRegionLabel,
  hasRealEditorialPhoto,
} from '../utils/formatters';
import { EditorialImage } from './EditorialImage';

export interface MagazineCardProps {
  article: Article;
  locale: Locale;
  isBookmarked?: boolean;
  isSaved?: boolean;
  onToggleBookmark?: (id: string) => void;
  onOpenArticle?: (article: Article) => void;
  onOpen?: (article: Article) => void;
  index?: number;
}

function resolveOpen(props: MagazineCardProps) {
  return props.onOpenArticle ?? props.onOpen ?? (() => {});
}

function resolveBookmarked(props: MagazineCardProps) {
  return Boolean(props.isBookmarked ?? props.isSaved);
}

interface DeskStyle {
  code: string;
  accentHex: string;
  accentBgClass: string;
  accentTextClass: string;
  stripClass: string;
}

const DESK_STYLES: Record<CategoryId, DeskStyle> = {
  sarduiyeh: {
    code: '01',
    accentHex: '#C69546',
    accentBgClass: 'bg-[#8F6321]/10 dark:bg-[#D4A85B]/15',
    accentTextClass: 'text-[#8F6321] dark:text-[#ECC983]',
    stripClass: 'from-[#D4A85B] via-[#BA8433] to-transparent',
  },
  agriculture: {
    code: '02',
    accentHex: '#3B825E',
    accentBgClass: 'bg-[#2C6B4B]/10 dark:bg-[#4FA678]/15',
    accentTextClass: 'text-[#265E42] dark:text-[#7CD1A2]',
    stripClass: 'from-[#4FA678] via-[#2C6B4B] to-transparent',
  },
  social: {
    code: '03',
    accentHex: '#3A6EA5',
    accentBgClass: 'bg-[#285382]/10 dark:bg-[#5E97D1]/15',
    accentTextClass: 'text-[#234A75] dark:text-[#8BBCED]',
    stripClass: 'from-[#5E97D1] via-[#285382] to-transparent',
  },
  politics: {
    code: '04',
    accentHex: '#A63A4B',
    accentBgClass: 'bg-[#8C2B3B]/10 dark:bg-[#D96B7D]/15',
    accentTextClass: 'text-[#872434] dark:text-[#F099A7]',
    stripClass: 'from-[#D96B7D] via-[#8C2B3B] to-transparent',
  },
  culture: {
    code: '05',
    accentHex: '#8E5A9E',
    accentBgClass: 'bg-[#6F3F7D]/10 dark:bg-[#B883C9]/15',
    accentTextClass: 'text-[#6A3B78] dark:text-[#D4A6E3]',
    stripClass: 'from-[#B883C9] via-[#6F3F7D] to-transparent',
  },
  weather: {
    code: '06',
    accentHex: '#2E7D8F',
    accentBgClass: 'bg-[#226270]/10 dark:bg-[#57B1C4]/15',
    accentTextClass: 'text-[#1E5966] dark:text-[#86CFE0]',
    stripClass: 'from-[#57B1C4] via-[#226270] to-transparent',
  },
  incidents: {
    code: '07',
    accentHex: '#C45335',
    accentBgClass: 'bg-[#A63F24]/10 dark:bg-[#E07A5F]/15',
    accentTextClass: 'text-[#9B3920] dark:text-[#F29E88]',
    stripClass: 'from-[#E07A5F] via-[#A63F24] to-transparent',
  },
  sports: {
    code: '08',
    accentHex: '#1F8A70',
    accentBgClass: 'bg-[#176E59]/10 dark:bg-[#49B89C]/15',
    accentTextClass: 'text-[#156451] dark:text-[#78D9C0]',
    stripClass: 'from-[#49B89C] via-[#176E59] to-transparent',
  },
  opinion: {
    code: '09',
    accentHex: '#9C7A3C',
    accentBgClass: 'bg-[#7A5D28]/10 dark:bg-[#D1AF71]/15',
    accentTextClass: 'text-[#735622] dark:text-[#E5CA95]',
    stripClass: 'from-[#D1AF71] via-[#7A5D28] to-transparent',
  },
  'short-news': {
    code: '10',
    accentHex: '#B06A2E',
    accentBgClass: 'bg-[#8F521E]/10 dark:bg-[#DC9252]/15',
    accentTextClass: 'text-[#844B1A] dark:text-[#EEB37E]',
    stripClass: 'from-[#DC9252] via-[#8F521E] to-transparent',
  },
};

function deskFor(category: CategoryId): DeskStyle {
  return DESK_STYLES[category] ?? DESK_STYLES.social;
}

/** Fine-line topographic & contour plate texture for text-first editorial cards */
function TopographicPlateWatermark({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 360 140"
      fill="none"
      className="pointer-events-none select-none w-full h-full opacity-[0.075] dark:opacity-[0.095]"
    >
      <path
        d="M-10 110C48 74 96 92 146 66C196 40 242 52 296 24C326 8 348 16 372 6"
        stroke={color}
        strokeWidth="1"
      />
      <path
        d="M-10 128C56 96 108 112 162 84C216 56 266 68 320 40C342 29 358 32 372 24"
        stroke={color}
        strokeWidth="0.9"
      />
      <path
        d="M12 140C72 114 128 128 184 98C236 70 284 82 346 52"
        stroke={color}
        strokeWidth="0.8"
      />
      <circle cx="298" cy="24" r="3" stroke={color} strokeWidth="1" />
    </svg>
  );
}

function DeskBadge({ article, locale }: { article: Article; locale: Locale }) {
  const desk = deskFor(article.category);
  const locationText = article.locationLabel || getRegionLabel(article.region, locale);
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${desk.accentBgClass} ${desk.accentTextClass}`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: desk.accentHex }}
        />
        <span>{getCategoryLabel(article.category, locale)}</span>
      </span>
      <span className="text-[#5B5246] dark:text-[#A3ADBF] font-medium truncate">
        {locationText}
      </span>
    </div>
  );
}

function MetaFooter({
  article,
  locale,
  isBookmarked,
  onToggleBookmark,
}: {
  article: Article;
  locale: Locale;
  isBookmarked: boolean;
  onToggleBookmark?: (id: string) => void;
}) {
  const ReadArrow = locale === 'fa' ? ArrowLeft : ArrowRight;
  return (
    <div className="pt-3.5 mt-auto">
      <div className="magazine-hairline mb-3" />
      <div className="flex items-center justify-between gap-2 text-[11.5px] text-[#5B5246] dark:text-[#A3ADBF]">
        <div className="flex items-center gap-2 min-w-0 truncate">
          <time dateTime={article.publishedAt} className="truncate font-medium">
            {formatRelativeTime(article.publishedAt, locale)}
          </time>
          <span aria-hidden="true" className="opacity-35">·</span>
          <span className="tabular-nums shrink-0">
            {locale === 'fa'
              ? `${formatNumber(article.readTimeMin, 'fa')} دقیقه`
              : `${article.readTimeMin} min`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleBookmark && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(article.id);
              }}
              className={`magazine-circle-action !w-9 !h-9 !min-w-[36px] !min-h-[36px] ${
                isBookmarked ? '!border-[#8F6321] dark:!border-[#ECC983] !text-[#8F6321] dark:!text-[#ECC983]' : ''
              }`}
              aria-label={
                isBookmarked
                  ? locale === 'fa'
                    ? 'حذف از نشان‌شده‌ها'
                    : 'Remove bookmark'
                  : locale === 'fa'
                    ? 'ذخیره خبر'
                    : 'Save story'
              }
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4" strokeWidth={2} />
              ) : (
                <Bookmark className="w-4 h-4" strokeWidth={1.8} />
              )}
            </button>
          )}

          <span
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11.5px] font-bold text-[#8F6321] dark:text-[#ECC983] group-hover:bg-[#8F6321]/10 dark:group-hover:bg-[#ECC983]/12 transition-colors"
          >
            <span>{locale === 'fa' ? 'مطالعه' : 'Read'}</span>
            <ReadArrow className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:-translate-x-0.5 ltr:group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 1. Flagship Lead Card (7-col primary broadsheet anchor):
 *    Spans 7 of 12 grid columns beside the 5-col secondary stack,
 *    adapting between a crisp 16:10 photographic spread and a luxury topographic plate.
 */
export function MagazineLeadCard(props: MagazineCardProps) {
  const { article, locale, onToggleBookmark, index = 0 } = props;
  const openArticle = resolveOpen(props);
  const isBookmarked = resolveBookmarked(props);
  const hasPhoto = hasRealEditorialPhoto(article);
  const desk = deskFor(article.category);
  const deck = cleanEditorialDeck(article.title[locale], article.deck[locale], hasPhoto ? 230 : 320);
  const ReadArrow = locale === 'fa' ? ArrowLeft : ArrowRight;

  return (
    <article
      onClick={() => openArticle(article)}
      className="lg:col-span-7 group magazine-plate rounded-[22px] overflow-hidden cursor-pointer flex flex-col justify-between h-full bg-[#FFFDF8] dark:bg-[#0D111C]"
    >
      {hasPhoto ? (
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-[#0E131F] shrink-0">
          <EditorialImage
            src={article.coverImage}
            alt={article.title[locale]}
            className="magazine-media-img w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(8,10,16,0.1) 0%, rgba(8,10,16,0.03) 55%, rgba(8,10,16,0.48) 100%)',
            }}
          />
          {article.videoUrl && (
            <span className="absolute top-4 end-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 text-[#F5F1E8] text-xs font-bold border border-white/20 backdrop-blur-md">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{locale === 'fa' ? 'گزارش ویدئویی' : 'Video'}</span>
            </span>
          )}
          <span className="font-mono-tabular absolute bottom-4 start-4 px-3 py-1 rounded-full bg-black/65 text-[#F1D79A] text-xs font-bold border border-[#D4A85B]/35 backdrop-blur-md">
            {formatEditorialIndex(index, locale)} / LEAD
          </span>
        </div>
      ) : (
        <div className="relative px-6 sm:px-8 pt-6 pb-5 bg-gradient-to-br from-[#EFE6D6] via-[#F7F1E6] to-[#E6DAC4] dark:from-[#121828] dark:via-[#0D121E] dark:to-[#182034] border-b border-[#D9CEBA] dark:border-[#252E42] overflow-hidden shrink-0">
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ backgroundColor: desk.accentHex }}
          />
          <div className="absolute inset-0 pointer-events-none">
            <TopographicPlateWatermark color={desk.accentHex} />
          </div>
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="font-mono-tabular px-2.5 py-1 rounded-full bg-[#161310]/8 dark:bg-[#F5F1E8]/10 text-xs font-extrabold text-[#8F6321] dark:text-[#ECC983]">
                {formatEditorialIndex(index, locale)} / LEAD
              </span>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#5B5246] dark:text-[#A3ADBF]">
                {locale === 'fa' ? 'پرونده اصلی تحریریه' : 'EDITORIAL LEAD'}
              </span>
            </div>
            <span className="hidden sm:inline text-[11px] font-mono-tabular text-[#5B5246]/80 dark:text-[#A3ADBF]/80">
              28° 40′ N · 57° 44′ E
            </span>
          </div>
        </div>
      )}

      {/* Editorial Typography & Actions */}
      <div className="p-6 sm:p-8 lg:p-9 flex flex-col justify-between flex-1 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <DeskBadge article={article} locale={locale} />
            {onToggleBookmark && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(article.id);
                }}
                className="magazine-circle-action shrink-0"
                aria-label={isBookmarked ? 'Remove bookmark' : 'Save story'}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-4.5 h-4.5 text-[#8F6321] dark:text-[#ECC983]" />
                ) : (
                  <Bookmark className="w-4.5 h-4.5" />
                )}
              </button>
            )}
          </div>

          {article.kicker && (
            <p className="text-xs font-bold text-[#8F6321] dark:text-[#ECC983]">
              {article.kicker}
            </p>
          )}

          <h3
            className={`font-editorial-display font-extrabold text-[#161310] dark:text-[#F5F1E8] group-hover:text-[#8F6321] dark:group-hover:text-[#ECC983] transition-colors ${
              hasPhoto
                ? 'text-xl sm:text-2xl lg:text-[1.85rem]'
                : 'text-2xl sm:text-3xl lg:text-[2.15rem]'
            } ${locale === 'fa' ? 'leading-[1.45]' : 'leading-[1.18]'}`}
          >
            {article.title[locale]}
          </h3>

          {deck && (
            <p
              className={`text-sm sm:text-[15.5px] text-[#5B5246] dark:text-[#A3ADBF] leading-[1.95] ${
                hasPhoto ? 'line-clamp-3' : 'line-clamp-4'
              }`}
            >
              {deck}
            </p>
          )}
        </div>

        <div className="space-y-4 mt-auto">
          <div className="magazine-hairline" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5B5246] dark:text-[#A3ADBF]">
              <span className="font-semibold text-[#161310] dark:text-[#E7E0D3]">
                {article.author[locale]}
              </span>
              <span aria-hidden="true" className="opacity-35">·</span>
              <time dateTime={article.publishedAt}>
                {formatRelativeTime(article.publishedAt, locale)}
              </time>
              <span aria-hidden="true" className="opacity-35">·</span>
              <span className="tabular-nums">
                {locale === 'fa'
                  ? `${formatNumber(article.readTimeMin, 'fa')} دقیقه مطالعه`
                  : `${article.readTimeMin} min read`}
              </span>
            </div>

            <span className="btn-luxury-ink !text-xs sm:!text-sm !px-5 !min-h-[44px]">
              <span>{locale === 'fa' ? 'خواندن گزارش کامل' : 'Read full dispatch'}</span>
              <ReadArrow className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * 2. Secondary Split Card: Crisp horizontal brief/feature slot next to or below the Lead.
 */
export function MagazineSecondaryCard(props: MagazineCardProps) {
  const { article, locale, onToggleBookmark, index = 0 } = props;
  const openArticle = resolveOpen(props);
  const isBookmarked = resolveBookmarked(props);
  const hasPhoto = hasRealEditorialPhoto(article);
  const desk = deskFor(article.category);
  const deck = cleanEditorialDeck(article.title[locale], article.deck[locale], 125);

  return (
    <article
      onClick={() => openArticle(article)}
      className="group magazine-card rounded-2xl p-4 sm:p-5 cursor-pointer flex flex-col justify-between h-full overflow-hidden"
    >
      <div
        className={`h-[2px] w-full bg-gradient-to-r ${desk.stripClass} opacity-75 rounded-full mb-3.5`}
      />

      <div className="flex items-start gap-4">
        {hasPhoto ? (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-[#10141F] border border-[#D9CEBA]/60 dark:border-[#252E42]">
            <EditorialImage
              src={article.coverImage}
              alt={article.title[locale]}
              className="magazine-media-img w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl shrink-0 flex flex-col items-center justify-center bg-[#EFE7D8] dark:bg-[#171E30] border border-[#D9CEBA] dark:border-[#252E42]">
            <span className="font-mono-tabular text-base font-extrabold text-[#8F6321] dark:text-[#ECC983]">
              {formatEditorialIndex(index, locale)}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-[#5B5246] dark:text-[#A3ADBF]">
              {desk.code}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-2">
          <DeskBadge article={article} locale={locale} />
          <h3
            className={`font-editorial-display text-base sm:text-[17px] font-bold text-[#161310] dark:text-[#F5F1E8] group-hover:text-[#8F6321] dark:group-hover:text-[#ECC983] transition-colors line-clamp-2 ${
              locale === 'fa' ? 'leading-[1.55]' : 'leading-[1.3]'
            }`}
          >
            {article.title[locale]}
          </h3>
          {deck && (
            <p className="text-xs text-[#5B5246] dark:text-[#A3ADBF] line-clamp-2 leading-[1.75]">
              {deck}
            </p>
          )}
        </div>
      </div>

      <MetaFooter
        article={article}
        locale={locale}
        isBookmarked={isBookmarked}
        onToggleBookmark={onToggleBookmark}
      />
    </article>
  );
}

/**
 * 3. Spotlight Dossier Card: Tall editorial plate card for highlighted regional stories.
 */
export function MagazinePortraitDossierCard(props: MagazineCardProps) {
  const { article, locale, onToggleBookmark, index = 0 } = props;
  const openArticle = resolveOpen(props);
  const isBookmarked = resolveBookmarked(props);
  const hasPhoto = hasRealEditorialPhoto(article);
  const desk = deskFor(article.category);
  const deck = cleanEditorialDeck(article.title[locale], article.deck[locale], 150);

  if (!hasPhoto) {
    return (
      <article
        onClick={() => openArticle(article)}
        className="group magazine-card rounded-2xl p-6 cursor-pointer flex flex-col justify-between min-h-[340px] overflow-hidden"
      >
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: desk.accentHex }}
        />
        <div className="absolute inset-x-0 top-0 h-32 pointer-events-none">
          <TopographicPlateWatermark color={desk.accentHex} />
        </div>

        <div className="relative space-y-4">
          <div className="flex items-center justify-between gap-2">
            <DeskBadge article={article} locale={locale} />
            <span className="font-mono-tabular text-xs font-bold text-[#8F6321] dark:text-[#ECC983]">
              #{formatEditorialIndex(index, locale)}
            </span>
          </div>

          {article.kicker && (
            <p className="text-xs font-bold text-[#8F6321] dark:text-[#ECC983]">
              {article.kicker}
            </p>
          )}

          <h3
            className={`font-editorial-display text-xl sm:text-[22px] font-bold text-[#161310] dark:text-[#F5F1E8] group-hover:text-[#8F6321] dark:group-hover:text-[#ECC983] transition-colors line-clamp-3 ${
              locale === 'fa' ? 'leading-[1.52]' : 'leading-[1.25]'
            }`}
          >
            {article.title[locale]}
          </h3>

          {deck && (
            <p className="text-sm text-[#5B5246] dark:text-[#A3ADBF] leading-[1.85] line-clamp-4">
              {deck}
            </p>
          )}
        </div>

        <MetaFooter
          article={article}
          locale={locale}
          isBookmarked={isBookmarked}
          onToggleBookmark={onToggleBookmark}
        />
      </article>
    );
  }

  return (
    <article
      onClick={() => openArticle(article)}
      className="group magazine-plate rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full bg-[#FFFDF8] dark:bg-[#0D111C]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0E131F]">
        <EditorialImage
          src={article.coverImage}
          alt={article.title[locale]}
          className="magazine-media-img w-full h-full object-cover"
        />
        {article.videoUrl && (
          <span className="absolute top-3 end-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 text-[#F5F1E8] text-[11px] font-bold">
            <Play className="w-3 h-3 fill-current" />
            <span>{locale === 'fa' ? 'ویدیو' : 'Video'}</span>
          </span>
        )}
      </div>

      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 gap-3">
        <div className="space-y-2.5">
          <DeskBadge article={article} locale={locale} />
          <h3
            className={`font-editorial-display text-lg sm:text-xl font-bold text-[#161310] dark:text-[#F5F1E8] group-hover:text-[#8F6321] dark:group-hover:text-[#ECC983] transition-colors line-clamp-2 ${
              locale === 'fa' ? 'leading-[1.52]' : 'leading-[1.28]'
            }`}
          >
            {article.title[locale]}
          </h3>
          {deck && (
            <p className="text-xs sm:text-[13.5px] text-[#5B5246] dark:text-[#A3ADBF] leading-[1.8] line-clamp-2">
              {deck}
            </p>
          )}
        </div>

        <MetaFooter
          article={article}
          locale={locale}
          isBookmarked={isBookmarked}
          onToggleBookmark={onToggleBookmark}
        />
      </div>
    </article>
  );
}

/**
 * 4. Standard Editorial Card (Built from scratch):
 *    Displays sharp photography when an authentic image exists, or switches cleanly
 *    into a structured Broadsheet Typographic Plate with desk accent bar & contours.
 */
export function MagazineArticleCard(props: MagazineCardProps) {
  const { article, locale, onToggleBookmark, index } = props;
  const openArticle = resolveOpen(props);
  const isBookmarked = resolveBookmarked(props);
  const hasPhoto = hasRealEditorialPhoto(article);
  const desk = deskFor(article.category);
  const deck = cleanEditorialDeck(article.title[locale], article.deck[locale], hasPhoto ? 130 : 185);

  return (
    <article
      onClick={() => openArticle(article)}
      className="group magazine-card rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between h-full"
    >
      {hasPhoto ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#10141F] shrink-0">
          <EditorialImage
            src={article.coverImage}
            alt={article.title[locale]}
            className="magazine-media-img w-full h-full object-cover"
          />
          {article.videoUrl && (
            <span className="absolute top-3 end-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 text-[#F5F1E8] text-[11px] font-bold border border-white/15">
              <Play className="w-3 h-3 fill-current" />
              <span>{locale === 'fa' ? 'ویدئو' : 'Video'}</span>
            </span>
          )}
        </div>
      ) : (
        <div className="relative h-2 overflow-hidden">
          <div
            className="h-1 w-full"
            style={{ backgroundColor: desk.accentHex }}
          />
        </div>
      )}

      <div className="relative p-5 sm:p-6 flex flex-col justify-between flex-1">
        {!hasPhoto && (
          <div className="absolute inset-x-0 top-0 h-28 pointer-events-none">
            <TopographicPlateWatermark color={desk.accentHex} />
          </div>
        )}

        <div className="relative space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <DeskBadge article={article} locale={locale} />
            {typeof index === 'number' && !hasPhoto && (
              <span className="font-mono-tabular text-[11px] font-bold text-[#5B5246]/70 dark:text-[#A3ADBF]/70">
                {formatEditorialIndex(index, locale)}
              </span>
            )}
          </div>

          {article.kicker && (
            <p className="text-[11.5px] font-bold text-[#8F6321] dark:text-[#ECC983]">
              {article.kicker}
            </p>
          )}

          <h3
            className={`font-editorial-display font-bold text-[#161310] dark:text-[#F5F1E8] group-hover:text-[#8F6321] dark:group-hover:text-[#ECC983] transition-colors ${
              hasPhoto
                ? 'text-[17px] sm:text-[18.5px] line-clamp-2'
                : 'text-[18.5px] sm:text-[20px] line-clamp-3'
            } ${locale === 'fa' ? 'leading-[1.52]' : 'leading-[1.28]'}`}
          >
            {article.title[locale]}
          </h3>

          {deck && (
            <p
              className={`text-xs sm:text-[13.5px] text-[#5B5246] dark:text-[#A3ADBF] leading-[1.85] ${
                hasPhoto ? 'line-clamp-2' : 'line-clamp-3'
              }`}
            >
              {deck}
            </p>
          )}
        </div>

        <MetaFooter
          article={article}
          locale={locale}
          isBookmarked={isBookmarked}
          onToggleBookmark={onToggleBookmark}
        />
      </div>
    </article>
  );
}

/**
 * 5. Ranked / Wire Index Row Card: Dense numbered list item for Most Read & Quick Dispatches.
 */
export function MagazineIndexRowCard(props: MagazineCardProps) {
  const { article, locale, onToggleBookmark, index = 0 } = props;
  const openArticle = resolveOpen(props);
  const isBookmarked = resolveBookmarked(props);
  const desk = deskFor(article.category);
  const ReadArrow = locale === 'fa' ? ArrowLeft : ArrowRight;

  return (
    <article
      onClick={() => openArticle(article)}
      className="group magazine-card rounded-2xl p-4 sm:p-5 cursor-pointer flex items-start gap-4"
    >
      <div
        className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center font-mono-tabular text-sm font-extrabold border border-[#D9CEBA] dark:border-[#252E42] bg-[#F1E9DA] dark:bg-[#151C2C]"
        style={{ color: desk.accentHex }}
      >
        {formatEditorialIndex(index, locale)}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <DeskBadge article={article} locale={locale} />
        <h3
          className={`font-editorial-display text-base sm:text-[17px] font-bold text-[#161310] dark:text-[#F5F1E8] group-hover:text-[#8F6321] dark:group-hover:text-[#ECC983] transition-colors line-clamp-2 ${
            locale === 'fa' ? 'leading-[1.52]' : 'leading-[1.3]'
          }`}
        >
          {article.title[locale]}
        </h3>
        <div className="flex items-center gap-2 text-[11px] text-[#5B5246] dark:text-[#A3ADBF]">
          <time dateTime={article.publishedAt}>
            {formatRelativeTime(article.publishedAt, locale)}
          </time>
          <span aria-hidden="true" className="opacity-35">·</span>
          <span className="tabular-nums">
            {formatNumber(article.views, locale)} {locale === 'fa' ? 'بازدید' : 'views'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 self-center">
        {onToggleBookmark && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(article.id);
            }}
            className="magazine-circle-action !w-10 !h-10 !min-w-[40px] !min-h-[40px]"
            aria-label={isBookmarked ? 'Remove bookmark' : 'Save story'}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-4 h-4 text-[#8F6321] dark:text-[#ECC983]" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        )}
        <span className="w-9 h-9 rounded-full inline-flex items-center justify-center text-[#8F6321] dark:text-[#ECC983] opacity-75 group-hover:opacity-100">
          <ReadArrow className="w-4 h-4" />
        </span>
      </div>
    </article>
  );
}
