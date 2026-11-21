'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const mon=require('../lib/news-monitor')._test;

const fresh=new Date(Date.now()-15*60*1000).toISOString();
const stale=new Date(Date.now()-30*60*60*1000).toISOString();
const valid={
  id:'new-local',status:'pending',sourceId:'k1',
  title:'فرماندار جیرفت از آغاز طرح جدید تامین آب روستاهای منطقه خبر داد',
  lead:'این طرح برای روستاهای جنوب استان کرمان اجرا خواهد شد.',
  body:'در گزارش تازه مسئولان اعلام کردند که عملیات اجرای شبکه تامین آب روستایی با تامین اعتبار جدید در جنوب استان کرمان آغاز شده است و اجرای طرح در مراحل بعدی ادامه می‌یابد.',
  publishedAt:fresh,
};

test('discovery budget cannot be monopolized by first local news sources',()=>{
  assert.equal(mon.perSourceDetailBudget([{type:'html'},{type:'rss'},{type:'telegram'}],24),12);
  assert.equal(mon.perSourceDetailBudget([{type:'html'},{type:'html'},{type:'rss'},{type:'html'},{type:'rss'},{type:'telegram'}],24),4);
  assert.equal(mon.perSourceDetailBudget([{type:'telegram'}],24),24);
});

test('only date-verified, fresh, vetted candidates are eligible for automatic publication',()=>{
  assert.equal(mon.autoPublishableCandidate({...valid},6),true);
  assert.equal(mon.autoPublishableCandidate({...valid,publishedAt:stale},6),false);
  assert.equal(mon.autoPublishableCandidate({...valid,publishedAt:''},6),false);
  assert.equal(mon.autoPublishableCandidate({...valid,publishedAt:'not-a-date'},6),false);
  assert.equal(mon.autoPublishableCandidate({...valid,status:'rejected'},6),false);
  assert.equal(mon.autoPublishableCandidate({...valid,manualReviewRequired:true},6),false);
  assert.equal(mon.autoPublishableCandidate({...valid,title:'آگهی ترحیم مرحوم رضایی',body:'مراسم خاکسپاری فردا برگزار می‌شود و خانواده داغدار از مردم دعوت کردند.'},6),false);
  assert.equal(mon.autoPublishableCandidate({...valid,title:'فروش ویژه محصولات با قیمت استثنایی',lead:'برای خرید و سفارش با شماره تماس بگیرید.',body:'تخفیف ویژه و ارسال رایگان برای خریداران به همراه شماره تماس برای ثبت سفارش.'},6),false);
});

test('actual automatic publishing selection excludes stale backlog and undated items',()=>{
  const m={
    settings:{maxPerHour:2,maxAgeHours:6},
    mixCursor:0,
    sources:[{id:'k1',type:'html',scope:'kerman',topic:'local'}],
    queue:[
      {...valid,id:'older',publishedAt:stale},
      {...valid,id:'undated',publishedAt:''},
      {...valid,id:'new-local',publishedAt:fresh},
    ],
  };
  assert.deepEqual(mon.selectFreshPublishIds({articles:[]},m,2),['new-local']);
});

test('collector no longer compares publication date to previous scan timestamp',()=>{
  const source=fs.readFileSync('lib/news-monitor.js','utf8');
  assert.equal(source.includes('publishedMs<=sourceWatermarkMs'),false);
  assert.equal(source.includes('source.latestSeenPublishedAt=source.lastCheckedAt'),false);
  assert.ok(source.includes('sourceDetailFetches>=fairDetailBudget'));
});
