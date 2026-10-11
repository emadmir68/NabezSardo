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

const telegramHtml='<div class="tgme_widget_message_wrap"><div class="tgme_widget_message text_not_supported_wrap js-widget_message" data-post="konarsandal/150001"><a class="tgme_widget_message_photo_wrap" style="background-image:url(\'https://cdn.example.com/news.jpg\')"></a><div class="tgme_widget_message_text js-message_text" dir="auto">⭕️فرماندار جیرفت از اجرای طرح جدید آب‌رسانی خبر داد<br>این طرح برای روستاهای جنوب کرمان اجرا می‌شود و عملیات آن از هفته آینده آغاز خواهد شد.<br>@konarsandal</div><time datetime="2026-10-11T11:30:00+00:00"></time></div></div><div class="tgme_widget_message_wrap"><div class="tgme_widget_message text_not_supported_wrap js-widget_message" data-post="konarsandal/150002"><div class="tgme_widget_message_text js-message_text" dir="auto">⭕️ افتتاحیه فروشگاه نمونه با ۲۰ درصد تخفیف<br>آدرس: جیرفت خیابان نمونه<br>تماس: 09131234567<br>@konarsandal</div><time datetime="2026-10-11T11:31:00+00:00"></time></div></div>';
const telegramRows=monitor.parseTelegramPage(telegramHtml,'https://t.me/s/konarsandal');
assert.strictEqual(telegramRows.length,1);
assert.strictEqual(telegramRows[0].url,'https://t.me/konarsandal/150001');
assert.ok(telegramRows[0].title.includes('فرماندار جیرفت'));
assert.ok(telegramRows[0].description.includes('جنوب کرمان'));
assert.ok(!telegramRows[0].description.includes('@konarsandal'));
assert.strictEqual(telegramRows[0].imageUrl,'https://cdn.example.com/news.jpg');
assert.strictEqual(telegramRows[0].publishedAt,'2026-10-11T11:30:00+00:00');
assert.strictEqual(monitor.telegramLooksLikeAd('فروشگاه نمونه آدرس: جیرفت تماس: 09131234567'),true);
assert.strictEqual(monitor.telegramLooksLikeAd('فرماندار جیرفت از افتتاح پروژه آب‌رسانی خبر داد'),false);

const article='<!doctype html><html><head><meta property="og:title" content="بارش در جیرفت"><meta property="og:image" content="/img/a.jpg"><meta property="article:published_time" content="2026-10-09T08:00:00+03:30"></head><body><article><h1>بارش در جیرفت</h1><p>هواشناسی از آغاز بارش در شهرستان جیرفت خبر داد و از شهروندان خواست نکات ایمنی را رعایت کنند.</p><p>این سامانه بارشی تا پایان روز در جنوب استان کرمان فعال خواهد بود و احتمال آبگرفتگی وجود دارد.</p></article></body></html>';
const parsed=monitor.extractArticle(article,'https://example.com/news/123',{});
assert.strictEqual(parsed.title,'بارش در جیرفت');
assert.ok(parsed.body.includes('هواشناسی'));
assert.strictEqual(parsed.imageUrl,'https://example.com/img/a.jpg');
assert.strictEqual(monitor.guessCategory(parsed),'weather');
assert.strictEqual(monitor.guessLocation(parsed),'جیرفت');

assert.ok(monitor.titleSimilarity('فرماندار جیرفت از اجرای طرح جدید خبر داد','اجرای طرح جدید در جیرفت به گفته فرماندار')>0.5);
assert.strictEqual(monitor.fingerprint('الف','متن'),monitor.fingerprint('الف','متن'));

