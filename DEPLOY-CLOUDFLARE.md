# نبض ساردو — نسخهٔ ۳ (Next.js) — راهنمای اجرا و دیپلوی روی Cloudflare

این شاخه (`v3-nextjs-cloudflare`) بازسازی کامل نبض ساردو با **Next.js 16 + TypeScript + Tailwind 4 + Prisma** است:
طراحی «نبضِ زنده» (سرمه‌ای + طلایی)، اوقات شرعی و آب‌وهوای زندهٔ ساردوئیه، کارت‌های خبری با تصاویر هوش مصنوعی.

> **استقرار زنده:** این نسخه به‌صورت خودکار روی **v3.nabzesardo.ir** دیپلوی می‌شود (GitHub Actions + OpenNext + Wrangler).
> سایت اصلی **nabzesardo.ir** (ورکر فعلی از شاخهٔ `cloudflare-migration`) دست‌نخورده می‌ماند تا مهاجرت نهایی تأیید شود.

---

## معماری داده (مهم)

| حالت | کاربرد | منبع داده |
| --- | --- | --- |
| `DATA_MODE=d1` (پیش‌فرض روی Cloudflare) | سایت زندهٔ v3 | **D1 سایت اصلی** (`nabzesardo-cloudflare-db`) — فقط خواندن از `app_state` کلید `db` |
| پیش‌فرض (بدون DATA_MODE) | توسعهٔ محلی | Prisma + `db/custom.db` (SQLite) |
| `DATA_MODE=d1 D1_FIXTURE=db/prod-sim.json` | تست محلی مسیر d1 | شبیه‌ساز JSON با همان ساختار production |

- در حالت d1، **همهٔ ۲۳۳+ خبر واقعی** سایت اصلی با آخرین تغییرات (شامل خبرهای جدید مانیتور) نمایش داده می‌شود.
- تصاویر: عکس واقعی آپلودی (از `nabzesardo.ir/uploads/...`) > کارت هوش مصنوعی (نقشهٔ اسلاگ در `src/lib/nabz-d1.ts`) > کاور برند دسته.
- پنل مدیریت، فرم خبر مردمی و تماس در حالت d1 به معادل خود در سایت اصلی هدایت می‌شوند (**تک‌منبعی داده**؛ توزیع تلگرام/روبیکا و بکاپ‌ها دست‌نخورده).
- شمارش بازدید فقط در سایت اصلی انجام می‌شود.

## ۱) اجرای محلی

```bash
npm install
npm run db:generate
npm run dev        # حالت sqlite (دیتای seed محلی)
npm run dev:d1     # حالت d1 با شبیه‌ساز production
```

## ۲) دیپلوی (خودکار)

هر push به شاخهٔ `v3-nextjs-cloudflare`:
1. `npm install` + `prisma generate`
2. `opennextjs-cloudflare build`
3. `wrangler deploy` → ورکر `nabzesardo-v3` روی **v3.nabzesardo.ir**
4. اسموک‌تست صفحه اصلی/آرشیو/خبر

دستی: `npm run deploy:worker` (نیازمند توکن Cloudflare).

## ۳) مهاجرت نهایی (تعویض سایت اصلی)

برای اینکه nabzesardo.ir خودِِ آن از این نسخه سرو شود:
1. در `wrangler.jsonc` روت `nabzesardo.ir/*` را به این ورکر اضافه کنید و روت‌های `/admin*`, `/uploads/*`, `/api/*`, `/view`, `/sitemap.xml`, `/rss` را به ورکر فعلی بدهید (یا کل آن را جایگزین کنید).
2. پیش از تعویض، این امکانات فعلی باید به این نسخه منتقل یا حذفشان تأیید شود: توزیع خودکار تلگرام/روبیکا، استوری/ریلز اشتراک‌گذاری، بکاپ رمزنگاری‌شدهٔ روزانه، مسیرهای SEO خزنده‌ها.
3. بعد از تعویض، health سایت اصلی را بررسی و rollback با `wrangler rollback` آماده نگه دارید.
