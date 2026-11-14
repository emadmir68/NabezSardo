const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const views=require('../lib/views-v2');
function fixture(){
 const cats=[
  {id:'social',name:'اجتماعی'},{id:'incidents',name:'حوادث'},{id:'weather',name:'آب‌وهوا'},
  {id:'short-news',name:'خبر کوتاه'},{id:'opinion',name:'یادداشت و مطالبه'}
 ];
 const items=Array.from({length:18},(_,i)=>({
  id:'v4-'+i,slug:'v4-'+i,status:'published',
  title:'گزارش ویژه درباره مسائل شهری و تحولات جنوب کرمان '+i,
  lead:'پیگیری موضوعات مهم و بررسی تازه‌ترین تحولات شهرها و روستاهای منطقه',
  body:'این یک گزارش کامل آزمایشی برای بررسی خوانایی متون فارسی در قالب رسانه است.',
  bodyHtml:'<p>این یک گزارش کامل آزمایشی برای بررسی خوانایی متون فارسی در قالب رسانه است.</p>',
  categoryId:cats[i%cats.length].id,
  location:i%2?'جیرفت':'ساردوئیه',
  createdAt:new Date(Date.UTC(2026,9,30,12,i)).toISOString(),
  publishedAt:new Date(Date.UTC(2026,9,30,12,i)).toISOString(),
  views:17-i,image:'/assets/news-cover.svg'
 }));
 return {articles:items,categories:cats,settings:{},followups:[]};
}
test('every public route shares the Experimental Editorial shell and correct canonical metadata',()=>{
 const db=fixture();
 const pages=[
  ['archive',views.archive(db)],
  ['article',views.article(db,db.articles[0])],
  ['category',views.category(db,db.categories[0])],
  ['briefs',views.briefs(db)],
  ['search',views.search(db,'کرمان')],
  ['local',views.localHub(db,'jiroft')],
  ['about',views.simple(db,'about')],
  ['contact',views.simple(db,'contact')],
  ['send-news',views.simple(db,'send-news')],
  ['editorial-policy',views.editorialPolicy(db)],
  ['followup',views.followup(db)]
 ];
 for(const [name,html] of pages){
  assert.ok(html.includes('/assets/rebirth.css'),name+' stylesheet');
  assert.match(html,/class="rb-header"/,name+' header');
  assert.match(html,/class="rb-footer"/,name+' footer');
  assert.match(html,/<meta name="robots"/,name+' SEO robots');
  assert.match(html,/<link rel="canonical" href="https:\/\/nabzesardo\.ir\//,name+' canonical');
 }
});
test('article sharing, story exports and admin editor behavior remain connected',()=>{
 const db=fixture();
 const article=views.article(db,db.articles[0]);
 for(const selector of ['data-article-share','data-article-copy','data-article-share-image','data-article-instagram-post','data-article-text-story','data-article-root','data-article-copy-message'])assert.ok(article.includes(selector),selector);
 assert.match(article,/\/assets\/instagram-post\.js/);
 assert.match(article,/\/assets\/text-story\.js/);
 const login=views.login(false);
 assert.match(login,/\/assets\/rebirth\.css/);
 assert.doesNotMatch(login,/glass-sitewide-v4\.css/);
 assert.match(login,/name="password"/);
 assert.match(login,/name="username"/);
 const editor=views.editor(db);
 assert.match(editor,/data-rich-form/);
 assert.match(editor,/data-save-news/);
 assert.match(editor,/name="submissionToken"/);
 assert.match(editor,/data-editor/);
 assert.match(editor,/\/assets\/rebirth\.css/);
 const send=views.simple(db,'send-news');
 assert.match(send,/name="mediaFile"/);
 assert.match(send,/enctype="multipart\/form-data"/);
 assert.match(send,/name="headline"/);
 assert.match(send,/name="details"/);
});
test('responsive system protects mobile navigation, image framing, touch targets and motion preferences',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../public/assets/rebirth.css'),'utf8');
 const js=fs.readFileSync(path.join(__dirname,'../public/assets/rebirth.js'),'utf8');
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/min-height:44px/);
 assert.match(css,/aspect-ratio/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(js,/aria-expanded/);
 assert.match(js,/data-menu-toggle/);
 assert.match(js,/data-rebirth-editor/);
});
