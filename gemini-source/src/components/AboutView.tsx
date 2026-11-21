import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { EDITORIAL_IMAGES } from '../data/initialData';
import type { ActiveView, Locale, SiteSettings } from '../types/news';
import { EditorialImage } from './EditorialImage';

interface AboutViewProps {
  locale: Locale;
  settings: SiteSettings;
  onNavigate: (view: ActiveView) => void;
}

export function AboutView({ locale, settings, onNavigate }: AboutViewProps) {
  const pillars = [
    {
      num: locale === 'fa' ? '۰۱' : '01',
      titleFa: 'استقلال حرفه‌ای و روایت میدانی',
      titleEn: 'Independent Field Journalism',
      bodyFa:
        'نبض ساردو بدون وابستگی به جریان‌های تجاری و تبلیغاتی، روایت دقیق و مستند زندگی روزمره، کشاورزی، زیرساخت و فرهنگ مردم ساردوئیه، جیرفت و جنوب کرمان را منتشر می‌کند.',
      bodyEn:
        'Free from commercial sponsors, Nabz Sardo delivers verified field reporting on agriculture, infrastructure, civic life, and culture across South Kerman.',
    },
    {
      num: locale === 'fa' ? '۰۲' : '02',
      titleFa: 'منشور شفافیت و منع آگهی و ترحیم',
      titleEn: 'Strict Non-Commercial Editorial Charter',
      bodyFa:
        'در سامانه پایش و خط انتشار نبض ساردو، انتشار هرگونه آگهی تبلیغاتی، رپورتاژ سفارشی و اطلاعیه‌های ترحیم یا مراسم فوت به‌طور کامل ممنوع است تا کیفیت خبری رسانه حفظ شود.',
      bodyEn:
        'Advertisements, advertorials, and obituary notices are strictly barred from both our monitoring pipeline and published editions.',
    },
    {
      num: locale === 'fa' ? '۰۳' : '03',
      titleFa: 'صدای مستقیم شهروندخبرنگاران منطقه',
      titleEn: 'Direct Civic Participation',
      bodyFa:
        'ساکنان روستاها و شهرهای جنوب کرمان می‌توانند مطالبات، تصاویر میدانی و رویدادهای محلی خود را مستقیماً به تحریریه ارسال کنند تا پس از راستی‌آزمایی منتشر شود.',
      bodyEn:
        'Residents across villages and towns can submit field reports and photographs directly to the newsroom for editorial verification and publication.',
    },
  ];

  return (
    <div className="w-full">
      <section
        className="w-full border-b-[0.5px] border-[#D9CEBC]/80 dark:border-[#D4A85B]/18 bg-[#07090E] text-[#F6F2EA]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(212, 168, 91, 0.2), transparent 52%)',
        }}
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-bold text-[#F0D496]">
              {locale === 'fa' ? 'درباره تحریریه و منشور حرفه‌ای' : 'About the Newsroom'}
            </p>
            <h1
              className={`font-editorial-display text-3xl sm:text-5xl font-bold text-[#FDFBF7] ${
                locale === 'fa' ? 'leading-[1.38]' : 'leading-tight'
              }`}
            >
              {locale === 'fa'
                ? `${settings.siteNameFa}؛ روایت مستقل از ارتفاعات ساردوئیه تا دشت‌های جنوب کرمان`
                : `${settings.siteNameEn}: Independent Journalism Across South Kerman`}
            </h1>
            <p className="text-sm sm:text-base text-[#EDE6D8]/84 leading-[1.95] max-w-2xl">
              {locale === 'fa' ? settings.seoDescriptionFa : settings.seoDescriptionEn}
            </p>
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('submit')}
                className="btn-luxury-gold text-xs sm:text-sm"
              >
                <span>{locale === 'fa' ? 'ارسال گزارش مردمی' : 'Submit a Field Report'}</span>
                {locale === 'fa' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="btn-luxury-glass text-xs sm:text-sm"
              >
                <span>{locale === 'fa' ? 'ارتباط با تحریریه' : 'Contact Editors'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="magazine-plate rounded-[24px] overflow-hidden aspect-[4/3]">
              <EditorialImage
                src={EDITORIAL_IMAGES.sarduiyehHighlands}
                alt={locale === 'fa' ? 'ارتفاعات ساردوئیه' : 'Sarduiyeh Highlands'}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 sm:gap-8 mb-14">
          {pillars.map((pillar) => (
            <div
              key={pillar.num}
              className="magazine-card rounded-[24px] p-7 sm:p-9 space-y-4"
            >
              <span className="font-mono-tabular text-2xl font-light text-[#9A6B27] dark:text-[#E8C680]">
                {pillar.num}
              </span>
              <h2 className="font-editorial-display text-xl font-bold text-[#141210] dark:text-[#F6F2EA] leading-[1.45]">
                {locale === 'fa' ? pillar.titleFa : pillar.titleEn}
              </h2>
              <p className="text-sm text-[#5A5247] dark:text-[#A1AAB9] leading-[1.9]">
                {locale === 'fa' ? pillar.bodyFa : pillar.bodyEn}
              </p>
            </div>
          ))}
        </div>

        <div className="luxury-panel rounded-[24px] p-7 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl">
            <ShieldCheck className="w-6 h-6 text-[#9A6B27] dark:text-[#E8C680] shrink-0 mt-1" />
            <div className="space-y-2">
              <h3 className="font-editorial-display text-xl font-bold text-[#141210] dark:text-[#F6F2EA]">
                {locale === 'fa' ? 'پایش هوشمند و استاندارد انتشار نبض ساردو' : 'Automated Monitoring & Editorial Integrity'}
              </h3>
              <p className="text-sm text-[#5A5247] dark:text-[#A1AAB9] leading-[1.88]">
                {locale === 'fa'
                  ? 'سامانه پایش خبری به‌صورت مستقل اخبار منطقه‌ای را رصد می‌کند و به‌طور خودکار از ورود هرگونه آگهی، رپورتاژ تجاری و اطلاعیه ترحیم به صف انتشار جلوگیری می‌نماید.'
                  : 'Our independent newsroom monitoring pipeline continuously verifies regional coverage while blocking commercial ads, advertorials, and obituary notices.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('regions')}
            className="btn-luxury-ink shrink-0 text-xs sm:text-sm"
          >
            {locale === 'fa' ? 'مشاهده دفاتر مناطق' : 'Explore Regional Bureaus'}
          </button>
        </div>
      </section>
    </div>
  );
}