const fariabA={
  title:'عامل شهادت رئیس پلیس پیشگیری فاریاب به هلاکت رسید',
  lead:'کرمان-فرمانده انتظامی استان کرمان گفت: فردی که با اقدام تروریستی، در عصر روز ۱۶ مهرماه، رئیس پلیس پیشگیری فاریاب را به شهادت رسانده بود، در پی اقدامات عملیاتی پلیس استان به هلاکت رسید.',
  body:'کرمان-فرمانده انتظامی استان کرمان گفت: فردی که با اقدام تروریستی، در عصر روز ۱۶ مهرماه، رئیس پلیس پیشگیری فاریاب را به شهادت رسانده بود، در پی اقدامات عملیاتی پلیس استان به هلاکت رسید. سردار جلیل موقوفه‌ئی گفت تلاش‌های تخصصی و عملیاتی پلیس برای شناسایی عاملان این جنایت دنبال شد.',
  location:'فاریاب',categoryId:'incidents',publishedAt:'2026-10-10T19:04:00Z'
};
const fariabB={
  title:'عامل ترور مدافع امنیت در فاریاب به هلاکت رسید',
  lead:'فرمانده انتظامی استان کرمان گفت: فردی که با اقدام تروریستی ۱۶ مهرماه، رئیس پلیس پیشگیری فاریاب را به شهادت رسانده بود، در پی اقدامات عملیاتی پلیس استان به هلاکت رسید.',
  body:'فرمانده انتظامی استان کرمان گفت: فردی که با اقدام تروریستی ۱۶ مهرماه، رئیس پلیس پیشگیری فاریاب را به شهادت رسانده بود، در پی اقدامات عملیاتی پلیس استان به هلاکت رسید.',
  location:'فاریاب',categoryId:'incidents',publishedAt:'2026-10-10T19:04:00Z'
};
assert.ok(monitor.textContainmentSimilarity(fariabA,fariabB)>=0.94);
assert.strictEqual(monitor.sameEventDuplicate(fariabA,fariabB),true);

const distinctFariab={
  title:'پیکر شهید جمشیدی در بافت تشییع و تدفین شد',
  lead:'مراسم تشییع پیکر شهید مهدی جمشیدی در شهرستان بافت برگزار شد.',
  body:'مراسم تشییع پیکر شهید مهدی جمشیدی با حضور مردم و مسئولان برگزار شد.',
  location:'بافت',categoryId:'incidents',publishedAt:'2026-10-11T09:00:00Z'
};
assert.strictEqual(monitor.sameEventDuplicate(fariabA,distinctFariab),false);

assert.strictEqual(monitor.freshness(new Date(Date.now()-2*60*60*1000).toISOString(),48),true);
assert.strictEqual(monitor.freshness(new Date(Date.now()-72*60*60*1000).toISOString(),48),false);
assert.strictEqual(monitor.freshness('',48),null);
assert.strictEqual(monitor.freshness(new Date(Date.now()-2*60*60*1000).toISOString(),6),true);
assert.strictEqual(monitor.freshness(new Date(Date.now()-8*60*60*1000).toISOString(),6),false);



assert.strictEqual(monitor.hasKeyword('استان کرمان امروز بارانی است','کرمان'),true);
assert.strictEqual(monitor.hasKeyword('کرمانشاه میزبان مسابقات شد','کرمان'),false);
assert.strictEqual(monitor.hasKeyword('خبر تازه از شهر بابک','شهر بابک'),true);

const fakeMonitor={settings:{keywords:'کرمان,جیرفت,رفسنجان'}};
assert.strictEqual(monitor.relevant(fakeMonitor,{scope:'kerman'},{title:'قم میزبان رقابت کشوری',lead:'قم- این مسابقات با حضور ورزشکاران برگزار شد',body:'نام کرمان در متن طولانی آمده است'}),false);
assert.strictEqual(monitor.relevant(fakeMonitor,{scope:'kerman'},{title:'طرح توسعه پایدار کرمان',lead:'کرمان- استاندار کرمان خبر داد',body:''}),true);

assert.strictEqual(monitor.relevant(fakeMonitor,{scope:'country'},{title:'خبر مهم اقتصادی کشور',lead:'',body:''}),true);
assert.strictEqual(monitor.relevant(fakeMonitor,{scope:'world'},{title:'تحولات مهم اروپا',lead:'',body:''}),true);
assert.deepStrictEqual(monitor.desiredMix(4),{local:2,country:1,world:1});

