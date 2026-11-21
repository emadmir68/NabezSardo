import { CATEGORIES, REGIONS } from '../data/initialData';
import type { CategoryId, Locale, RegionId } from '../types/news';

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
