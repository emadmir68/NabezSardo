'use strict';
const assert=require('node:assert/strict');

process.env.PREVIEW_READONLY='1';
process.env.PUBLIC_BASE_URL='https://nabzesardo-rebirth-preview.example.workers.dev';

const views=require('../lib/views-v2');
const now='2026-11-14T08:00:00.000Z';
const sample={
  settings:{siteName:'نبض ساردو',breakingText:'گزارش‌های تازه جنوب کرمان',liveDeskEnabled:true,adEnabled:false},
  categories:[
    {id:'agriculture',name:'کشاورزی'},
    {id:'social',name:'اجتماعی'},
    {id:'short-news',name:'خبر کوتاه'}
  ],
  articles:[
    {id:'one',slug:'agriculture-future',title:'آینده کشاورزی جنوب کرمان',lead:'فرصت‌ها و چالش‌های کشاورزی منطقه',body:'گزارش نمونه',bodyHtml:'<p>گزارش نمونه</p>',categoryId:'agriculture',status:'published',publishedAt:now,createdAt:now,author:'تحریریه نبض ساردو',location:'جیرفت',views:25,image:'/news-cover-agriculture.svg',featured:true},
    {id:'two',slug:'water-resources',title:'مدیریت منابع آب در جنوب کرمان',lead:'ضرورت مدیریت پایدار منابع آب',body:'گزارش آب',bodyHtml:'<p>گزارش آب</p>',categoryId:'social',status:'published',publishedAt:now,createdAt:now,location:'جنوب کرمان',views:10,image:'/news-cover-social.svg'}
  ],
  contacts:[],
  citizens:[],
  followups:[]
};

const home=views.home(sample);
assert.match(home,/rb-hero-story/);
assert.match(home,/noindex,nofollow,noarchive/);
assert.match(home,/nabzesardo-rebirth-preview\.example\.workers\.dev/);
assert.doesNotMatch(home,/\/assets\/site\.css|spatial-rail/);

const archive=views.archive(sample,{q:'کشاورزی'});
assert.match(archive,/آینده کشاورزی جنوب کرمان/);
assert.doesNotMatch(archive,/مدیریت منابع آب/);

assert.match(views.article(sample,sample.articles[0]),/rb-article-body/);
assert.match(views.admin(sample,[],new URLSearchParams(),{}, {}, {settings:{},sources:[],queue:[],counts:{}}),/rb-admin-layout/);
assert.match(views.editor(sample,{title:'خبر آزمایشی',categoryId:'agriculture',bodyHtml:'<p>متن</p>',status:'draft'}),/data-rebirth-editor/);

// Existing Cloudflare Worker routes must keep their legacy page handlers.
for(const name of ['editorialPolicy','followup','followupEditor','shareKit']){
  assert.equal(typeof views[name],'function',name+' remains connected');
}

console.log('rebirth Cloudflare compatibility tests passed');
