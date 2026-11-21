import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Download,
  Edit3,
  Eye,
  ImagePlus,
  Plus,
  RotateCcw,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { CATEGORIES, EDITORIAL_IMAGES, REGIONS } from '../data/initialData';
import type { Article, CategoryId, CitizenReport, Locale, RegionId } from '../types/news';
import {
  formatNumber,
  formatShortDate,
  getCategoryLabel,
  getRegionLabel,
} from '../utils/formatters';
import { EditorialImage } from './EditorialImage';

interface AdminStudioProps {
  articles: Article[];
  citizenReports: CitizenReport[];
  locale: Locale;
  onSaveArticle: (article: Article, isNew: boolean) => void;
  onDeleteArticle: (id: string) => void;
  onApproveCitizenReport: (report: CitizenReport) => void;
  onArchiveCitizenReport: (id: string) => void;
  onPreviewArticle: (article: Article) => void;
  onExportJson: () => void;
  onResetDefaults: () => void;
}

type StudioTab = 'articles' | 'citizen' | 'deploy';

const COVER_PRESETS = [
  { labelFa: 'ارتفاعات ساردوئیه', labelEn: 'Sarduiyeh Highlands', url: EDITORIAL_IMAGES.sarduiyehHighlands },
  { labelFa: 'کشاورزی جیرفت', labelEn: 'Jiroft Agriculture', url: EDITORIAL_IMAGES.jiroftAgriculture },
  { labelFa: 'میراث خشتی کرمان', labelEn: 'Kerman Heritage', url: EDITORIAL_IMAGES.kermanHeritage },
  { labelFa: 'اقلیم و جاده کوهستان', labelEn: 'Mountain Weather', url: EDITORIAL_IMAGES.mountainWeather },
  { labelFa: 'فرهنگ و شعر جنوب', labelEn: 'Cultural Salon', url: EDITORIAL_IMAGES.communityCulture },
];

