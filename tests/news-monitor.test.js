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

assert.strictEqual(monitor.freshness(new Date(Date.now()-2*60*60*1000).toISOString(),48),true);
assert.strictEqual(monitor.freshness(new Date(Date.now()-72*60*60*1000).toISOString(),48),false);
assert.strictEqual(monitor.freshness('',48),null);


console.log('news-monitor tests: ok');
