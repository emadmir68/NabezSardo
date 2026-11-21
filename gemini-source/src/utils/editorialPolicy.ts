import type { PolicyCheckResult } from '../types/news';

const ADVERTISEMENT_KEYWORDS = [
  'آگهی تبلیغاتی',
  'آگهی فروش',
  'تبلیغاتی',
  'فروش ویژه',
  'تخفیف استثنایی',
  'تور ارزان',
  'ثبت آگهی',
  'شماره تماس جهت سفارش',
  'sponsored ad',
  'promotional offer',
];

const ADVERTORIAL_KEYWORDS = [
  'رپورتاژ',
  'رپرتاژ',
  'رپورتاژ آگهی',
  'محتوای تبلیغاتی',
  'advertorial',
  'paid partnership',
  'sponsored post',
];

const OBITUARY_KEYWORDS = [
  'مراسم ترحیم',
  'اطلاعیه ترحیم',
  'مجلس ترحیم',
  'مراسم ختم',
  'مجلس ختم',
  'مراسم تشییع',
  'مراسم تدفین',
  'مراسم چهلم',
  'مراسم هفتم',
  'مراسم سوم',
  'سالگرد درگذشت',
  'اطلاعیه فوت',
  'اعلامیه فوت',
  'آگهی ترحیم',
  'پیام تسلیت درگذشت',
  'انالله و انا الیه راجعون',
  'انا لله و انا الیه راجعون',
  'obituary',
  'funeral notice',
];

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[\u200c\s]+/g, ' ')
    .trim();
}

/**
 * Editorial monitoring & publishing policy filter for Nabz Sardo.
 * Strictly blocks advertisements, advertorials (رپورتاژ), and obituary/funeral announcements
 * in both automated monitoring queues and manual submission/publishing flows.
 */
export function checkEditorialPolicy(textParts: string[]): PolicyCheckResult {
  const combined = normalizeText(textParts.filter(Boolean).join(' '));
  if (!combined) return { allowed: true };

  for (const kw of OBITUARY_KEYWORDS) {
    if (combined.includes(normalizeText(kw))) {
      return {
        allowed: false,
        reasonCode: 'obituary',
        matchedKeyword: kw,
        message: {
          fa: 'بر اساس منشور تحریریه نبض ساردو، انتشار اطلاعیه‌های ترحیم، آگهی فوت و مراسم ختم در سایت و صف پایش مجاز نیست.',
          en: 'Per Nabz Sardo editorial policy, obituary and funeral announcements are strictly prohibited.',
        },
      };
    }
  }

  for (const kw of ADVERTORIAL_KEYWORDS) {
    if (combined.includes(normalizeText(kw))) {
      return {
        allowed: false,
        reasonCode: 'advertorial',
        matchedKeyword: kw,
        message: {
          fa: 'انتشار رپورتاژ و محتوای سفارشی تبلیغاتی در نبض ساردو ممنوع است.',
          en: 'Advertorials and sponsored editorial content are prohibited on Nabz Sardo.',
        },
      };
    }
  }

  for (const kw of ADVERTISEMENT_KEYWORDS) {
    if (combined.includes(normalizeText(kw))) {
      return {
        allowed: false,
        reasonCode: 'advertisement',
        matchedKeyword: kw,
        message: {
          fa: 'انتشار آگهی تبلیغاتی و محتوای تجاری در جریان خبری و صف پایش نبض ساردو مجاز نیست.',
          en: 'Commercial advertisements are prohibited in the Nabz Sardo newsroom feed.',
        },
      };
    }
  }

  return { allowed: true };
}