export function AdminStudio({
  articles,
  citizenReports,
  locale,
  onSaveArticle,
  onDeleteArticle,
  onApproveCitizenReport,
  onArchiveCitizenReport,
  onPreviewArticle,
  onExportJson,
  onResetDefaults,
}: AdminStudioProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('articles');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [titleFa, setTitleFa] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [deckFa, setDeckFa] = useState('');
  const [deckEn, setDeckEn] = useState('');
  const [bodyFa, setBodyFa] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [category, setCategory] = useState<CategoryId>('sarduiyeh');
  const [region, setRegion] = useState<RegionId>('sarduiyeh');
  const [authorFa, setAuthorFa] = useState('تحریریه نبض ساردو');
  const [coverImage, setCoverImage] = useState<string>(EDITORIAL_IMAGES.sarduiyehHighlands);
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [featuredInHero, setFeaturedInHero] = useState(true);
  const [isBreaking, setIsBreaking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingReports = citizenReports.filter((r) => r.status === 'pending');

  const openNewComposer = () => {
    setEditingId(null);
    setTitleFa('');
    setTitleEn('');
    setDeckFa('');
    setDeckEn('');
    setBodyFa('');
    setBodyEn('');
    setCategory('sarduiyeh');
    setRegion('sarduiyeh');
    setAuthorFa('تحریریه نبض ساردو');
    setCoverImage(EDITORIAL_IMAGES.sarduiyehHighlands);
    setStatus('published');
    setFeaturedInHero(false);
    setIsBreaking(false);
    setIsComposerOpen(true);
  };

  const openEditComposer = (article: Article) => {
    setEditingId(article.id);
    setTitleFa(article.title.fa);
    setTitleEn(article.title.en);
    setDeckFa(article.deck.fa);
    setDeckEn(article.deck.en);
    setBodyFa(article.body.fa.join('\n\n'));
    setBodyEn(article.body.en.join('\n\n'));
    setCategory(article.category);
    setRegion(article.region);
    setAuthorFa(article.author.fa);
    setCoverImage(article.coverImage);
    setStatus(article.status);
    setFeaturedInHero(article.featuredInHero);
    setIsBreaking(Boolean(article.isBreaking));
    setIsComposerOpen(true);
  };

  const handleUploadCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setCoverImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleFa.trim() && !titleEn.trim()) return;

    const finalTitleFa = titleFa.trim() || titleEn.trim();
    const finalTitleEn = titleEn.trim() || titleFa.trim();
    const finalDeckFa =
      deckFa.trim() ||
      bodyFa.trim().slice(0, 140) ||
      'گزارش اختصاصی تحریریه نبض ساردو از جنوب کرمان.';
    const finalDeckEn =
      deckEn.trim() ||
      bodyEn.trim().slice(0, 140) ||
      finalDeckFa;

    const faParagraphs = bodyFa
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const enParagraphs = bodyEn
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    const existing = editingId ? articles.find((a) => a.id === editingId) : undefined;
    const id = existing ? existing.id : `art-${Date.now()}`;
    const slugBase = finalTitleEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const articleObj: Article = {
      id,
      slug: existing ? existing.slug : `${slugBase || 'dispatch'}-${Date.now().toString(36)}`,
      title: { fa: finalTitleFa, en: finalTitleEn },
      deck: { fa: finalDeckFa, en: finalDeckEn },
      body: {
        fa: faParagraphs.length > 0 ? faParagraphs : [finalDeckFa],
        en: enParagraphs.length > 0 ? enParagraphs : faParagraphs.length > 0 ? faParagraphs : [finalDeckEn],
      },
      pullQuote: existing?.pullQuote,
      category,
      region,
      author: {
        fa: authorFa.trim() || 'تحریریه نبض ساردو',
        en: existing?.author.en || 'Nabz Sardo Newsroom',
      },
      authorRole: {
        fa: 'تحریریه منطقه‌ای',
        en: 'Regional Editorial Desk',
      },
      coverImage,
      imageCaption: {
        fa: `نگاره تحریریه — ${getRegionLabel(region, 'fa')}`,
        en: `Editorial photo — ${getRegionLabel(region, 'en')}`,
      },
      publishedAt: existing ? existing.publishedAt : new Date().toISOString(),
      readTimeMin: Math.max(2, Math.ceil((faParagraphs.join(' ').split(/\s+/).length || 120) / 140)),
      views: existing ? existing.views : 120,
      status,
      featuredInHero,
      isBreaking,
    };

    onSaveArticle(articleObj, !existing);
    setIsComposerOpen(false);
    setEditingId(null);
  };

  return (
    <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-18">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 mb-8 border-b border-[#DDD3C2] dark:border-[#D4A85B]/20">
        <div>
          <p className="text-xs font-bold text-[#9E6F2C] dark:text-[#E5C17B] mb-2">
            {locale === 'fa' ? 'استودیو و پنل تحریریه نبض ساردو' : 'Nabz Sardo Editorial Studio'}
          </p>
          <h1 className="font-editorial-display text-3xl sm:text-4xl font-bold text-[#161412] dark:text-[#F5F1E8]">
            {locale === 'fa'
              ? 'مدیریت خبرها، گزارش‌های مردمی و انتشار'
              : 'Newsroom Publishing & Citizen Queue'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openNewComposer}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold bg-[#161412] text-[#F6F2EA] hover:bg-[#9E6F2C] dark:bg-gradient-to-b dark:from-[#E5C17B] dark:to-[#C6964B] dark:text-[#080A0F] dark:hover:brightness-110 rounded-md transition-all shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{locale === 'fa' ? 'نوشتن خبر جدید' : 'New Article'}</span>
          </button>

          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border border-[#DDD3C2] dark:border-[#D4A85B]/25 text-[#161412] dark:text-[#EDE6D8] hover:border-[#9E6F2C] dark:hover:border-[#E5C17B] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{locale === 'fa' ? 'خروجی JSON' : 'Export JSON'}</span>
          </button>
        </div>
      </div>

      {/* Studio Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-md transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'articles'
              ? 'bg-[#161412] text-[#F6F2EA] dark:bg-gradient-to-b dark:from-[#E5C17B] dark:to-[#C6964B] dark:text-[#080A0F]'
              : 'luxury-panel text-[#5F584D] hover:text-[#161412] dark:text-[#9AA3B5] dark:hover:text-[#F5F1E8]'
          }`}
        >
          {locale === 'fa'
            ? `فهرست اخبار (${formatNumber(articles.length, locale)})`
            : `All Articles (${articles.length})`}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('citizen')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-md transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'citizen'
              ? 'bg-[#161412] text-[#F6F2EA] dark:bg-gradient-to-b dark:from-[#E5C17B] dark:to-[#C6964B] dark:text-[#080A0F]'
              : 'luxury-panel text-[#5F584D] hover:text-[#161412] dark:text-[#9AA3B5] dark:hover:text-[#F5F1E8]'
          }`}
        >
          {locale === 'fa'
            ? `صف گزارش‌های مردمی (${formatNumber(pendingReports.length, locale)})`
            : `Citizen Queue (${pendingReports.length})`}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deploy')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-md transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'deploy'
              ? 'bg-[#161412] text-[#F6F2EA] dark:bg-gradient-to-b dark:from-[#E5C17B] dark:to-[#C6964B] dark:text-[#080A0F]'
              : 'luxury-panel text-[#5F584D] hover:text-[#161412] dark:text-[#9AA3B5] dark:hover:text-[#F5F1E8]'
          }`}
        >
          {locale === 'fa' ? 'انتشار روی گیت‌هاب و کلودفلر' : 'GitHub & Cloudflare Deploy'}
        </button>
      </div>

      {/* Article Composer */}
      {isComposerOpen && (
        <div className="mb-10 luxury-panel rounded-xl overflow-hidden">
          <div className="h-[1px] w-full gold-hairline" />
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#DDD3C2] dark:border-[#D4A85B]/15">
              <h2 className="font-editorial-display text-2xl font-bold text-[#161412] dark:text-[#F5F1E8]">
                {editingId
                  ? locale === 'fa'
                    ? 'ویرایش خبر'
                    : 'Edit Article'
                  : locale === 'fa'
                    ? 'انتشار خبر جدید در تحریریه'
                    : 'Publish New Editorial Dispatch'}
              </h2>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="p-1.5 text-[#5F584D] dark:text-[#9AA3B5] hover:text-[#161412] dark:hover:text-[#F5F1E8] cursor-pointer"
                aria-label={locale === 'fa' ? 'بستن فرم' : 'Close editor'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitArticle} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#161412] dark:text-[#EDE6D8] mb-1.5">
                    {locale === 'fa' ? 'تیتر فارسی *' : 'Persian Headline *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={titleFa}
                    onChange={(e) => setTitleFa(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg bg-[#F6F2EA] dark:bg-[#080A0F] border border-[#DDD3C2] dark:border-[#232B3D] text-[#161412] dark:text-[#F5F1E8] focus:outline-none focus:border-[#9E6F2C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#161412] dark:text-[#EDE6D8] mb-1.5">
                    {locale === 'fa' ? 'تیتر انگلیسی (اختیاری)' : 'English Headline (Optional)'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg bg-[#F6F2EA] dark:bg-[#080A0F] border border-[#DDD3C2] dark:border-[#232B3D] text-[#161412] dark:text-[#F5F1E8] focus:outline-none focus:border-[#9E6F2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#161412] dark:text-[#EDE6D8] mb-1.5">
                    {locale === 'fa' ? 'میز خبری' : 'Desk'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryId)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#F6F2EA] dark:bg-[#080A0F] border border-[#DDD3C2] dark:border-[#232B3D] text-[#161412] dark:text-[#F5F1E8]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label[locale]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#161412] dark:text-[#EDE6D8] mb-1.5">
                    {locale === 'fa' ? 'منطقه' : 'Region'}
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as RegionId)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#F6F2EA] dark:bg-[#080A0F] border border-[#DDD3C2] dark:border-[#232B3D] text-[#161412] dark:text-[#F5F1E8]"
                  >
                    {REGIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label[locale]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#161412] dark:text-[#EDE6D8] mb-1.5">
                    {locale === 'fa' ? 'نام خبرنگار / سرویس' : 'Author / Desk'}
                  </label>
                  <input
                    type="text"
                    value={authorFa}
                    onChange={(e) => setAuthorFa(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#F6F2EA] dark:bg-[#080A0F] border border-[#DDD3C2] dark:border-[#232B3D] text-[#161412] dark:text-[#F5F1E8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#161412] dark:text-[#EDE6D8] mb-1.5">
                    {locale === 'fa' ? 'خلاصه (لید خبر) فارسی' : 'Persian Summary Deck'}
                  </label>
                  <textarea
                    rows={2}
                    value={deckFa}
                    onChange={(e) => setDeckFa(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg bg-[#F6F2EA] dark:bg-[#080A0F] border border-[#DDD3C2] dark:border-[#232B3D] text-[#161412] dark:text-[#F5F1E8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#161412] dark:text-[#EDE6D8] mb-1.5">
                    {locale === 'fa' ? 'خلاصه انگلیسی (اختیاری)' : 'English Summary Deck'}
                  </label>
                  <textarea
                    rows={2}
                    dir="ltr"
                    value={deckEn}
                    onChange={(e) => setDeckEn(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg bg-[#F6F2EA] dark:bg-[#080A0F] border border-[#DDD3C2] dark:border-[#232B3D] text-[#161412] dark:text-[#F5F1E8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#161412] dark:text-[#EDE6D8] mb-1.5">
                  {locale === 'fa'
                    ? 'متن کامل خبر (پاراگراف‌ها با یک خط خالی جدا شوند)'
                    : 'Full Story Body (Separate paragraphs with a blank line)'}
                </label>
                <textarea
                  rows={5}
                  value={bodyFa}
                  onChange={(e) => setBodyFa(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-lg bg-[#F6F2EA] dark:bg-[#080A0F] border border-[#DDD3C2] dark:border-[#232B3D] text-[#161412] dark:text-[#F5F1E8] leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#161412] dark:text-[#EDE6D8]">
                    {locale === 'fa' ? 'تصویر جلد خبر' : 'Cover Photograph'}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9E6F2C] dark:text-[#E5C17B] hover:underline cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>{locale === 'fa' ? 'آپلود تصویر اختصاصی' : 'Upload custom photo'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadCover}
                    className="hidden"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {COVER_PRESETS.map((preset) => {
                    const selected = coverImage === preset.url;
                    return (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setCoverImage(preset.url)}
                        className={`group text-start rounded-lg border p-1.5 transition-colors cursor-pointer ${
                          selected
                            ? 'border-[#9E6F2C] dark:border-[#E5C17B] bg-[#9E6F2C]/5 dark:bg-[#E5C17B]/10'
                            : 'border-[#DDD3C2] dark:border-[#232B3D]'
                        }`}
                      >
                        <div className="aspect-[16/10] rounded overflow-hidden mb-1.5">
                          <EditorialImage src={preset.url} alt={preset.labelEn} />
                        </div>
                        <span className="block text-[11px] truncate text-[#5F584D] dark:text-[#9AA3B5] px-0.5">
                          {locale === 'fa' ? preset.labelFa : preset.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-[#DDD3C2] dark:border-[#D4A85B]/15 text-xs sm:text-sm">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status === 'published'}
                    onChange={(e) => setStatus(e.target.checked ? 'published' : 'draft')}
                    className="accent-[#9E6F2C]"
                  />
                  <span>{locale === 'fa' ? 'انتشار عمومی فوری' : 'Publish immediately'}</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featuredInHero}
                    onChange={(e) => setFeaturedInHero(e.target.checked)}
                    className="accent-[#9E6F2C]"
                  />
                  <span>{locale === 'fa' ? 'نمایش در هیرو زنده صفحه نخست' : 'Feature in Live Hero'}</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBreaking}
                    onChange={(e) => setIsBreaking(e.target.checked)}
                    className="accent-[#9E6F2C]"
                  />
                  <span>{locale === 'fa' ? 'افزودن به خط فوری' : 'Add to Live Wire'}</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#161412] text-[#F6F2EA] hover:bg-[#9E6F2C] dark:bg-gradient-to-b dark:from-[#E5C17B] dark:to-[#C6964B] dark:text-[#080A0F] text-xs sm:text-sm font-bold rounded-md transition-all cursor-pointer"
                >
                  {editingId
                    ? locale === 'fa'
                      ? 'ذخیره تغییرات'
                      : 'Save Changes'
                    : locale === 'fa'
                      ? 'انتشار در نبض ساردو'
                      : 'Publish to Nabz Sardo'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-medium text-[#5F584D] dark:text-[#9AA3B5] hover:text-[#161412] dark:hover:text-[#F5F1E8] cursor-pointer"
                >
                  {locale === 'fa' ? 'انصراف' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 1: Articles Cards */}
      {activeTab === 'articles' && (
        <div className="space-y-5">
          {articles.map((item, idx) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: Math.min(idx * 0.04, 0.25),
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -2 }}
              className="magazine-card group relative rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[0.75px] bg-gradient-to-r from-transparent via-[#9E6F2C]/55 dark:via-[#E5C17B]/55 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
              <div className="flex items-start gap-5 min-w-0">
                <div className="w-28 sm:w-32 aspect-[4/3] rounded-xl shrink-0 overflow-hidden bg-[#EFE9DD] dark:bg-[#080A0F] border-[0.75px] border-[#DDD3C2]/70 dark:border-[#F5F1E8]/10">
                  <EditorialImage
                    src={item.coverImage}
                    alt={item.title[locale]}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5F584D] dark:text-[#9AA3B5]">
                    <span className="font-bold tracking-[0.04em] text-[#9E6F2C] dark:text-[#E5C17B]">
                      {getCategoryLabel(item.category, locale)}
                    </span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span>{getRegionLabel(item.region, locale)}</span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span>
                      {item.status === 'published'
                        ? locale === 'fa'
                          ? 'منتشرشده'
                          : 'Published'
                        : locale === 'fa'
                          ? 'پیش‌نویس'
                          : 'Draft'}
                    </span>
                    {item.featuredInHero && (
                      <>
                        <span aria-hidden="true" className="opacity-40">·</span>
                        <span className="inline-flex items-center gap-1 text-[#9E6F2C] dark:text-[#E5C17B]">
                          <Star className="w-3 h-3" />
                          <span>{locale === 'fa' ? 'هیرو زنده' : 'Live Hero'}</span>
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="font-editorial-display text-lg sm:text-xl font-bold text-[#161412] dark:text-[#F5F1E8] group-hover:text-[#9E6F2C] dark:group-hover:text-[#E5C17B] transition-colors duration-300 leading-snug">
                    {item.title[locale]}
                  </h3>
                  <p className="text-xs text-[#5F584D] dark:text-[#9AA3B5] tabular-nums">
                    {formatShortDate(item.publishedAt, locale)} · {formatNumber(item.views, locale)}{' '}
                    {locale === 'fa' ? 'بازدید' : 'views'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onPreviewArticle(item)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-[0.75px] border-[#DDD3C2] dark:border-[#D4A85B]/22 text-[#161412] dark:text-[#EDE6D8] hover:border-[#9E6F2C] dark:hover:border-[#E5C17B] hover:bg-[#FDFBF7]/75 dark:hover:bg-[#171F30]/60 rounded-lg transition-all duration-300 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{locale === 'fa' ? 'نمایش' : 'Read'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEditComposer(item)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-[0.75px] border-[#DDD3C2] dark:border-[#D4A85B]/22 text-[#161412] dark:text-[#EDE6D8] hover:border-[#9E6F2C] dark:hover:border-[#E5C17B] hover:bg-[#FDFBF7]/75 dark:hover:bg-[#171F30]/60 rounded-lg transition-all duration-300 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{locale === 'fa' ? 'ویرایش' : 'Edit'}</span>
                </button>
                {confirmDeleteId === item.id ? (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteArticle(item.id);
                        setConfirmDeleteId(null);
                      }}
                      className="px-3 py-2 text-xs font-bold bg-red-600 text-white rounded-lg cursor-pointer"
                    >
                      {locale === 'fa' ? 'تایید حذف' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-2 text-xs text-[#5F584D] dark:text-[#9AA3B5] cursor-pointer"
                    >
                      {locale === 'fa' ? 'لغو' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(item.id)}
                    aria-label={locale === 'fa' ? 'حذف خبر' : 'Delete article'}
                    className="p-2 text-[#5F584D] dark:text-[#9AA3B5] hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {/* Tab 2: Citizen Reports Queue */}
      {activeTab === 'citizen' && (
        <div className="space-y-5">
          {citizenReports.length === 0 ? (
            <div className="luxury-panel rounded-2xl p-14 text-center">
              <p className="text-sm text-[#5F584D] dark:text-[#9AA3B5]">
                {locale === 'fa' ? 'گزارش مردمی ثبت نشده است.' : 'No citizen reports submitted yet.'}
              </p>
            </div>
          ) : (
            citizenReports.map((report, idx) => (
              <motion.article
                key={report.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: Math.min(idx * 0.05, 0.25),
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ y: -2 }}
                className="magazine-card group relative rounded-2xl p-7 sm:p-8 flex flex-col lg:flex-row lg:items-start justify-between gap-7 overflow-hidden"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-[0.75px] bg-gradient-to-r from-transparent via-[#9E6F2C]/55 dark:via-[#E5C17B]/55 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                />
                <div className="space-y-3 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5F584D] dark:text-[#9AA3B5]">
                    <span className="font-bold tracking-[0.04em] text-[#9E6F2C] dark:text-[#E5C17B]">
                      {getCategoryLabel(report.category, locale)}
                    </span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span>{getRegionLabel(report.region, locale)}</span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span>{report.reporterName}</span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span>
                      {report.status === 'pending'
                        ? locale === 'fa'
                          ? 'در انتظار بررسی'
                          : 'Pending review'
                        : report.status === 'approved'
                          ? locale === 'fa'
                            ? 'منتشرشده در سایت'
                            : 'Published'
                          : locale === 'fa'
                            ? 'بایگانی‌شده'
                            : 'Archived'}
                    </span>
                  </div>

                  <h3 className="font-editorial-display text-xl font-bold text-[#161412] dark:text-[#F5F1E8] leading-snug">
                    {report.title}
                  </h3>

                  <p className="text-sm text-[#5F584D] dark:text-[#9AA3B5] leading-relaxed">
                    {report.description}
                  </p>

                  {report.imageDataUrl && (
                    <img
                      src={report.imageDataUrl}
                      alt={report.title}
                      className="mt-4 max-h-56 rounded-xl object-cover border-[0.75px] border-[#DDD3C2] dark:border-[#D4A85B]/20"
                    />
                  )}
                </div>

                {report.status === 'pending' && (
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onApproveCitizenReport(report)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-[#161412] text-[#F6F2EA] hover:bg-[#9E6F2C] dark:bg-gradient-to-b dark:from-[#E5C17B] dark:to-[#C6964B] dark:text-[#080A0F] rounded-lg transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{locale === 'fa' ? 'تایید و انتشار خبر' : 'Approve & Publish'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onArchiveCitizenReport(report.id)}
                      className="px-4 py-2.5 text-xs font-semibold border-[0.75px] border-[#DDD3C2] dark:border-[#D4A85B]/20 text-[#5F584D] dark:text-[#9AA3B5] hover:text-[#161412] dark:hover:text-[#F5F1E8] rounded-lg transition-colors cursor-pointer"
                    >
                      {locale === 'fa' ? 'بایگانی' : 'Archive'}
                    </button>
                  </div>
                )}
              </motion.article>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Cloudflare Pages & GitHub Actions */}
      {activeTab === 'deploy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 luxury-panel rounded-xl overflow-hidden">
            <div className="h-[1px] w-full gold-hairline" />
            <div className="p-6 sm:p-8 space-y-6">
              <h2 className="font-editorial-display text-2xl font-bold text-[#161412] dark:text-[#F5F1E8]">
                {locale === 'fa'
                  ? 'پیکربندی آماده استقرار روی GitHub و Cloudflare Pages'
                  : 'Ready-to-Deploy GitHub & Cloudflare Pages Setup'}
              </h2>
              <p className="text-sm text-[#5F584D] dark:text-[#9AA3B5] leading-relaxed">
                {locale === 'fa'
                  ? 'تمامی فایل‌های استاندارد برای بیلد استاتیک سریع، مسیریابی SPA و انتشار خودکار از مخزن emadmir68/NabezSardo آماده هستند.'
                  : 'All static build rules, SPA routing redirects, and GitHub Actions workflows are bundled for emadmir68/NabezSardo.'}
              </p>

              <ol className="space-y-4 text-sm text-[#161412] dark:text-[#EDE6D8]">
                <li className="pb-4 border-b border-[#DDD3C2]/70 dark:border-[#D4A85B]/15">
                  <strong className="block mb-1">
                    {locale === 'fa' ? '۱. اتصال با Save to GitHub در نوار بالا' : '1. Save to GitHub from the Top Bar'}
                  </strong>
                  <span className="text-xs text-[#5F584D] dark:text-[#9AA3B5]">
                    {locale === 'fa'
                      ? 'پروژه را مستقیم به شاخه main مخزن emadmir68/NabezSardo متصل و ذخیره کنید.'
                      : 'Push the project directly to the main branch of emadmir68/NabezSardo.'}
                  </span>
                </li>
                <li className="pb-4 border-b border-[#DDD3C2]/70 dark:border-[#D4A85B]/15">
                  <strong className="block mb-1">
                    {locale === 'fa' ? '۲. تنظیمات بیلد Cloudflare Pages' : '2. Cloudflare Pages Build Settings'}
                  </strong>
                  <span className="font-mono-tabular text-xs text-[#9E6F2C] dark:text-[#E5C17B]">
                    Build: npm run build · Output: dist
                  </span>
                </li>
                <li>
                  <strong className="block mb-1">
                    {locale === 'fa' ? '۳. انتشار خودکار روی دامنه nabzesardo.ir' : '3. Automatic Deploy to nabzesardo.ir'}
                  </strong>
                  <span className="text-xs text-[#5F584D] dark:text-[#9AA3B5]">
                    {locale === 'fa'
                      ? 'با هر تغییر جدید در شاخه main، کلودفلر نسخه تازه را به‌طور خودکار بیلد و منتشر می‌کند.'
                      : 'Every update pushed to main automatically triggers a live production build on Cloudflare.'}
                  </span>
                </li>
              </ol>
            </div>
          </div>

          <div className="lg:col-span-4 luxury-panel rounded-xl p-6 space-y-5">
            <h3 className="font-editorial-display text-xl font-bold text-[#161412] dark:text-[#F5F1E8]">
              {locale === 'fa' ? 'پشتیبان‌گیری و بازنشانی' : 'Backup & Reset'}
            </h3>
            <p className="text-xs text-[#5F584D] dark:text-[#9AA3B5] leading-relaxed">
              {locale === 'fa'
                ? 'تمامی خبرهای ساخته‌شده و گزارش‌های مردمی در مرورگر ذخیره می‌شوند. می‌توانید نسخه پشتیبان JSON بگیرید یا محتوای نمونه پایه را بازیابی کنید.'
                : 'Published edits and citizen reports persist in local storage. Export a JSON snapshot anytime or restore the initial curated edition.'}
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onExportJson}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-[#161412] text-[#F6F2EA] dark:bg-gradient-to-b dark:from-[#E5C17B] dark:to-[#C6964B] dark:text-[#080A0F] rounded-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{locale === 'fa' ? 'دانلود نسخه پشتیبان JSON' : 'Download JSON Backup'}</span>
              </button>
              <button
                type="button"
                onClick={onResetDefaults}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold border border-[#DDD3C2] dark:border-[#D4A85B]/20 text-[#5F584D] dark:text-[#9AA3B5] hover:text-[#161412] dark:hover:text-[#F5F1E8] rounded-md cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{locale === 'fa' ? 'بازنشانی به نسخه پایه تحریریه' : 'Restore Default Edition'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
