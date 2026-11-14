# نبض ساردو — Nabez Sardo

نسخه اصلی سایت و تحریریه روی **Cloudflare Workers** اجرا می‌شود.

## معماری فعال

- **Cloudflare Workers:** اجرای سایت، مسیرهای عمومی و پنل تحریریه
- **Cloudflare D1:** داده‌های سایت و آمار
- **Arvan Object Storage:** تصاویر و فایل‌های رسانه‌ای
- **Workers Static Assets:** فایل‌های CSS، JavaScript و رسانه‌های ثابت
- **GitHub Actions:** آزمون و انتشار Worker از شاخه `cloudflare-migration`

هیچ سرویس Railway در مسیر اجرای Production استفاده نمی‌شود.

## توسعه محلی

```bash
npm install
npm test
npm run cf:dev
```

## پیش‌نمایش بازطراحی

بازطراحی Experimental Editorial از طریق Cloudflare Worker Previews بررسی می‌شود. پیکربندی Preview در `wrangler.preview.jsonc` قرار دارد و به D1 جداگانه `nabzesardo-editorial-preview` متصل می‌شود.

- آدرس اصلی و routeهای Production تغییر نمی‌کنند.
- داده پیش‌نمایش از خبرهای منتشرشده ساخته می‌شود؛ پیش‌نویس‌ها، پیام‌های تماس و گزارش‌های خصوصی شهروندان کپی نمی‌شوند.
- پنل نمایشی از مسیر `/__preview/admin` و ویرایشگر از `/__preview/admin/editor` قابل مشاهده‌اند.
- تمام درخواست‌های تغییردهنده در Preview مسدود هستند.
- انتشار خودکار، صف و زمان‌بندی در Preview فعال نیست.
- فایل‌های رسانه‌ای فقط از دامنه Production خوانده می‌شوند؛ Preview اجازه نوشتن در فضای رسانه‌ای اصلی را ندارد.

## مسیر انتشار Production

فقط تغییرات ادغام‌شده در شاخه `cloudflare-migration` به‌وسیله workflow انتشار Cloudflare به Production می‌روند. شاخه‌های طراحی و Preview به دامنه اصلی متصل نیستند.

## امنیت

- متغیرهای حساس در تنظیمات Cloudflare نگهداری می‌شوند و در مخزن قرار نمی‌گیرند.
- مسیرهای مهاجرت و همگام‌سازی با توکن داخلی محافظت می‌شوند.
- فیلتر محتوای تبلیغاتی، اطلاعیه‌های تدفین و محتوای غیرخبری در رصد و نمایش عمومی فعال است.
