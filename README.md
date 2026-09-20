# Nabez Sardo — نبض ساردو

نسخه مستقل Production، بدون وابستگی به Webflow.

## اجرا
```bash
npm install
npm start
```

سایت: `http://localhost:3000`
پنل مدیریت: `http://localhost:3000/admin`

## متغیرهای محیطی
- `PORT=3000`
- `ADMIN_USER`
- `ADMIN_PASS`
- `SESSION_SECRET`
- `DATA_DIR=/data`
- `UPLOAD_DIR=/data/uploads`
- `NODE_ENV=production`

## Railway
یک Volume روی `/data` وصل کنید و `DATA_DIR=/data` و `UPLOAD_DIR=/data/uploads` را تنظیم کنید.

## امکانات
- طراحی RTL سه‌بعدی و ریسپانسیو
- پنل مدیریت خبر
- پیش‌نویس/انتشار
- دسته‌بندی و جستجو
- آپلود تصویر یا URL تصویر
- فرم تماس
- فرم خبر مردمی با آپلود تصویر
- ذخیره مستقل JSON با write اتمیک
- Health endpoint: `/health`

## امنیت
در Production حتماً `ADMIN_USER`, `ADMIN_PASS`, `SESSION_SECRET` را مقداردهی کنید.
