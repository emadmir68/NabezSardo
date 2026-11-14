const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const views=require('../lib/views-v2');
function fixture(count=15){
  return {
    categories:[
      {id:'social',name:'اجتماعی'},{id:'culture',name:'فرهنگی'},
      {id:'short-news',name:'خبر کوتاه'},{id:'incidents',name:'حوادث'},
      {id:'weather',name:'آب‌وهوا'},{id:'opinion',name:'یادداشت و مطالبه'}
    ],
    settings:{},
    articles:Array.from({length:count},(_,i)=>({
      id:'news-'+i,slug:'story-'+i,title:'خبر محلی شماره '+i,
      lead:'گزارش محلی از ساردوئیه و جیرفت',
      status:'published',categoryId:i%6===0?'short-news':'social',
      createdAt:new Date(Date.UTC(2026,9,20,0,i)).toISOString(),
      publishedAt:new Date(Date.UTC(2026,9,20,0,i)).toISOString(),
      image:'/assets/news-cover.svg',views:i
    }))
  };
}
test('Experimental Editorial homepage renders the lead, newsroom navigation and empty state',()=>{
  const html=views.home(fixture(15));
  assert.match(html,/rb-home-hero/);
  assert.match(html,/\/assets\/rebirth\.css/);
  assert.match(html,/\/assets\/rebirth\.js/);
  assert.match(html,/href="\/send-news"/);
  assert.match(html,/href="\/all-news"/);
  assert.match(html,/href="\/news\/story-13"/);
  assert.match(views.home(fixture(0)),/نبض ساردو؛/);
});
test('new home links to original news, categories, cities and community submission',()=>{
  const html=views.home(fixture(15));
  assert.match(html,/href="\/local\/jiroft"/);
  assert.match(html,/href="\/category\/social"/);
  assert.match(html,/href="\/search"/);
  assert.match(html,/data-story-title-fa="خبر محلی شماره/);
});
test('responsive design assets include mobile breakpoints and reduced-motion support',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../public/assets/rebirth.css'),'utf8');
  const js=fs.readFileSync(path.join(__dirname,'../public/assets/rebirth.js'),'utf8');
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/object-fit:cover/);
  assert.match(js,/data-menu-toggle/);
  assert.match(js,/data-search-toggle/);
  assert.match(js,/data-rebirth-editor/);
});
test('long Persian titles stay complete and use semantic headline hierarchy',()=>{
  const db=fixture(15);
  const longTitle='نشست بررسی مسائل روستاهای ساردوئیه و برنامه‌های اجرایی حوزه آموزش، کشاورزی و زیرساخت‌های ارتباطی در جنوب کرمان';
  db.articles[14].title=longTitle;
  const html=views.home(db);
  assert.ok(html.includes(longTitle),'Full headline must be retained');
  assert.match(html,/<h1\b/);
  assert.match(html,/<h2\b/);
  assert.match(html,/<h3\b/);
  const css=fs.readFileSync(path.join(__dirname,'../public/assets/rebirth.css'),'utf8');
  assert.match(css,/overflow-wrap:anywhere|overflow-wrap:break-word/);
});
test('article page preserves reading typography and sharing tools',()=>{
  const db=fixture(6);
  const html=views.article(db,db.articles[1]);
  assert.match(html,/class="rb-article-body article-body"/);
  assert.match(html,/data-article-root/);
  assert.match(html,/data-article-share/);
  assert.match(html,/data-article-share-image/);
  assert.match(html,/data-article-instagram-post/);
  assert.match(html,/data-article-text-story/);
  const css=fs.readFileSync(path.join(__dirname,'../public/assets/rebirth.css'),'utf8');
  assert.match(css,/rb-article-body/);
  assert.match(css,/@media\(max-width:760px\)/);
});
test('homepage retains protected category routes and premium covers',()=>{
 const db=fixture(15);
 const html=views.home(db);
 assert.match(html,/href="\/category\/incidents"/);
 assert.match(html,/href="\/category\/weather"/);
 assert.match(html,/href="\/news\/story-14"/);
 assert.doesNotMatch(html,/src="\/assets\/placeholder\.svg"/);
});
test('production SEO exposes WebSite and NewsMediaOrganization structured data',()=>{
 const html=views.home(fixture(7));
 assert.ok(html.includes('"@type":"WebSite"'));
 assert.ok(html.includes('"@type":"NewsMediaOrganization"'));
 assert.match(html,/rel="canonical" href="https:\/\/nabzesardo\.ir\//);
});
test('Cloudflare Worker routes through the Experimental Editorial view layer',()=>{
 const worker=fs.readFileSync(path.join(__dirname,'../src/worker.js'),'utf8');
 assert.match(worker,/views-v2/);
 assert.doesNotMatch(worker,/import views from "\.\.\/lib\/view-public\.js";/);
 const routing=require('../lib/views-v2');
 assert.equal(routing.home,require('../lib/rebirth-public').home);
 const markup=routing.home(fixture(8));
 assert.match(markup,/\/assets\/rebirth\.css/);
 assert.match(markup,/rb-home-hero/);
});
