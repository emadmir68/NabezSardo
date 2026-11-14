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
test('premium glass homepage renders both with data and without articles',()=>{
  const html=home(fixture(15));
  assert.match(html,/class="public-shell pr-body"/);
  assert.match(html,/premium\.css/);
  assert.match(html,/premium\.js/);
  assert.match(html,/href="\/send-news"/);
  assert.match(html,/href="\/all-news"/);
  assert.match(html,/href="\/news\/story-13"/);
  assert.match(html,/aria-label="دسته‌های خبری"/);
  assert.match(home(fixture(0)),/در انتظار انتشار خبرهای تازه/);
});
test('new home links to original news, categories, cities and community submission',()=>{
  const html=home(fixture(15));
  assert.match(html,/href="\/local\/jiroft"/);
  assert.match(html,/href="\/category\/social"/);
  assert.match(html,/href="\/search"/);
  assert.match(html,/<a class="pr-card[^>]*href="\/news\/[^"]+"/);
});
test('premium design assets ship with mobile and reduced-motion rules',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../public/premium.css'),'utf8');
  const js=fs.readFileSync(path.join(__dirname,'../public/premium.js'),'utf8');
  assert.match(css,/max-width:680px/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/backdrop-filter/);
  assert.match(js,/IntersectionObserver/);
  assert.match(js,/prefers-reduced-motion/);
});
test('long Persian titles stay complete and use semantic headline hierarchy',()=>{
  const db=fixture(15);
  const longTitle='نشست بررسی مسائل روستاهای ساردوئیه و برنامه‌های اجرایی حوزه آموزش، کشاورزی و زیرساخت‌های ارتباطی در جنوب کرمان';
  db.articles[14].title=longTitle;
  const html=home(db);
  assert.ok(html.includes(longTitle),'Full headline must be retained');
  assert.match(html,/<h2\b/);
  assert.match(html,/<h3\b/);
  const css=fs.readFileSync(path.join(__dirname,'../public/premium.css'),'utf8');
  assert.match(css,/-webkit-line-clamp:3/);
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
test('Cloudflare homepage retains the protected category routes and premium covers',()=>{
 const db=fixture(15);
 db.categories.unshift({id:'incidents',name:'حوادث'},{id:'weather',name:'آب‌وهوا'});
 const html=home(db);
 assert.match(html,/href="\/category\/incidents"/);
 assert.match(html,/href="\/category\/weather"/);
 assert.match(html,/<a class="pr-card[^>]*href="\/news\/[A-Za-z0-9_-]+"/);
 assert.doesNotMatch(html,/src="\/assets\/placeholder\.svg"/);
});
test('production SEO exposes WebSite and NewsMediaOrganization structured data',()=>{
 const html=home(fixture(7));
 assert.ok(html.includes('"@type":"WebSite"'));
 assert.ok(html.includes('"@type":"NewsMediaOrganization"'));
 assert.match(html,/rel="canonical" href="https:\/\/nabzesardo\.ir\/"/);
});
test('Cloudflare Worker and Node adapter use the new Experimental Editorial views',()=>{
 const worker=fs.readFileSync(path.join(__dirname,'../src/worker.js'),'utf8');
 const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
 assert.match(worker,/views-rebirth/);
 assert.match(app,/views-rebirth/);
 assert.doesNotMatch(worker,/import views from "\.\.\/lib\/view-public\.js";/);
 const routing=require('../lib/views-rebirth');
 assert.equal(typeof routing.home,'function');
 const markup=routing.home(fixture(8));
 assert.match(markup,/assets\/rebirth\.css/);
 assert.match(markup,/class="rb-header"/);
});;
