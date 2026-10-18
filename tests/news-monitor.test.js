const assert=require('assert');
const monitor=require('../lib/news-monitor')._test;

const clean=monitor.canonicalUrl('https://example.com/news/123/?utm_source=x&ref=y#top');
assert.strictEqual(clean,'https://example.com/news/123');

const feed='<?xml version="1.0"?><rss><channel><item><title><![CDATA[خبر مهم جیرفت]]></title><link>https://example.com/news/123</link><description><![CDATA[متن کوتاه خبر]]></description></item></channel></rss>';
const feedRows=monitor.parseFeed(feed,'https://example.com/feed');
assert.strictEqual(feedRows.length,1);
assert.strictEqual(feedRows[0].title,'خبر مهم جیرفت');

const listing='<a href="/news/123456/jiroft">فرماندار جیرفت از اجرای طرح جدید خبر داد</a><a href="/service/kerman">استان کرمان</a>';
const rows=monitor.parseListHtml(listing,'https://example.com/');
assert.strictEqual(rows.length,1);
assert.ok(rows[0].url.includes('/news/123456/jiroft'));

const article='<!doctype html><html><head><meta property="og:title" content="بارش در جیرفت"><meta property="og:image" content="/img/a.jpg"><meta property="article:published_time" content="2026-10-09T08:00:00+03:30"></head><body><article><h1>بارش در جیرفت</h1><p>هواشناسی از آغاز بارش در شهرستان جیرفت خبر داد و از شهروندان خواست نکات ایمنی را رعایت کنند.</p><p>این سامانه بارشی تا پایان روز در جنوب استان کرمان فعال خواهد بود و احتمال آبگرفتگی وجود دارد.</p></article></body></html>';
const parsed=monitor.extractArticle(article,'https://example.com/news/123',{});
assert.strictEqual(parsed.title,'بارش در جیرفت');
assert.ok(parsed.body.includes('هواشناسی'));
assert.strictEqual(parsed.imageUrl,'https://example.com/img/a.jpg');
assert.strictEqual(monitor.guessCategory(parsed),'weather');
assert.strictEqual(monitor.guessLocation(parsed),'جیرفت');

assert.ok(monitor.titleSimilarity('فرماندار جیرفت از اجرای طرح جدید خبر داد','اجرای طرح جدید در جیرفت به گفته فرماندار')>0.5);
assert.strictEqual(monitor.fingerprint('الف','متن'),monitor.fingerprint('الف','متن'));

assert.strictEqual(monitor.blockedMonitoredContentReason({title:'پیام تسلیت در پی درگذشت یکی از شهروندان',body:'با خانواده داغدار ابراز همدردی شد'}),'obituary');
assert.strictEqual(monitor.blockedMonitoredContentReason({title:'آگهی فروش ویژه خدمات اینترنتی',body:'برای خرید و ثبت سفارش با شماره تماس درج شده تماس بگیرید'}),'advertisement');
assert.strictEqual(monitor.blockedMonitoredContentReason({title:'افزایش فروش محصولات کشاورزی جنوب کرمان',body:'گزارش رسمی از رشد فروش و صادرات محصولات منطقه منتشر شد'}),'');
assert.strictEqual(monitor.blockedMonitoredContentReason({title:'درگذشت راننده در سانحه جاده‌ای',body:'پلیس علت حادثه را اعلام کرد'}),'');
assert.strictEqual(monitor.blockedMonitoredContentReason({title:'سلام این وضعیت پاسداران ۳ در مرکز شهر روبروی دفتر امام جمعه هست لطفا بررسی کنید',body:'شاید نیروهای شهرداری بی‌خبرند؛ لطفاً رسیدگی شود'}),'non-news-message');
assert.strictEqual(monitor.blockedMonitoredContentReason({title:'بسم الله الرحمن الرحیم',body:'اللهم عجل لولیک الفرج'}),'non-news-message');
assert.strictEqual(monitor.blockedMonitoredContentReason({title:'لطفاً این موضوع را پیگیری و به مسئولان اعلام کنید',body:'این متن یک پیام شهروندی است'}),'non-news-message');
assert.strictEqual(monitor.blockedMonitoredContentReason({title:'پیام مردمی: لطفاً وضعیت این خیابان بررسی شود',body:'متن ارسالی شهروند'}),'non-news-message');
assert.strictEqual(monitor.blockedMonitoredContentReason({title:'سلام فرمانده در جیرفت اجرا شد',body:'این برنامه فرهنگی با حضور دانش‌آموزان برگزار شد'}),'');
assert.strictEqual(monitor.blockedMonitoredContentReason({title:'واکاوی بایسته‌های مشارکت نسل نو در معادلات پیشرفت جنوب کرمان',body:'یادداشتی تحلیلی'}),'opinion-or-non-news');
assert.strictEqual(monitor.blockedMonitoredContentReason({title:'به نام باور بی منت',body:'متن شخصی'}),'opinion-or-non-news');
const relSettings={settings:{keywords:'ساردوئیه,جیرفت,جنوب کرمان,عنبرآباد,کهنوج,فاریاب,رودبار جنوب,منوجان,قلعه گنج,جازموریان,کرمان'}};
assert.strictEqual(monitor.relevant(relSettings,{scope:'kerman'},{title:'ویزیت پنج‌دقیقه‌ای، در این زمان واقعاً چقدر می‌توان بیمار را شناخت؟',lead:'گزارش سلامت',body:'گزارش عمومی پزشکی'}),false);
assert.strictEqual(monitor.relevant(relSettings,{scope:'kerman'},{title:'افتتاح طرح جدید در کرمان',lead:'استاندار کرمان خبر داد',body:'متن خبر'}),true);
assert.strictEqual(monitor.relevant(relSettings,{scope:'jiroft'},{title:'افتتاح طرح جدید',lead:'جزئیات اعلام شد',body:'این طرح در شهرستان جیرفت به بهره‌برداری رسید'}),true);

const store=require('../lib/store');
const publicRows=store.published({articles:[
  {id:'bad1',status:'published',imported:true,title:'بسم الله الرحمن الرحیم',body:'متن غیرخبری',publishedAt:'2026-10-13T06:00:00Z'},
  {id:'bad2',status:'published',imported:true,title:'سلام این وضعیت پاسداران ۳ در مرکز شهر هست لطفاً بررسی کنید',body:'پیام خام شهروندی',publishedAt:'2026-10-13T06:01:00Z'},
  {id:'good1',status:'published',imported:true,title:'سلام فرمانده در جیرفت اجرا شد',body:'برنامه فرهنگی برگزار شد',publishedAt:'2026-10-13T06:02:00Z'},
  {id:'manual1',status:'published',imported:false,title:'بسم الله الرحمن الرحیم',body:'انتشار دستی تحریریه',publishedAt:'2026-10-13T06:03:00Z'}
]});
assert.deepStrictEqual(publicRows.map(x=>x.id),['manual1','good1']);

console.log('news-monitor tests: ok');
