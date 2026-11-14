const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const views=require('../lib/views-v2');
const cats=[
 {id:'social',name:'اجتماعی'},{id:'incidents',name:'حوادث'},{id:'weather',name:'آب‌وهوا'},
 {id:'short-news',name:'خبر کوتاه'},{id:'opinion',name:'یادداشت'}
];
const db={
 settings:{},categories:cats,followups:[],
 articles:Array.from({length:18},(_,i)=>({
  id:'v5-'+i,slug:'story-'+i,status:'published',title:'بررسی اتفاقات تازه محلی جیرفت و ساردوئیه '+i,
  lead:'خبرهای واقعی از منطقه در قالب یک رسانه مستقل با روایت خوانا',
  body:'متن کامل گزارش برای آزمون خوانایی و ساختار',
  bodyHtml:'<p>متن کامل گزارش برای آزمون خوانایی و ساختار</p>',
  location:'جیرفت',categoryId:cats[i%cats.length].id,
  createdAt:new Date(Date.now()-i*60000).toISOString(),
  publishedAt:new Date(Date.now()-i*60000).toISOString(),
  image:i===1?'/uploads/real-local-photo.jpg':'/assets/news-cover.svg',views:i
 }))
};
test('Experimental Editorial homepage keeps real content, SEO and brand',()=>{
 const html=views.home(db);
 assert.match(html,/rb-home-hero/);
 assert.match(html,/\/assets\/rebirth\.css/);
 assert.match(html,/\/assets\/rebirth\.js/);
 assert.match(html,/href="\/news\/story-17"/);
 assert.match(html,/"@type":"NewsMediaOrganization"/);
 assert.match(html,/href="\/category\/incidents"/);
 assert.doesNotMatch(html,/mosa-ai-v1\.21st\.app/);
 assert.doesNotMatch(html,/images\.unsplash\.com/);
});
test('all public editorial routes use the new design system while admin remains separate',()=>{
 const pages=[
  ['archive',views.archive(db)],
  ['article',views.article(db,db.articles[0])],
  ['category',views.category(db,cats[0])],
  ['briefs',views.briefs(db)],
  ['local',views.localHub(db,'jiroft')],
  ['anbarabad',views.localHub(db,'anbarabad')],
  ['kahnuj',views.localHub(db,'kahnuj')],
  ['search',views.search(db,'جیرفت')],
  ['about',views.simple(db,'about')],
  ['contact',views.simple(db,'contact')],
  ['send-news',views.simple(db,'send-news')],
  ['editorial-policy',views.editorialPolicy(db)],
  ['followup',views.followup(db)]
 ];
 for(const [name,html] of pages){
  assert.match(html,/\/assets\/rebirth\.css/,name+' stylesheet');
  assert.match(html,/class="rb-header"/,name+' header');
  assert.match(html,/class="rb-footer"/,name+' footer');
 }
 const article=pages[1][1];
 for(const selector of ['data-article-share','data-article-copy','data-article-share-image','data-article-instagram-post','data-article-text-story','data-article-root'])assert.ok(article.includes(selector),selector);
 const login=views.login(false);
 assert.doesNotMatch(login,/mosa-sitewide-v5\.css/);
 assert.match(login,/\/assets\/rebirth\.css/);
 assert.match(login,/rb-admin-body/);
});
test('new design supports constrained media, RTL and reduced motion',()=>{
 const site=fs.readFileSync(path.join(__dirname,'../public/assets/rebirth.css'),'utf8');
 const client=fs.readFileSync(path.join(__dirname,'../public/assets/rebirth.js'),'utf8');
 assert.match(site,/@media\(max-width:760px\)/);
 assert.match(site,/prefers-reduced-motion/);
 assert.match(site,/min-height:44px/);
 assert.match(site,/object-fit:cover/);
 assert.match(client,/data-lang-option/);
 assert.match(client,/data-menu-toggle/);
 assert.match(client,/data-search-toggle/);
});
