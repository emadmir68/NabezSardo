const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const render=require('../lib/view-home-2026');
const article=(id,title,image,location='')=>({
 id,slug:'story-'+id,title,lead:title+'؛ جزئیات تازه درباره این رویداد در جنوب کرمان',body:'',
 location,categoryId:'incidents',status:'published',image,
 createdAt:new Date(Date.now()-Number(id)*60000).toISOString()
});
function db(){
 return {settings:{},categories:[{id:'incidents',name:'حوادث'},{id:'weather',name:'آب‌وهوا'},{id:'social',name:'اجتماعی'}],articles:[
 article('01','خبر تازه اما بدون تصویر','/assets/news-cover.svg','تهران'),
 article('02','گزارش تصویری جدید از جیرفت','/uploads/photo02.jpg','جیرفت'),
 article('03','خبر محلی بدون عکس','/assets/news-cover.svg','ساردوئیه'),
 article('04','خبر با تصویر واقعی محلی','/uploads/photo04.jpg','ساردوئیه'),
 article('05','گزارش بررسی راه‌ها','/assets/news-cover.svg','کهنوج'),
 article('06','وضعیت مدارس روستایی','/assets/news-cover.svg','جیرفت'),
 article('07','آخرین تغییرات در حوزه خدمات عمومی','/assets/news-cover.svg','جیرفت'),
 article('08','پیگیری وضعیت محورها','/assets/news-cover.svg','جیرفت'),
 article('09','گزارش شهری امروز','/assets/news-cover.svg','جیرفت'),
 article('10','تیتر خبری محلی دیگر','/assets/news-cover.svg','جیرفت'),
 article('11','گزارش محلی در جنوب استان','/assets/news-cover.svg','جیرفت'),
 article('12','خبرهای عمومی','/assets/news-cover.svg','جیرفت'),
 article('13','جزئیات گزارش جدید','/assets/news-cover.svg','جیرفت'),
 article('14','اخبار کوتاه استان','/assets/news-cover.svg','جیرفت')
 ]};
}
test('newsroom V2 has real headlines above features, not a decorative marketing hero',()=>{
 const html=render(db());
 assert.match(html,/class="ns26-site ns27-site"/);
 assert.match(html,/ns27-ticker/);
 assert.match(html,/ns27-mast/);
 assert.match(html,/سرخطِ <em>خبرها<\/em>/);
 assert.match(html,/newsroom-v2\.css/);
 assert.doesNotMatch(html,/ns26-intro ns26-container/);
 assert.doesNotMatch(html,/ns26-art-orb/);
 assert.match(html,/href="\/category\/incidents"/);
 assert.match(html,/href="\/category\/weather"/);
 assert.match(html,/class="ns26-feature-grid"/);
 assert.match(html,/data-story-card/);
});
test('lead feature selects a recent genuine photograph, prioritising local coverage',()=>{
 const html=render(db());
 const hero=html.match(/<section class="ns26-feature-grid"[^>]*>([\s\S]*?)<div class="ns26-feature-aside">/);
 assert.ok(hero,'feature grid exists');
 assert.match(hero[1],/گزارش تصویری جدید از جیرفت|خبر با تصویر واقعی محلی/);
 assert.match(hero[1],/ns26-cover-photo/);
 assert.doesNotMatch(hero[1],/روایتِ روشنِ/);
});
test('ticker uses article data and keeps clickthrough URLs',()=>{
 const html=render(db());
 assert.match(html,/href="\/news\/story-01"/);
 assert.match(html,/href="\/news\/story-02"/);
 assert.match(html,/class="ns27-ticker-scroll"/);
 assert.match(html,/aria-label="آخرین تیترهای منتشرشده"/);
});
test('design is isolated and still has responsive, accessible header controls',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../public/newsroom-v2.css'),'utf8');
 assert.match(css,/ns27-page/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/min-height:44px/);
});


test('main headline never promotes a 40-day-old photo above a current report',()=>{
 const d=db();
 const stale=article('20','گزارش قدیمی با عکس وانت','/uploads/old-truck.jpg','جیرفت');
 stale.publishedAt=new Date(Date.now()-40*86400000).toISOString();
 stale.createdAt=stale.publishedAt;
 const freshest=article('21','خبر فوری و تازه از ساردوئیه','/assets/news-cover.svg','ساردوئیه');
 freshest.publishedAt=new Date(Date.now()-5*60000).toISOString();
 freshest.createdAt=freshest.publishedAt;
 d.articles=[stale,freshest];
 const html=render(d);
 const feature=html.match(/<section class="ns26-feature-grid"[^>]*>([\s\S]*?)<div class="ns26-feature-aside">/);
 assert.ok(feature);
 assert.match(feature[1],/خبر فوری و تازه از ساردوئیه/);
 assert.doesNotMatch(feature[1],/گزارش قدیمی با عکس وانت/);
 assert.doesNotMatch(html,/تیترهای <em>امروز<\/em>/);
});
test('photo enhancement is limited to reports in the newest three-hour news cycle',()=>{
 const d=db();
 const now=Date.now();
 const newest=article('22','جدیدترین خبر بدون عکس','/assets/news-cover.svg','تهران');
 newest.publishedAt=new Date(now-2*60000).toISOString();
 const oldPhoto=article('23','خبر دیروز با عکس','/uploads/yesterday.jpg','جیرفت');
 oldPhoto.publishedAt=new Date(now-26*3600000).toISOString();
 d.articles=[oldPhoto,newest];
 const html=render(d);
 const feature=html.match(/<section class="ns26-feature-grid"[^>]*>([\s\S]*?)<div class="ns26-feature-aside">/);
 assert.match(feature[1],/جدیدترین خبر بدون عکس/);
 assert.doesNotMatch(feature[1],/خبر دیروز با عکس/);
});
