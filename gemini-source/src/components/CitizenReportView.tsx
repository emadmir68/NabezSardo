import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ImagePlus, Trash2 } from 'lucide-react';
import { CATEGORIES, REGIONS } from '../data/initialData';
import type { CategoryId, CitizenReport, Locale, RegionId } from '../types/news';

interface CitizenReportViewProps {
  locale: Locale;
  onSubmitReport: (report: Omit<CitizenReport, 'id' | 'submittedAt' | 'status'>) => void;
  onGoToStudio: () => void;
}

export function CitizenReportView({
  locale,
  onSubmitReport,
  onGoToStudio,
}: CitizenReportViewProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState<RegionId>('sarduiyeh');
  const [category, setCategory] = useState<CategoryId>('sarduiyeh');
  const [reporterName, setReporterName] = useState('');
  const [contact, setContact] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError(
        locale === 'fa'
          ? 'حجم تصویر باید کمتر از ۴ مگابایت باشد.'
          : 'Image size must be under 4 MB.'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageDataUrl(reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 8) {
      setError(
        locale === 'fa'
          ? 'لطفاً تیتر یا موضوع خبر را حداقل در ۸ کاراکتر بنویسید.'
          : 'Please enter a headline of at least 8 characters.'
      );
      return;
    }
    if (description.trim().length < 24) {
      setError(
        locale === 'fa'
          ? 'شرح گزارش کوتاه است؛ لطفاً جزئیات مکان و زمان رویداد را کامل‌تر وارد کنید.'
          : 'Please provide at least 24 characters describing the location and details.'
      );
      return;
    }

    onSubmitReport({
      title: title.trim(),
      description: description.trim(),
      region,
      category,
      reporterName:
        reporterName.trim() ||
        (locale === 'fa' ? 'شهروند خبرنگار ناشناس' : 'Anonymous Citizen Reporter'),
      contact: contact.trim() || undefined,
      imageDataUrl,
    });

    setTitle('');
    setDescription('');
    setReporterName('');
    setContact('');
    setImageDataUrl(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError(null);
    setSubmitted(true);
  };

  return (
    <section className="max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Editorial Mission Column */}
        <div className="lg:col-span-5 space-y-6">
          <div
            className="relative overflow-hidden rounded-xl p-7 sm:p-8 border border-[#D4A85B]/35 bg-[#10141E] text-[#F5F1E8] shadow-[0_24px_56px_-26px_rgba(0,0,0,0.65)]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 85% 12%, rgba(212, 168, 91, 0.2), transparent 55%)',
            }}
          >
            <p className="text-xs font-bold text-[#E5C17B] mb-2">
              {locale === 'fa' ? 'میز شهروندخبرنگار نبض ساردو' : 'Nabz Sardo Citizen Desk'}
            </p>
            <h1 className="font-editorial-display text-3xl sm:text-4xl font-bold text-[#FDFBF7] leading-[1.42] mb-4">
              {locale === 'fa'
                ? 'ارسال گزارش، تصویر یا مطالبه مردمی'
                : 'Send a Field Report or Regional Tip'}
            </h1>
            <p className="text-sm text-[#EDE6D8]/85 leading-relaxed mb-7">
              {locale === 'fa'
                ? 'نبض ساردو صدای مستقل ساردوئیه، جیرفت، عنبرآباد، کهنوج و روستاهای جنوب کرمان است. هر گزارش ثبت‌شده مستقیماً وارد صف بررسی تحریریه می‌شود.'
                : 'Nabz Sardo is the independent voice of Sarduiyeh, Jiroft, Anbarabad, Kahnuj, and South Kerman. Every submitted tip enters our editorial verification queue immediately.'}
            </p>

            <div className="pt-6 border-t border-[#F5F1E8]/15 space-y-4 text-xs sm:text-sm text-[#EDE6D8]/80">
              <div>
                <p className="font-semibold text-[#E5C17B] mb-1">
                  {locale === 'fa' ? '۰۱. محرمانگی هویت فرستنده' : '01. Source Confidentiality'}
                </p>
                <p>
                  {locale === 'fa'
                    ? 'درج نام و شماره تماس کاملاً اختیاری است و صرفاً برای پیگیری صحت خبر استفاده می‌شود.'
                    : 'Providing your name or contact details is optional and used strictly for fact-checking.'}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#E5C17B] mb-1">
                  {locale === 'fa' ? '۰۲. دقت در مکان و زمان' : '02. Place & Time Precision'}
                </p>
                <p>
                  {locale === 'fa'
                    ? 'ذکر نام روستا، محور مواصلاتی یا نهاد مرتبط به بررسی سریع‌تر در تحریریه کمک می‌کند.'
                    : 'Including the specific village, road corridor, or institution speeds up editorial verification.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sculpted Luxury Submission Form */}
        <div className="lg:col-span-7 luxury-panel rounded-xl overflow-hidden">
          <div className="h-[1px] w-full gold-hairline" />
          <div className="p-6 sm:p-8">
            {submitted && (
              <div
                role="status"
                className="mb-6 p-4 rounded-lg border border-[#9E6F2C]/40 bg-[#9E6F2C]/10 dark:bg-[#E5C17B]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#9E6F2C] dark:text-[#E5C17B] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#161412] dark:text-[#F5F1E8]">
                      {locale === 'fa'
                        ? 'گزارش شما با موفقیت در صف تحریریه ثبت شد.'
                        : 'Your report has been received by the editorial queue.'}
                    </p>
                    <p className="text-xs text-[#5F584D] dark:text-[#9AA3B5] mt-0.5">
                      {locale === 'fa'
                        ? 'می‌توانید همین حالا آن را در پنل مدیریت تحریریه بررسی و منتشر کنید.'
                        : 'You can review and publish it directly from the Editorial Studio.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onGoToStudio}
                  className="text-xs font-bold text-[#9E6F2C] dark:text-[#E5C17B] underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {locale === 'fa' ? 'مشاهده در تحریریه' : 'View in Studio'}
                </button>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-6 p-3.5 rounded-lg border border-red-600/35 bg-red-500/10 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="citizen-title"
                  className="block text-xs font-semibold text-[#161412] dark:text-[#EDE6D8] mb-2"
                >
                  {locale === 'fa' ? 'تیتر یا موضوع گزارش *' : 'Report Headline *'}
                </label>
                <input
                  id="citizen-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setSubmitted(false);
                  }}
                  placeholder={
                    locale === 'fa'
                      ? 'مثلاً: وضعیت جاده روستایی در ارتفاعات ساردوئیه پس از بارندگی'
                      : 'e.g., Mountain road conditions near Sarduiyeh after overnight rain'
                  }
                  className="w-full px-4 py-3 text-sm rounded-lg bg-[#F6F2EA] dark:bg-[#080A0F] border border-[#DDD3C2] dark:border-[#232B3D] text-[#161412] dark:text-[#F5F1E8] focus:outline-none focus:border-[#9E6F2C] dark:focus:border-[#E5C17B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="citizen-region"
                    className="block text-xs font-semibold text-[#161412] dark:text-[#EDE6D8] mb-2"
                  >
                    {locale === 'fa' ? 'منطقه / شهر' : 'Region'}
                  </label>
                  <select
                    id="citizen-region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value as RegionId)}
                    className="w-full px-4 py-3 text-sm rounded-lg bg-[#F6F2EA] dark:bg-[#080A0F] border border-[#DDD3C2] dark:border-[#232B3D] text-[#161412] dark:text-[#F5F1E8] focus:outline-none focus:border-[#9E6F2C] dark:focus:border-[#E5C17B]"
                  >
                    {REGIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label[locale]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="citizen-category"
                    className="block text-xs font-semibold text-[#161412] dark:text-[#EDE6D8] mb-2"
                  >
                    {locale === 'fa' ? 'میز موضوعی' : 'News Desk'}
                  </label>
                  <select
                    id="citizen-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryId)}
                    className="w-full px-4 py-3 text-sm rounded-lg bg-[#F6F2EA] dark:bg-[#080A0F] border border-[#DDD3C2] dark:border-[#232B3D] text-[#161412] dark:text-[#F5F1E8] focus:outline-none focus:border-[#9E6F2C] dark:focus:border-[#E5C17B]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label[locale]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="citizen-body"
                  className="block text-xs font-semibold text-[#161412] dark:text-[#EDE6D8] mb-2"
                >
                  {locale === 'fa' ? 'شرح کامل رویداد یا مطالبه *' : 'Detailed Description *'}
                </label>
                <textarea
                  id="citizen-body"
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    locale === 'fa'
                      ? 'جزئیات رویداد، مکان دقیق، زمان و خواسته‌های اهالی را بنویسید...'
                      : 'Share exact location, timing, and key details observed on the ground...'
                  }
                  className="w-full px-4 py-3 text-sm rounded-lg bg-[#F6F2EA] dark:bg-[#080A0F] border border-[#DDD3C2] dark:border-[#232B3D] text-[#161412] dark:text-[#F5F1E8] focus:outline-none focus:border-[#9E6F2C] dark:focus:border-[#E5C17B] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="citizen-name"
                    className="block text-xs font-semibold text-[#161412] dark:text-[#EDE6D8] mb-2"
                  >
                    {locale === 'fa' ? 'نام ارسال‌کننده (اختیاری)' : 'Your Name (Optional)'}
                  </label>
                  <input
                    id="citizen-name"
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder={locale === 'fa' ? 'ناشناس' : 'Anonymous'}
                    className="w-full px-4 py-3 text-sm rounded-lg bg-[#F6F2EA] dark:bg-[#080A0F] border border-[#DDD3C2] dark:border-[#232B3D] text-[#161412] dark:text-[#F5F1E8] focus:outline-none focus:border-[#9E6F2C] dark:focus:border-[#E5C17B]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="citizen-contact"
                    className="block text-xs font-semibold text-[#161412] dark:text-[#EDE6D8] mb-2"
                  >
                    {locale === 'fa' ? 'شماره تماس یا ایمیل (اختیاری)' : 'Phone or Email (Optional)'}
                  </label>
                  <input
                    id="citizen-contact"
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={locale === 'fa' ? 'صرفاً جهت پیگیری تحریریه' : 'For verification only'}
                    className="w-full px-4 py-3 text-sm rounded-lg bg-[#F6F2EA] dark:bg-[#080A0F] border border-[#DDD3C2] dark:border-[#232B3D] text-[#161412] dark:text-[#F5F1E8] focus:outline-none focus:border-[#9E6F2C] dark:focus:border-[#E5C17B]"
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#161412] dark:text-[#EDE6D8] mb-2">
                  {locale === 'fa' ? 'تصویر پیوست (اختیاری)' : 'Supporting Photograph (Optional)'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imageDataUrl ? (
                  <div className="relative rounded-lg border border-[#DDD3C2] dark:border-[#D4A85B]/25 bg-[#F6F2EA] dark:bg-[#080A0F] p-3">
                    <img
                      src={imageDataUrl}
                      alt={locale === 'fa' ? 'پیش‌نمایش تصویر پیوست' : 'Attached photo preview'}
                      className="w-full max-h-60 object-cover rounded-md"
                    />
                    <div className="mt-3 flex items-center justify-between text-xs text-[#5F584D] dark:text-[#9AA3B5]">
                      <span>{locale === 'fa' ? 'تصویر آماده ارسال است' : 'Image attached'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setImageDataUrl(undefined);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{locale === 'fa' ? 'حذف تصویر' : 'Remove'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-7 px-4 rounded-lg border border-dashed border-[#DDD3C2] dark:border-[#D4A85B]/30 hover:border-[#9E6F2C] dark:hover:border-[#E5C17B] text-xs sm:text-sm text-[#5F584D] dark:text-[#9AA3B5] flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ImagePlus className="w-5 h-5 text-[#9E6F2C] dark:text-[#E5C17B]" />
                    <span>
                      {locale === 'fa'
                        ? 'انتخاب تصویر از دستگاه (حداکثر ۴ مگابایت)'
                        : 'Upload photograph from device (Max 4 MB)'}
                    </span>
                  </button>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-luxury-ink w-full sm:w-auto !px-8 !py-3.5 text-sm"
                >
                  {locale === 'fa' ? 'ثبت و ارسال به تحریریه' : 'Submit Report to Newsroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
