import { ArrowRight, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import type { Locale } from '../types/news';

interface AdminLoginViewProps {
  locale: Locale;
  onAuthenticated: (token: string) => void;
  onCancel: () => void;
}

export function AdminLoginView({ locale, onCancel }: AdminLoginViewProps) {
  return (
    <section className="max-w-lg mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="luxury-panel rounded-[24px] p-7 sm:p-10 space-y-6">
        <div className="space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-[#8F6321]/12 dark:bg-[#D4A85B]/15 text-[#8F6321] dark:text-[#ECC983] border border-[#8F6321]/25 dark:border-[#D4A85B]/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold tracking-wider uppercase text-[#8F6321] dark:text-[#ECC983]">
            {locale === 'fa' ? 'دسترسی امن تحریریه' : 'EDITORIAL STUDIO ACCESS'}
          </p>
          <h1 className="font-editorial-display text-2xl sm:text-3xl font-bold text-[#161310] dark:text-[#F5F1E8]">
            {locale === 'fa' ? 'ورود به اتاق خبر نبض ساردو' : 'Sign in to Nabz Sardo Studio'}
          </h1>
          <p className="text-sm text-[#5B5246] dark:text-[#A3ADBF] leading-relaxed">
            {locale === 'fa'
              ? 'احراز هویت از طریق نشست امضاشده HttpOnly روی سرور کلودفلر انجام می‌شود.'
              : 'Authentication uses a signed HttpOnly newsroom session cookie.'}
          </p>
        </div>

        <form method="post" action="/admin/login?gemini=1" className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#161310] dark:text-[#E7E0D3] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#8F6321] dark:text-[#ECC983]" />
              <span>{locale === 'fa' ? 'نام کاربری تحریریه' : 'Username'}</span>
            </label>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              dir="ltr"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FFFDF8] dark:bg-[#0D111C] border border-[#D9CEBA] dark:border-[#252E42] text-sm text-[#161310] dark:text-[#F5F1E8] focus:border-[#8F6321] dark:focus:border-[#ECC983] outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#161310] dark:text-[#E7E0D3] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#8F6321] dark:text-[#ECC983]" />
              <span>{locale === 'fa' ? 'رمز عبور' : 'Password'}</span>
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              dir="ltr"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FFFDF8] dark:bg-[#0D111C] border border-[#D9CEBA] dark:border-[#252E42] text-sm text-[#161310] dark:text-[#F5F1E8] focus:border-[#8F6321] dark:focus:border-[#ECC983] outline-none"
            />
          </div>

          <button type="submit" className="btn-luxury-ink w-full text-sm">
            <span>{locale === 'fa' ? 'ورود امن به استودیو تحریریه' : 'Sign in to Studio'}</span>
          </button>
        </form>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-[#D9CEBA]/70 dark:border-[#252E42]">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 min-h-[40px] text-[#5B5246] dark:text-[#A3ADBF] hover:text-[#161310] dark:hover:text-[#F5F1E8] cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>{locale === 'fa' ? 'بازگشت به صفحه اصلی' : 'Back to Front Page'}</span>
          </button>
          <a
            href="/admin/login"
            className="min-h-[40px] inline-flex items-center text-[#8F6321] dark:text-[#ECC983] hover:underline"
          >
            {locale === 'fa' ? 'پنل کلاسیک تحریریه ↗' : 'Classic Admin Panel ↗'}
          </a>
        </div>
      </div>
    </section>
  );
}
