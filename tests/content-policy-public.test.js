'use strict';
const assert=require('node:assert/strict');
const store=require('../lib/store');
const policy=require('../lib/content-policy');

assert.equal(policy.blockedMonitoredContentReason({
  title:'اطلاعیه مراسم تشییع پیکر مرحوم علی رضایی',
  body:'مراسم فردا برگزار می‌شود'
}),'obituary');
assert.equal(policy.blockedMonitoredContentReason({
  title:'فروش انواع لوازم خانگی با قیمت ویژه',
  body:'برای خرید با شماره 09123456789 تماس بگیرید'
}),'advertisement');
assert.equal(policy.blockedMonitoredContentReason({
  title:'درگذشت راننده در سانحه جاده‌ای',
  body:'پلیس علت حادثه را اعلام کرد'
}),'');

const rows=store.published({articles:[
  {id:'obituary',status:'published',imported:true,title:'اطلاعیه مراسم تشییع پیکر مرحوم علی رضایی',body:'مراسم فردا برگزار می‌شود',publishedAt:'2026-11-14T10:00:00Z'},
  {id:'advert',status:'published',imported:true,title:'فروش انواع لوازم خانگی با قیمت ویژه',body:'برای خرید با شماره 09123456789 تماس بگیرید',publishedAt:'2026-11-14T10:01:00Z'},
  {id:'accident',status:'published',imported:true,title:'درگذشت راننده در سانحه جاده‌ای',body:'پلیس علت حادثه را اعلام کرد',publishedAt:'2026-11-14T10:02:00Z'},
  {id:'manual',status:'published',imported:false,title:'اطلاعیه مراسم تشییع پیکر مرحوم در شهرستان',body:'انتشار دستی و تأییدشده تحریریه',publishedAt:'2026-11-14T10:03:00Z'}
]});
assert.deepEqual(rows.map(x=>x.id),['manual','accident']);
console.log('Cloudflare public content policy tests passed');
