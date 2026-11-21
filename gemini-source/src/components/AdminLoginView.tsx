import type { Locale } from '../types/news';
interface AdminLoginViewProps {
  locale: Locale;
  onAuthenticated: (token: string) => void;
  onCancel: () => void;
}
// Existing server owns the credentials and issues an HttpOnly signed cookie.
export function AdminLoginView({ locale, onCancel }: AdminLoginViewProps) {
  return <section className="max-w-xl mx-auto px-5 py-24 text-center space-y-6" dir="rtl">
    <h1 className="font-editorial-display text-3xl font-bold">ورود امن به تحریریه نبض ساردو</h1>
    <p className="text-base leading-8">برای مدیریت اخبار از صفحه ورود اصلی سایت استفاده کنید. رمز شما در فرم طراحی جدید ذخیره نمی‌شود.</p>
    <a className="btn-luxury-ink inline-flex justify-center" href="/admin/login?gemini=1">{locale === 'fa' ? 'ورود به مدیریت اصلی' : 'Sign in to newsroom'}</a>
    <div><button className="underline text-sm" type="button" onClick={onCancel}>بازگشت به سایت</button></div>
  </section>;
}
