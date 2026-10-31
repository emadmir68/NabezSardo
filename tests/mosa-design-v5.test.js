const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const views=require('../lib/views-v2');
const admin=require('../lib/view-admin');
const cats=[{id:'social',name:'اجتماعی'},{id:'incidents',name:'حوادث'},{id:'weather',name:'آب‌وهوا'},{id:'short-news',name:'خبر کوتاه'},{id:'opinion',name:'یادداشت'}];
const db={
 settings:{},categories:cats,followups:[],
 articles:Array.from({length:18},(_,i)=>({
  id:'v5-'+i,slug:'story-'+i,status:'published',title:'بررسی اتفاقات تازه محلی جیرفت و ساردوئیه '+i,
  lead:'خبرهای واقعی از منطقه در قالب یک رسانه مستقل با روایت خوانا',
  body:'متن کامل گزارش برای آزمون خوانایی و ساختار',
  location:'جیرفت',categoryId:cats[i%cats.length].id,
  createdAt:new Date(Date.now()-i*60000).toISOString(),
  image:i===1?'/uploads/real-local-photo.jpg':'/assets/news-cover.svg',views:i
 }))
};
test('Mosa-inspired news-first homepage keeps real content, SEO and brand',()=>{
 const html=views.home(db);
 assert.match(html,/class="ns26-site ns27-site ns28-site ns29-site"/);
 assert.match(html,/class="ns28-stage ns29-stage"/);
 assert.match(html,/class="ns29-backdrop"/);
 assert.match(html,/خبر زندگی می‌کند/);
 assert.match(html,/mosa-home-v5\.css/);
 assert.match(html,/mosa-sitewide-v5\.css/);
 assert.match(html,/href="\/news\/story-1"/);
 assert.match(html,/"@type":"NewsMediaOrganization"/);
 assert.match(html,/class="ns27-ticker-scroll"/);
 assert.doesNotMatch(html,/mosa-ai-v1\.21st\.app/);
 assert.doesNotMatch(html,/images\.unsplash\.com/);
});
test('all public editorial routes receive unified design but admin stays isolated',()=>{
 const pages=[
  ['archive',views.archive(db)],
  ['article',views.article(db,db.articles[0])],
  ['category',views.category(db,cats[0])],
  ['briefs',views.category(db,cats[3])],
  ['local',views.localHub(db,'jiroft')],
  ['search',views.search(db,'جیرفت')],
  ['about',views.simple(db,'about')],
  ['contact',views.simple(db,'contact')],
  ['send-news',views.simple(db,'send-news')],
  ['editorial-policy',views.editorialPolicy(db)]
 ];
 for(const [name,html] of pages){
  assert.match(html,/mosa-sitewide-v5\.css/,name+' stylesheet');
  assert.match(html,/glass-sitewide-v4\.js/,name+' navigation');
  assert.match(html,/class="ns4-footer"/,name+' shared footer');
  assert.match(html,/class="site-capsule" data-ns4-header/,name+' header');
 }
 const article=pages[1][1];
 assert.match(article,/data-article-share/);
 assert.match(article,/data-article-copy/);
 const login=admin.login(false);
 assert.doesNotMatch(login,/mosa-sitewide-v5\.css/);
 assert.match(login,/glass-admin-v4\.css/);
});
test('premium design supports constrained media, RTL and reduced motion',()=>{
 const site=fs.readFileSync(path.join(__dirname,'../public/mosa-sitewide-v5.css'),'utf8');
 const home=fs.readFileSync(path.join(__dirname,'../public/mosa-home-v5.css'),'utf8');
 for(const css of [site,home]){
  assert.match(css,/@media\(max-width:620px\)|@media\(max-width:660px\)/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/prefers-reduced-transparency/);
  assert.doesNotMatch(css,/url\(['"]?https?:/);
 }
 assert.match(site,/body\.public-shell/);
 assert.match(home,/\.ns29-backdrop/);
 assert.match(home,/object-fit:cover/);
 assert.match(home,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});
