import type { ActiveView, Article, CategoryId, Locale, RegionId, SiteSettings } from '../types/news';
import { cleanEditorialDeck, getCategoryLabel, getRegionLabel, resolveArticleCoverImage } from './formatters';

const SITE_ORIGIN = 'https://nabzesardo.ir';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(data: Record<string, unknown>) {
  let script = document.getElementById('nabz-dynamic-jsonld') as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'nabz-dynamic-jsonld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

interface SeoSyncInput {
  activeView: ActiveView;
  activeArticle: Article | null;
  selectedCategory: CategoryId | 'all';
  selectedRegion: RegionId | 'all';
  locale: Locale;
  settings: SiteSettings;
}

export function syncPageSeo({
  activeView,
  activeArticle,
  selectedCategory,
  selectedRegion,
  locale,
  settings,
}: SeoSyncInput) {
  const brand = locale === 'fa' ? settings.siteNameFa : settings.siteNameEn;
  const baseDesc = locale === 'fa' ? settings.seoDescriptionFa : settings.seoDescriptionEn;

  if (activeArticle) {
    const title = `${activeArticle.title[locale]} | ${brand}`;
    const desc =
      cleanEditorialDeck(activeArticle.title[locale], activeArticle.deck[locale], 160) || baseDesc;
    const canonical = `${SITE_ORIGIN}/news/${encodeURIComponent(activeArticle.slug)}`;
    const image = resolveArticleCoverImage(activeArticle);
    const absoluteImage = image.startsWith('http') ? image : `${SITE_ORIGIN}${image}`;

    document.title = title;
    upsertMeta('name', 'description', desc);
    upsertMeta('property', 'og:type', 'article');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:image', absoluteImage);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', desc);
    upsertMeta('name', 'twitter:image', absoluteImage);
    upsertCanonical(canonical);

    upsertJsonLd({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: activeArticle.title[locale],
      description: desc,
      image: [absoluteImage],
      datePublished: activeArticle.publishedAt,
      dateModified: activeArticle.publishedAt,
      inLanguage: locale === 'fa' ? 'fa-IR' : 'en-US',
      articleSection: getCategoryLabel(activeArticle.category, locale),
      author: {
        '@type': 'Person',
        name: activeArticle.author[locale],
      },
      publisher: {
        '@type': 'NewsMediaOrganization',
        name: brand,
        url: SITE_ORIGIN,
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonical,
      },
    });
    return;
  }

  let pageTitle =
    locale === 'fa'
      ? `${settings.siteNameFa} | ${settings.taglineFa}`
      : `${settings.siteNameEn} | ${settings.taglineEn}`;
  let pagePath = '/';
  let pageDesc = baseDesc;

  switch (activeView) {
    case 'desks':
      pageTitle =
        selectedCategory !== 'all'
          ? `${getCategoryLabel(selectedCategory, locale)} | ${brand}`
          : locale === 'fa'
            ? `میزهای خبری و دسته‌بندی‌ها | ${brand}`
            : `Editorial Desks & Categories | ${brand}`;
      pagePath = selectedCategory !== 'all' ? `/category/${selectedCategory}` : '/desks';
      break;
    case 'regions':
      pageTitle =
        selectedRegion !== 'all'
          ? `${locale === 'fa' ? 'اخبار' : 'News from'} ${getRegionLabel(selectedRegion, locale)} | ${brand}`
          : locale === 'fa'
            ? `پوشش خبری مناطق جنوب کرمان | ${brand}`
            : `Regional Coverage — South Kerman | ${brand}`;
      pagePath = selectedRegion !== 'all' ? `/region/${selectedRegion}` : '/regions';
      break;
    case 'archive':
      pageTitle = locale === 'fa' ? `آرشیو جامع اخبار | ${brand}` : `Complete News Archive | ${brand}`;
      pagePath = '/archive';
      break;
    case 'search':
      pageTitle = locale === 'fa' ? `جست‌وجو در اخبار | ${brand}` : `Search Newsroom | ${brand}`;
      pagePath = '/search';
      break;
    case 'submit':
      pageTitle = locale === 'fa' ? `ارسال خبر مردمی | ${brand}` : `Submit Citizen Report | ${brand}`;
      pagePath = '/submit';
      break;
    case 'about':
      pageTitle = locale === 'fa' ? `درباره نبض ساردو | ${brand}` : `About Nabz Sardo | ${brand}`;
      pagePath = '/about';
      break;
    case 'contact':
      pageTitle = locale === 'fa' ? `تماس با تحریریه | ${brand}` : `Contact Newsroom | ${brand}`;
      pagePath = '/contact';
      break;
    case 'editorial-policy':
      pageTitle = locale === 'fa' ? `سیاست تحریریه و اصلاحات | ${brand}` : `Editorial Policy | ${brand}`;
      pagePath = '/editorial-policy';
      break;
    case 'follow-up':
      pageTitle = locale === 'fa' ? `پیگیری تا نتیجه | ${brand}` : `Public Follow-ups | ${brand}`;
      pagePath = '/follow-up';
      break;
    case 'admin-login':
      pageTitle = locale === 'fa' ? `ورود مدیریت تحریریه | ${brand}` : `Editorial Login | ${brand}`;
      pagePath = '/admin/login';
      break;
    case 'studio':
      pageTitle = locale === 'fa' ? `داشبورد تحریریه | ${brand}` : `Editorial Dashboard | ${brand}`;
      pagePath = '/admin';
      break;
    case 'not-found':
      pageTitle = locale === 'fa' ? `صفحه یافت نشد (۴۰۴) | ${brand}` : `Page Not Found (404) | ${brand}`;
      pagePath = window.location.pathname || '/404';
      pageDesc =
        locale === 'fa'
          ? 'صفحه یا خبر مورد نظر در پایگاه خبری نبض ساردو یافت نشد.'
          : 'The requested page or news dispatch could not be found on Nabz Sardo.';
      break;
    default:
      break;
  }

  const canonical = `${SITE_ORIGIN}${pagePath}`;
  document.title = pageTitle;
  upsertMeta('name', 'description', pageDesc);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:title', pageTitle);
  upsertMeta('property', 'og:description', pageDesc);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('name', 'twitter:title', pageTitle);
  upsertMeta('name', 'twitter:description', pageDesc);
  upsertCanonical(canonical);

  upsertJsonLd({
    '@context': 'https://schema.org',
    '@type': activeView === 'home' ? 'WebSite' : 'CollectionPage',
    name: pageTitle,
    description: pageDesc,
    url: canonical,
    inLanguage: locale === 'fa' ? 'fa-IR' : 'en-US',
  });
}
