import { ShieldCheck } from 'lucide-react';
import type { ActiveView, Locale } from '../types/news';

interface EditorialPolicyViewProps {
  locale: Locale;
  onNavigate: (view: ActiveView) => void;
}

const POLICY_ITEMS_FA = [
  {
    code: '01',
    title: 'دقت و راستی‌آزمایی پیش از انتشار',
    body: 'خبرها پیش از انتشار بر اساس اسناد، منابع رسمی محلی یا گزارش میدانی خبرنگار تنظیم و بررسی می‌شوند.',
  },
  {
    code: '02',
    title: 'منشور منع تبلیغات پنهان و ترحیم',
    body: 'انتشار آگهی‌های تجاری، رپورتاژهای پنهان، پیام‌های خام شبکه‌های اجتماعی، شعرهای نامرتبط و اطلاعیه‌های فوت، تشییع و ترحیم در جریان خبری ممنوع است.',
  },
  {
    code: '03',
    title: 'شفافیت نویسنده، زمان و منبع',
    body: 'نام خبرنگار یا میز تحریریه، منطقه وقوع رویداد و زمان دقیق انتشار در شناسنامه هر گزارش درج می‌شود.',
  },
  {
    code: '04',
    title: 'مسئولیت اصلاح خبر و شفافیت',
    body: 'خطاهای اطلاعاتی پس از دریافت گزارش و راستی‌آزمایی اصلاح می‌شوند و خبرهای قدیمی به‌صورت مصنوعی تاریخ‌بندی مجدد نمی‌شوند.',
  },
  {
    code: '05',
    title: 'اصالت تصویر و سندیت رسانه‌ای',
    body: 'تنها عکس‌ها و ویدئوهای واقعی رویداد به‌عنوان سند خبری منتشر می‌شوند و از تکرار تصاویر تزئینی برای گمراهی مخاطب پرهیز می‌شود.',
  },
  {
    code: '06',
    title: 'خبرهای مردمی و مشارکت شهروندان',
    body: 'گزارش‌ها و تصاویر ارسالی شهروندان پیش از انتشار عمومی توسط دبیران تحریریه راستی‌آزمایی و پالایش می‌شوند.',
  },
];

const POLICY_ITEMS_EN = [
  {
    code: '01',
    title: 'Verification Prior to Publication',
    body: 'Every report is vetted against primary documents, official statements, or direct field reporting before publication.',
  },
  {
    code: '02',
    title: 'Zero Hidden Ads or Obituaries',
    body: 'Commercial ads, undisclosed advertorials, raw social messages, and funeral/condolence notices are strictly excluded from news feeds.',
  },
  {
    code: '03',
    title: 'Source, Author & Timestamp Clarity',
    body: 'Each dispatch carries explicit editorial attribution, geographic bureau context, and accurate publication dates.',
  },
  {
    code: '04',
    title: 'Corrections & Editorial Accountability',
    body: 'Verified inaccuracies are corrected transparently via our editorial desk; legacy articles are never artificially re-dated.',
  },
  {
    code: '05',
    title: 'Authentic Photography & Media',
    body: 'Only genuine event photographs and videos are presented as documentary media.',
  },
  {
    code: '06',
    title: 'Citizen Journalism Review',
    body: 'Community submissions undergo newsroom verification before reaching public circulation.',
  },
];

export function EditorialPolicyView({ locale, onNavigate }: EditorialPolicyViewProps) {
  const cards = locale === 'fa' ? POLICY_ITEMS_FA : POLICY_ITEMS_EN;
  return (
    <div className="w-full pb-20">
      <section className="w-full border-b border-[#D9CEBA] dark:border-[#D4A85B]/18 bg-[#080A10] text-[#F5F1E8]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20">
          <p className="inline-flex items-center gap-2 text-xs font-bold text-[#F1D79A] mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>{locale === 'fa' ? 'منشور حرفه‌ای و اصول انتشار' : 'EDITORIAL STANDARDS'}</span>
          </p>
          <h1 className="font-editorial-display text-3xl sm:text-5xl font-bold text-[#FDFBF7] mb-4">
            {locale === 'fa' ? 'سیاست تحریریه و اصلاحات نبض ساردو' : 'Nabz Sardo Editorial Policy'}
          </h1>
          <p className="text-sm sm:text-base text-[#EDE6D8]/82 max-w-2xl leading-[1.9]">
            {locale === 'fa'
              ? 'اصول دقت، راستی‌آزمایی، شفافیت منابع، جداسازی کامل آگهی و ترحیم از خبر و پاسخ‌گویی به مخاطبان جنوب کرمان.'
              : 'Our commitment to verification, transparency, clean editorial boundaries, and public accountability.'}
          </p>
        </div>
      </section>

      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((item) => (
            <article key={item.code} className="magazine-card rounded-2xl p-6 space-y-3">
              <span className="font-mono-tabular text-xs font-extrabold text-[#8F6321] dark:text-[#ECC983]">
                {item.code} / POLICY
              </span>
              <h2 className="font-editorial-display text-xl font-bold text-[#161310] dark:text-[#F5F1E8]">
                {item.title}
              </h2>
              <p className="text-sm text-[#5B5246] dark:text-[#A3ADBF] leading-[1.9]">
                {item.body}
              </p>
            </article>
          ))}
        </div>

        <div className="luxury-panel rounded-2xl p-7 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-editorial-display text-xl font-bold text-[#161310] dark:text-[#F5F1E8]">
              {locale === 'fa' ? 'درخواست اصلاح خبر یا ارائه اطلاعات تکمیلی' : 'Request a Correction'}
            </h2>
            <p className="text-sm text-[#5B5246] dark:text-[#A3ADBF]">
              {locale === 'fa'
                ? 'پیشنهاد یا اصلاحیه خود را مستقیم به میز تحریریه ارسال کنید.'
                : 'Send an update or correction request directly to our editors.'}
            </p>
          </div>
          <button type="button" onClick={() => onNavigate('contact')} className="btn-luxury-ink">
            <span>{locale === 'fa' ? 'تماس با تحریریه' : 'Contact Newsroom'}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
