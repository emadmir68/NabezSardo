import { CheckCircle2, Clock, Compass } from 'lucide-react';
import type { ActiveView, FollowUpCase, Locale } from '../types/news';
import { formatShortDate } from '../utils/formatters';

interface FollowUpViewProps {
  followups: FollowUpCase[];
  locale: Locale;
  onNavigate: (view: ActiveView) => void;
}

const STATUS_LABELS: Record<string, { fa: string; en: string; cls: string }> = {
  announced: { fa: 'اعلام شد', en: 'Announced', cls: 'bg-[#8F6321]/12 text-[#8F6321] dark:text-[#ECC983]' },
  started: { fa: 'شروع شد', en: 'Started', cls: 'bg-sky-500/12 text-sky-700 dark:text-sky-300' },
  progress: { fa: 'در حال اجرا', en: 'In Progress', cls: 'bg-amber-500/12 text-amber-700 dark:text-amber-300' },
  completed: { fa: 'تکمیل شد', en: 'Completed', cls: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' },
  paused: { fa: 'متوقف / در انتظار', en: 'Paused', cls: 'bg-rose-500/12 text-rose-700 dark:text-rose-300' },
  closed: { fa: 'مختومه', en: 'Closed', cls: 'bg-stone-500/12 text-stone-600 dark:text-stone-300' },
};

export function FollowUpView({ followups, locale, onNavigate }: FollowUpViewProps) {
  return (
    <div className="w-full pb-20">
      <section className="w-full border-b border-[#D9CEBA] dark:border-[#D4A85B]/18 bg-[#080A10] text-[#F5F1E8]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20">
          <p className="inline-flex items-center gap-2 text-xs font-bold text-[#F1D79A] mb-3">
            <Compass className="w-4 h-4" />
            <span>{locale === 'fa' ? 'میز پیگیری مطالبات عمومی' : 'PUBLIC FOLLOW-UP DESK'}</span>
          </p>
          <h1 className="font-editorial-display text-3xl sm:text-5xl font-bold text-[#FDFBF7] mb-4">
            {locale === 'fa' ? 'پیگیری تا نتیجه' : 'Follow-Ups Until Resolution'}
          </h1>
          <p className="text-sm sm:text-base text-[#EDE6D8]/82 max-w-2xl leading-[1.9]">
            {locale === 'fa'
              ? 'رصد مستمر وعده‌ها، پروژه‌های عمرانی و مطالبات مردم ساردوئیه، جیرفت و جنوب کرمان از زمان اعلام تا اجرای نهایی.'
              : 'Tracking civic commitments, local infrastructure projects, and public issues across South Kerman.'}
          </p>
        </div>
      </section>

      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        {followups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followups.map((item) => {
              const st = STATUS_LABELS[item.status || 'announced'] || STATUS_LABELS.announced;
              return (
                <article key={item.id} className="magazine-card rounded-2xl p-6 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${st.cls}`}>
                        {st[locale]}
                      </span>
                      {item.updatedAt && (
                        <span className="text-xs text-[#5B5246] dark:text-[#A3ADBF] inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatShortDate(item.updatedAt, locale)}</span>
                        </span>
                      )}
                    </div>
                    <h2 className="font-editorial-display text-xl font-bold text-[#161310] dark:text-[#F5F1E8]">
                      {item.title}
                    </h2>
                    {item.promise && (
                      <p className="text-sm text-[#5B5246] dark:text-[#A3ADBF] leading-[1.85]">
                        {item.promise}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-xs bg-[#EDE5D6]/60 dark:bg-[#171E30] p-3 rounded-xl text-[#161310] dark:text-[#EAE5DC]">
                        <strong>{locale === 'fa' ? 'آخرین وضعیت: ' : 'Latest status: '}</strong>
                        {item.note}
                      </p>
                    )}
                  </div>
                  <div className="pt-3 border-t border-[#D9CEBA]/70 dark:border-[#252E42] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5B5246] dark:text-[#A3ADBF]">
                    <span>{[item.promisor, item.location].filter(Boolean).join(' · ') || 'نبض ساردو'}</span>
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        className="font-bold text-[#8F6321] dark:text-[#ECC983] hover:underline"
                      >
                        {item.sourceLabel || (locale === 'fa' ? 'مشاهده سند ↗' : 'Source ↗')}
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="luxury-panel rounded-2xl p-10 text-center space-y-4 max-w-2xl mx-auto">
            <CheckCircle2 className="w-10 h-10 mx-auto text-[#8F6321] dark:text-[#ECC983]" />
            <h2 className="font-editorial-display text-2xl font-bold text-[#161310] dark:text-[#F5F1E8]">
              {locale === 'fa'
                ? 'پرونده جدیدی در نوبت ثبت است'
                : 'No active public follow-up cases yet'}
            </h2>
            <p className="text-sm text-[#5B5246] dark:text-[#A3ADBF] leading-relaxed">
              {locale === 'fa'
                ? 'موضوع یا مطالبه محلی برای پیگیری تا حصول نتیجه دارید؟ از بخش ارسال خبر مردمی برای تحریریه بفرستید.'
                : 'Have a civic issue or project that needs sustained follow-up? Submit it to our newsroom.'}
            </p>
            <button type="button" onClick={() => onNavigate('submit')} className="btn-luxury-ink">
              <span>{locale === 'fa' ? 'ثبت موضوع برای پیگیری' : 'Submit Issue for Follow-Up'}</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