const mixMonitor={
  settings:{maxPerHour:4,keywords:'کرمان'},
  mixCursor:0,
  sources:[
    {id:'k1',scope:'kerman',topic:'local'},
    {id:'p1',scope:'country',topic:'politics'},
    {id:'s1',scope:'country',topic:'social'},
    {id:'t1',scope:'country',topic:'technology'},
    {id:'w1',scope:'world',topic:'world'}
  ],
  queue:[
    {id:'l1',status:'pending',sourceId:'k1',publishedAt:'2026-10-09T10:00:00Z'},
    {id:'l2',status:'pending',sourceId:'k1',publishedAt:'2026-10-09T09:59:00Z'},
    {id:'c1',status:'pending',sourceId:'p1',publishedAt:'2026-10-09T09:58:00Z'},
    {id:'c2',status:'pending',sourceId:'s1',publishedAt:'2026-10-09T09:57:00Z'},
    {id:'w1q',status:'pending',sourceId:'w1',publishedAt:'2026-10-09T09:56:00Z'}
  ]
};
const reviewGateMonitor={
  settings:{maxPerHour:4},
  mixCursor:0,
  sources:[{id:'tg',scope:'jiroft',topic:'local'},{id:'k1',scope:'kerman',topic:'local'}],
  queue:[
    {id:'telegram-review',status:'pending',sourceId:'tg',manualReviewRequired:true,publishedAt:'2026-10-11T10:00:00Z'},
    {id:'regular-local',status:'pending',sourceId:'k1',publishedAt:'2026-10-11T09:59:00Z'}
  ]
};
assert.deepStrictEqual(monitor.selectPublishIds({articles:[]},reviewGateMonitor,1),['regular-local']);

const approvedTelegramMonitor={
  settings:{maxPerHour:4},
  mixCursor:0,
  sources:[{id:'tg',scope:'jiroft',topic:'local'},{id:'k1',scope:'kerman',topic:'local'}],
  queue:[
    {id:'telegram-approved',status:'pending',sourceId:'tg',manualReviewRequired:false,telegramBatchApproved:true,publishedAt:'2026-10-11T09:50:00Z'},
    {id:'regular-newer',status:'pending',sourceId:'k1',publishedAt:'2026-10-11T10:00:00Z'}
  ]
};
assert.deepStrictEqual(monitor.selectPublishIds({articles:[]},approvedTelegramMonitor,1),['telegram-approved']);

const mixIds=monitor.selectPublishIds({articles:[]},mixMonitor,4);
assert.strictEqual(mixIds.length,4);
assert.ok(mixIds.includes('l1')&&mixIds.includes('l2'));
assert.ok(mixIds.includes('c1'));
assert.ok(mixIds.includes('w1q'));

const sourceRotationMonitor={
  sourceCycleCursor:0,
  sources:[
    {id:'k1',scope:'kerman',topic:'local',enabled:true},
    {id:'n1',scope:'national',topic:'local',enabled:true},
    {id:'p1',scope:'country',topic:'politics',enabled:true},
    {id:'s1',scope:'country',topic:'social',enabled:true},
    {id:'t1',scope:'country',topic:'technology',enabled:true},
    {id:'w1',scope:'world',topic:'world',enabled:true}
  ]
};
const firstSources=monitor.sourcesForRun(sourceRotationMonitor).map(x=>x.id);
assert.deepStrictEqual(firstSources,['k1','n1','p1','w1']);
const secondSources=monitor.sourcesForRun(sourceRotationMonitor).map(x=>x.id);
assert.deepStrictEqual(secondSources,['k1','n1','s1','w1']);
const thirdSources=monitor.sourcesForRun(sourceRotationMonitor).map(x=>x.id);
assert.deepStrictEqual(thirdSources,['k1','n1','t1','w1']);

assert.strictEqual(
  monitor.guessCategory({
    title:'طالبی: دانش‌آموزان برتر علمی و فرهنگی کرمان سالانه تجلیل شوند',
    lead:'استاندار کرمان بر حمایت از استعدادهای برتر تاکید کرد',
    body:'در ادامه درباره محصولات کشاورزی و باغ‌ها نیز سخن گفته شد'
  }),
  'culture'
);
assert.strictEqual(
  monitor.guessCategory({
    title:'برداشت خرما در جنوب کرمان آغاز شد',
    lead:'کشاورزان از افزایش محصول خبر دادند',
    body:''
  }),
  'agriculture'
);

assert.strictEqual(
  monitor.guessCategory({
    title:'بیش از ۴۰۰ کیلومتر راه روستایی استان کرمان در کمتر از ۶ ماه آسفالت شد',
    lead:'راهداری از توسعه زیرساخت جاده‌ای خبر داد',
    body:''
  }),
  'city-village'
);

console.log('news-monitor tests: ok');
