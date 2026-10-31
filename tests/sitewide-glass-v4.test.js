const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const views=require('../lib/views-v2');
const publicViews=require('../lib/view-public');
const {header,footer,shell}=require('../lib/view-common');
const opinionPage=require('../lib/view-opinion');
const adminViews=require('../lib/view-admin');
function fixture(){
 const cats=[{id:'social',name:'اجتماعی'},{id:'incidents',name:'حوادث'},{id:'weather',name:'آب‌وهوا'},{id:'short-news',name:'خبر کوتاه'},{id:'opinion',name:'یادداشت و مطالبه'}];
 const items=Array.from({length:18},(_,i)=>({
  id:'v4-'+i,slug:'v4-'+i,status:'published',
  title:'گزارش ویژه درباره مسائل شهری و تحولات جنوب کرمان '+i,
  lead:'پیگیری موضوعات مهم و بررسی تازه‌ترین تحولات شهرها و روستاهای منطقه',
  body:'این یک گزارش کامل آزمایشی برای بررسی خوانایی متون فارسی در قالب رسانه است.',
  bodyHtml:'<p>این یک گزارش کامل آزمایشی برای بررسی خوانایی متون فارسی در قالب رسانه است.</p>',
  categoryId:cats[i%cats.length].id,
  location:i%2?'جیرفت':'ساردوئیه',
  createdAt:new Date(Date.UTC(2026,9,30,12,i)).toISOString(),
  views:17-i,
  image:'/assets/news-cover.svg'
 }));
 return {articles:items,categories:cats,settings:{},followups:[]};
}
test('every public page shares the premium header, footer and style without modifying SEO canonical',()=>{
 const db=fixture();
 const pages=[
  ['archive',views.archive(db)],['article',views.article(db,db.articles[0])],
  ['category',views.category(db,db.categories[0])],
  ['briefs',views.category(db,db.categories[3])],
  ['search',views.search(db,'کرمان')],
  ['local',views.localHub(db,'jiroft')],
  ['about',views.simple(db,'about')],
  ['contact',views.simple(db,'contact')],
  ['send-news',views.simple(db,'send-news')],
  ['editorial-policy',views.editorialPolicy(db)],
  ['followup',views.followup(db)],
  ['opinion',opinionPage(db,db.categories[4])]
 ];
 for(const [name,html] of pages){
  assert.ok(html.includes('glass-sitewide-v4.css'),name+' stylesheet');
  assert.ok(html.includes('glass-sitewide-v4.js'),name+' navigation behavior');
  assert.match(html,/class="site-capsule" data-ns4-header/,name+' header');
  assert.match(html,/class="ns4-footer"/,name+' footer');
  assert.match(html,/class="site-inline-nav ns4-header-nav"/,name+' nav');
  assert.match(html,/aria-controls="ns4-main-nav"/,name+' toggle');
  assert.match(html,/<meta name="robots"/,name+' SEO robots');
  assert.match(html,/<link rel="canonical" href="https:\/\/nabzesardo\.ir\//,name+' canonical');
 }
});
test('global styling is isolated from dynamic article and admin behavior',()=>{
 const db=fixture();
 const article=views.article(db,db.articles[0]);
 for(const selector of ['data-article-share','data-article-copy','data-article-share-image','data-article-instagram-post','data-article-text-story','data-article-root'])assert.ok(article.includes(selector),selector);
 const login=adminViews.login(false);
 assert.match(login,/glass-admin-v4\.css/);
 assert.doesNotMatch(login,/glass-sitewide-v4\.css/);
 assert.match(login,/name="password"/);
 assert.match(login,/name="username"/);
 const editor=adminViews.editor(db);
 assert.match(editor,/data-rich-form/);
 assert.match(editor,/data-save-news/);
 assert.match(editor,/glass-admin-v4\.css/);
 const send=views.simple(db,'send-news');
 assert.match(send,/name="mediaFile"/);
 assert.match(send,/enctype="multipart\/form-data"/);
 assert.match(send,/name="headline"/);
 assert.match(send,/name="details"/);
});
test('the homepage and its SEO schema still render despite the shared design layer',()=>{
 const markup=views.home(fixture());
 assert.match(markup,/class="ns26-site ns27-site ns28-site ns29-site"/);
 assert.match(markup,/glass-sitewide-v4\.css/);
 assert.match(markup,/apple-glass-editorial-v3\.css/);
 assert.match(markup,/"@type":"NewsMediaOrganization"/);
});
test('design system protects responsive navigation, image ratio, touch targets and keyboard access',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../public/glass-sitewide-v4.css'),'utf8');
 const admin=fs.readFileSync(path.join(__dirname,'../public/glass-admin-v4.css'),'utf8');
 const js=fs.readFileSync(path.join(__dirname,'../public/glass-sitewide-v4.js'),'utf8');
 assert.match(css,/max-width:660px/);
 assert.match(css,/min-height:45px/);
 assert.match(css,/aspect-ratio:16\/9/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/body\.public-shell footer\.ns4-footer/);
 assert.match(admin,/editor-shell/);
 assert.match(js,/aria-expanded/);
 assert.match(js,/Escape/);
});
