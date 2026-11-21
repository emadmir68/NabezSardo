import { CATEGORIES, EDITORIAL_IMAGES, REGIONS } from '../data/initialData';
import type { Article, CategoryId, Locale, RegionId } from '../types/news';

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(value);
}

export function formatJalaliDate(date: Date, locale: Locale): string {
  try {
    if (locale === 'fa') {
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    }
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

export function formatShortDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  try {
    if (locale === 'fa') {
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toDateString();
  }
}

export function formatLiveClock(date: Date, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Tehran',
    }).format(date);
  } catch {
    return date.toTimeString().slice(0, 8);
  }
}

export function getCategoryLabel(category: CategoryId, locale: Locale): string {
  return CATEGORIES.find((c) => c.id === category)?.label[locale] ?? category;
}

export function getRegionLabel(region: RegionId, locale: Locale): string {
  return REGIONS.find((r) => r.id === region)?.label[locale] ?? region;
}

export function formatEditorialIndex(index: number, locale: Locale): string {
  const padded = String(index + 1).padStart(2, '0');
  if (locale === 'en') return padded;
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return padded.replace(/\d/g, (d) => persianDigits[Number(d)]);
}

/**
 * Detects legacy auto-generated text-overlay SVGs (e.g. /uploads/auto-cover-*.svg)
 * or empty URLs so they never clutter full-bleed luxury magazine cards or the Live Hero.
 */
export function isPlaceholderCoverUrl(url?: string | null): boolean {
  const raw = String(url ?? '').trim().toLowerCase();
  if (!raw) return true;
  if (raw.startsWith('data:image/svg')) return true;
  if (raw.includes('auto-cover-') || raw.includes('news-cover-')) return true;
  const cleanPath = raw.split('?')[0].split('#')[0];
  return cleanPath.endsWith('.svg');
}

export function hasRealEditorialPhoto(article: Pick<Article, 'coverImage'>): boolean {
  return !isPlaceholderCoverUrl(article.coverImage);
}

/**
 * Resolves a clean photographic cover image for any article, seamlessly replacing
 * missing or legacy auto-cover SVG graphics with category/region-matched editorial photography.
 */
export function resolveArticleCoverImage(
  article: Pick<Article, 'coverImage' | 'category' | 'region'>
): string {
  if (hasRealEditorialPhoto(article)) {
    return article.coverImage;
  }

  switch (article.category) {
    case 'weather':
    case 'incidents':
      return EDITORIAL_IMAGES.mountainWeather;
    case 'agriculture':
      return EDITORIAL_IMAGES.jiroftAgriculture;
    case 'culture':
      return EDITORIAL_IMAGES.kermanHeritage;
    case 'social':
    case 'opinion':
      return article.region === 'sarduiyeh'
        ? EDITORIAL_IMAGES.sarduiyehHighlands
        : EDITORIAL_IMAGES.communityCulture;
    case 'sarduiyeh':
    default:
      return article.region === 'jiroft'
        ? EDITORIAL_IMAGES.jiroftAgriculture
        : EDITORIAL_IMAGES.sarduiyehHighlands;
  }
}

function normalizePersianForCompare(input: string): string {
  return input
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200c\u200f\u200e]/g, ' ')
    .replace(/[«»""''()[\]:؛،,.!؟?\-–—|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Cleans live CMS decks that repeat the full headline verbatim at the beginning
 * or exceed magazine card proportions, preventing double-headline clutter.
 */
export function cleanEditorialDeck(title: string, deck: string, maxLength = 220): string {
  const rawTitle = String(title ?? '').trim();
  let rawDeck = String(deck ?? '').replace(/\s+/g, ' ').trim();
  if (!rawDeck) return '';

  if (rawTitle) {
    // Direct prefix match
    if (rawDeck.startsWith(rawTitle)) {
      rawDeck = rawDeck.slice(rawTitle.length).replace(/^[\s:؛،.\-–—|]+/, '').trim();
    } else {
      // Fuzzy normalized prefix match (handles ZWNJ, Arabic/Persian Yeh/Kaf, punctuation differences)
      const normTitle = normalizePersianForCompare(rawTitle);
      const normDeck = normalizePersianForCompare(rawDeck);
      if (normTitle.length >= 16 && normDeck.startsWith(normTitle)) {
        const titleWords = rawTitle.split(/\s+/).filter(Boolean).length;
        const deckWords = rawDeck.split(/\s+/).filter(Boolean);
        if (deckWords.length > titleWords + 3) {
          rawDeck = deckWords
            .slice(titleWords)
            .join(' ')
            .replace(/^[\s:؛،.\-–—|]+/, '')
            .trim();
        } else {
          return '';
        }
      }
    }
  }

  if (normalizePersianForCompare(rawDeck) === normalizePersianForCompare(rawTitle)) {
    return '';
  }

  if (rawDeck.length <= maxLength) return rawDeck;
  const sliced = rawDeck.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.65 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}
