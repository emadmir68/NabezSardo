const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const home=require('../lib/view-home-2026');
function fixture(count=15){
  return {
    categories:[{id:'social',name:'اجتماعی'},{id:'culture',name:'فرهنگی'},{id:'short-news',name:'خبر کوتاه'}],
    settings:{},
    articles:Array.from({length:count},(_,i)=>({
      id:'news-'+i,slug:'story-'+i,title:'خبر محلی شماره '+i,
      lead:'گزارش محلی از ساردوئیه و جیرفت',
      status:'published',categoryId:i%6===0?'short-news':'social',
      createdAt:new Date(Date.UTC(2026,9,20,0,i)).toISOString(),
      image:'/assets/news-cover.svg',views:i
    }))
  };
}
test('premium homepage renders both with data and without articles',()=>{
  const html=home(fixture(15));
  assert.match(html,/class="ns26-site"/);
  assert.match(html,/cloud-dancer-2026\.css/);
  assert.match(html,/cloud-dancer-2026\.js/);
  assert.match(html,/href="\/send-news"/);
  assert.match(html,/href="\/all-news"/);
  assert.match(html,/href="\/news\/story-1"/);
  assert.match(html,/aria-label="فهرست اصلی"/);
  assert.match(home(fixture(0)),/در انتظار انتشار خبرهای تازه/);
});
test('new home links to original news, categories, and community submission',()=>{
  const html=home(fixture(15));
  assert.match(html,/href="\/local\/jiroft"/);
  assert.match(html,/href="\/category\/social"/);
  assert.match(html,/href="\/news\/story-3"/);
  assert.match(html,/action="\/search"/);
});
test('design assets are present and mobile/reduced-motion rules exist',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../public/cloud-dancer-2026.css'),'utf8');
  const js=fs.readFileSync(path.join(__dirname,'../public/cloud-dancer-2026.js'),'utf8');
  assert.match(css,/max-width:620px/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(js,/aria-expanded/);
});

test('long Persian titles stay complete and use semantic headline hierarchy',()=>{
  const db=fixture(15);
  const longTitle='نشست بررسی مسائل روستاهای ساردوئیه و برنامه‌های اجرایی حوزه آموزش، کشاورزی و زیرساخت‌های ارتباطی در جنوب کرمان';
  db.articles[1].title=longTitle;
  const html=home(db);
  assert.ok(html.includes(longTitle),'Full headline must be retained');
  assert.match(html,/<h2 class="ns26-story-title" dir="auto">/);
  assert.match(html,/<h3 class="ns26-story-title" dir="auto">/);
  assert.match(html,/aria-label="مطالعه خبر:/);
  const css=fs.readFileSync(path.join(__dirname,'../public/cloud-dancer-2026.css'),'utf8');
  assert.match(css,/overflow-wrap:break-word/);
  assert.match(css,/-webkit-line-clamp:unset/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/:focus-visible/);
});
test('full article pages get isolated reading typography and accessible actions',()=>{
  const {article}=require('../lib/view-public');
  const db=fixture(6);
  const html=article(db,db.articles[1]);
  assert.match(html,/cloud-dancer-article-reading\.css/);
  assert.match(html,/class="body rich-content article-body"/);
  assert.match(html,/data-article-share/);
  const css=fs.readFileSync(path.join(__dirname,'../public/cloud-dancer-article-reading.css'),'utf8');
  assert.match(css,/\.article-premium \.article-body/);
  assert.match(css,/\.article-premium \.article-actions/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/max-width:650px/);
});


test('Cloudflare homepage retains the protected category routes and compact news links',()=>{
 const db=fixture(15);
 db.categories.unshift({id:'incidents',name:'حوادث'},{id:'weather',name:'آب‌وهوا'});
 const html=home(db);
 assert.match(html,/href="\/category\/incidents"/);
 assert.match(html,/href="\/category\/weather"/);
 assert.match(html,/<article\b[^>]*data-story-title-fa="[^"]+"[^>]*data-story-url="\/news\/[A-Za-z0-9_-]+"/);
 assert.doesNotMatch(html,/src="\/assets\/placeholder\.svg"/);
});
