import { useEffect, useState } from 'react';
import { CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react';
import type { ContactSubmission, Locale, SiteSettings } from '../types/news';

interface ContactViewProps {
  locale: Locale;
  settings: SiteSettings;
  prefilledSubject?: string;
  prefilledMessage?: string;
  onSubmitContact: (payload: Omit<ContactSubmission, 'id' | 'createdAt'>) => Promise<boolean>;
}

export function ContactView({
  locale,
  settings,
  prefilledSubject = '',
  prefilledMessage = '',
  onSubmitContact,
}: ContactViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(prefilledSubject);
  const [message, setMessage] = useState(prefilledMessage);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (prefilledSubject) setSubject(prefilledSubject);
    if (prefilledMessage) setMessage(prefilledMessage);
  }, [prefilledSubject, prefilledMessage]);

  const contactEmail = settings.contactEmail || 'info@nabzesardo.ir';
  const editorialPhone = settings.editorialPhone || '034-43210000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    const saved = await onSubmitContact({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim() || (locale === 'fa' ? 'پیام به تحریریه' : 'Editorial Inquiry'),
      message: message.trim(),
    });
    setSubmitting(false);
    if (!saved) return;
    setSent(true);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="w-full">
      <section
        className="w-full border-b-[0.5px] border-[#D9CEBC]/80 dark:border-[#D4A85B]/18 bg-[#07090E] text-[#F6F2EA]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 80% 20%, rgba(212, 168, 91, 0.18), transparent 52%)',
        }}
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20">
          <p className="text-xs font-bold text-[#F0D496] mb-3">
            {locale === 'fa' ? 'ارتباط مستقیم با تحریریه' : 'Direct Newsroom Desk'}
          </p>
          <h1
            className={`font-editorial-display text-3xl sm:text-5xl font-bold text-[#FDFBF7] mb-4 ${
              locale === 'fa' ? 'leading-[1.4]' : 'leading-tight'
            }`}
          >
            {locale === 'fa' ? 'تماس با پایگاه خبری نبض ساردو' : 'Contact Nabz Sardo'}
          </h1>
          <p className="text-sm sm:text-base text-[#EDE6D8]/82 max-w-2xl leading-[1.9]">
            {locale === 'fa'
              ? 'پیشنهادها، اصلاحیه‌های خبری، درخواست همکاری تحریریه و ارتباط با سردبیری را از طریق فرم زیر یا نشانی‌های رسمی ارسال کنید.'
              : 'Send editorial tips, corrections, press correspondence, or collaboration inquiries directly to our newsroom.'}
          </p>
        </div>
      </section>

      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-5 space-y-5">
          <div className="luxury-panel rounded-[22px] p-7 sm:p-8 space-y-6">
            <h2 className="font-editorial-display text-2xl font-bold text-[#141210] dark:text-[#F6F2EA]">
              {locale === 'fa' ? 'راه‌های ارتباطی تحریریه' : 'Newsroom Channels'}
            </h2>

            <div className="space-y-5 text-sm">
              <div className="flex items-start gap-3.5">
                <Mail className="w-4.5 h-4.5 text-[#9A6B27] dark:text-[#E8C680] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-[#5A5247] dark:text-[#A1AAB9] mb-1">
                    {locale === 'fa' ? 'پست الکترونیک تحریریه' : 'Editorial Email'}
                  </p>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="font-mono-tabular font-semibold text-[#141210] dark:text-[#F6F2EA] hover:text-[#8F6321] dark:hover:text-[#ECC983] transition-colors"
                    dir="ltr"
                  >
                    {contactEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <Phone className="w-4.5 h-4.5 text-[#9A6B27] dark:text-[#E8C680] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-[#5A5247] dark:text-[#A1AAB9] mb-1">
                    {locale === 'fa' ? 'خط مستقیم سردبیری' : 'Editorial Desk Line'}
                  </p>
                  <a
                    href={`tel:${editorialPhone.replace(/[^+\d]/g, '')}`}
                    className="font-mono-tabular font-semibold text-[#141210] dark:text-[#F6F2EA] hover:text-[#8F6321] dark:hover:text-[#ECC983] transition-colors"
                    dir="ltr"
                  >
                    {editorialPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <MapPin className="w-4.5 h-4.5 text-[#9A6B27] dark:text-[#E8C680] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-[#5A5247] dark:text-[#A1AAB9] mb-1">
                    {locale === 'fa' ? 'دفتر منطقه‌ای' : 'Regional Bureau'}
                  </p>
                  <p className="font-medium text-[#141210] dark:text-[#F6F2EA] leading-relaxed">
                    {locale === 'fa' ? settings.newsroomAddressFa : settings.newsroomAddressEn}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t-[0.5px] border-[#D9CEBC]/80 dark:border-[#D4A85B]/16 text-xs text-[#5A5247] dark:text-[#A1AAB9] leading-[1.85]">
              {locale === 'fa'
                ? 'توجه: نبض ساردو درخواست انتشار آگهی تجاری، رپورتاژ تبلیغاتی و اطلاعیه ترحیم نمی‌پذیرد.'
                : 'Note: Nabz Sardo does not accept commercial advertisements, advertorials, or obituary announcements.'}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 luxury-panel rounded-[24px] p-7 sm:p-10">
          {sent ? (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="w-11 h-11 text-[#9A6B27] dark:text-[#E8C680] mx-auto" />
              <h2 className="font-editorial-display text-2xl font-bold text-[#141210] dark:text-[#F6F2EA]">
                {locale === 'fa' ? 'پیام شما به دست تحریریه رسید' : 'Your message has been received'}
              </h2>
              <p className="text-sm text-[#5A5247] dark:text-[#A1AAB9] max-w-md mx-auto leading-relaxed">
                {locale === 'fa'
                  ? 'دبیران بخش مربوطه پیام شما را بررسی و در صورت نیاز پاسخ خواهند داد.'
                  : 'Our editors will review your note and respond if follow-up is required.'}
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="btn-luxury-ink mt-2 text-xs sm:text-sm"
              >
                {locale === 'fa' ? 'ارسال پیام دیگر' : 'Send Another Message'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="font-editorial-display text-2xl font-bold text-[#141210] dark:text-[#F6F2EA] mb-2">
                {locale === 'fa' ? 'ارسال پیام به سردبیری' : 'Write to the Editors'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#141210] dark:text-[#EDE6D8] mb-2">
                    {locale === 'fa' ? 'نام و نام خانوادگی *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full min-h-[46px] px-4 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA] focus:outline-none focus:border-[#9A6B27]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#141210] dark:text-[#EDE6D8] mb-2">
                    {locale === 'fa' ? 'ایمیل یا شماره تماس' : 'Email or Phone'}
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[46px] px-4 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA] focus:outline-none focus:border-[#9A6B27]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#141210] dark:text-[#EDE6D8] mb-2">
                  {locale === 'fa' ? 'موضوع پیام' : 'Subject'}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full min-h-[46px] px-4 py-2.5 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA] focus:outline-none focus:border-[#9A6B27]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#141210] dark:text-[#EDE6D8] mb-2">
                  {locale === 'fa' ? 'متن پیام *' : 'Message *'}
                </label>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl bg-[#F5F0E6] dark:bg-[#080A0F] border-[0.5px] border-[#D9CEBC] dark:border-[#D4A85B]/20 text-[#141210] dark:text-[#F6F2EA] leading-relaxed focus:outline-none focus:border-[#9A6B27]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-luxury-ink text-xs sm:text-sm disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting
                    ? locale === 'fa'
                      ? 'در حال ارسال...'
                      : 'Sending...'
                    : locale === 'fa'
                      ? 'ارسال پیام به تحریریه'
                      : 'Send Message'}
                </span>
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
