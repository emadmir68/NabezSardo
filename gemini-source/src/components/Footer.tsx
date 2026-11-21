import { CATEGORIES, REGIONS } from '../data/initialData';
import type { ActiveView, CategoryId, Locale, RegionId } from '../types/news';

interface FooterProps {
  locale: Locale;
  onNavigate: (view: ActiveView) => void;
  onSelectCategory: (category: CategoryId) => void;
  onSelectRegion: (region: RegionId) => void;
}

export function Footer({
  locale,
  onNavigate,
  onSelectCategory,
  onSelectRegion,
}: FooterProps) {
  return (
    <footer className="w-full border-t-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/18 bg-[#EAE1D2]/75 dark:bg-[#05070B] text-[#5A5247] dark:text-[#A1AAB9]">
      <div className="h-[0.5px] w-full gold-hairline opacity-70" />
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5 space-y-4">
          <p className="font-editorial-display text-3xl font-bold text-[#141210] dark:text-[#F6F2EA]">
            {locale === 'fa' ? 'نبض ساردو' : 'Nabz Sardo'}
          </p>
          <p className="text-sm leading-[1.9] max-w-md">
            {locale === 'fa'
              ? 'رسانه مستقل خبری و تحلیلی ویژه پوشش روایت‌های میدانی، اقتصاد، کشاورزی، فرهنگ، اقلیم و مسائل اجتماعی ساردوئیه، جیرفت و جنوب استان کرمان.'
              : 'Independent regional news and analysis covering field reports, agriculture, culture, climate, and civic life across Sarduiyeh, Jiroft, and South Kerman.'}
          </p>
          <p className="text-xs text-[#9A6B27] dark:text-[#E8C680] font-semibold">
            {locale === 'fa'
              ? 'از دل منطقه، برای آینده منطقه.'
              : 'From the heart of the region, for the future of the region.'}
          </p>
        </div>

        <div className="md:col-span-3 space-y-3">
          <h3 className="text-xs font-bold text-[#141210] dark:text-[#F6F2EA]">
            {locale === 'fa' ? 'میزهای خبری' : 'Editorial Desks'}
          </h3>
          <ul className="space-y-2.5 text-sm">
            {CATEGORIES.slice(0, 6).map((cat) => (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className="hover:text-[#9A6B27] dark:hover:text-[#E8C680] transition-colors cursor-pointer"
                >
                  {cat.label[locale]}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-[#141210] dark:text-[#F6F2EA]">
            {locale === 'fa' ? 'مناطق پوشش' : 'Regional Bureaus'}
          </h3>
          <ul className="space-y-2.5 text-sm">
            {REGIONS.map((reg) => (
              <li key={reg.id}>
                <button
                  type="button"
                  onClick={() => onSelectRegion(reg.id)}
                  className="hover:text-[#9A6B27] dark:hover:text-[#E8C680] transition-colors cursor-pointer"
                >
                  {reg.label[locale]}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-[#141210] dark:text-[#F6F2EA]">
            {locale === 'fa' ? 'صفحات و تحریریه' : 'Newsroom'}
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <button
                type="button"
                onClick={() => onNavigate('search')}
                className="hover:text-[#9A6B27] dark:hover:text-[#E8C680] transition-colors cursor-pointer"
              >
                {locale === 'fa' ? 'جست‌وجو در اخبار' : 'Search News'}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('submit')}
                className="hover:text-[#9A6B27] dark:hover:text-[#E8C680] transition-colors cursor-pointer"
              >
                {locale === 'fa' ? 'ارسال خبر مردمی' : 'Submit Report'}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="hover:text-[#9A6B27] dark:hover:text-[#E8C680] transition-colors cursor-pointer"
              >
                {locale === 'fa' ? 'درباره ما' : 'About Us'}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="hover:text-[#9A6B27] dark:hover:text-[#E8C680] transition-colors cursor-pointer"
              >
                {locale === 'fa' ? 'تماس با ما' : 'Contact Us'}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('studio')}
                className="hover:text-[#9A6B27] dark:hover:text-[#E8C680] transition-colors cursor-pointer"
              >
                {locale === 'fa' ? 'ورود مدیریت' : 'Editorial Admin'}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t-[0.5px] border-[#D9CEBC]/80 dark:border-[#D4A85B]/15">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span>
            {locale === 'fa'
              ? '© ۱۴۰۵ پایگاه خبری و تحلیلی نبض ساردو (nabzesardo.ir) — تمامی حقوق محفوظ است.'
              : '© 2026 Nabz Sardo Independent Regional Media (nabzesardo.ir). All rights reserved.'}
          </span>
          <div className="flex items-center gap-4">
            <a
              href="/sitemap.xml"
              className="hover:text-[#9A6B27] dark:hover:text-[#E8C680] transition-colors"
            >
              Sitemap
            </a>
            <span aria-hidden="true" className="opacity-35">·</span>
            <a
              href="/rss.xml"
              className="hover:text-[#9A6B27] dark:hover:text-[#E8C680] transition-colors"
            >
              RSS
            </a>
            <span aria-hidden="true" className="opacity-35">·</span>
            <span className="text-[#9A6B27] dark:text-[#E8C680]">
              {locale === 'fa' ? 'ساردوئیه · جیرفت · جنوب کرمان' : 'Sarduiyeh · Jiroft · South Kerman'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
