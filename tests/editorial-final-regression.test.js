const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const store=require('../lib/store');
const views=require('../lib/rebirth-public');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const now=Date.now();
const story=(id,title,days,categoryId='social',views=1)=>({id,slug:id,title,body:'این متن کامل یک گزارش خبری معتبر در جیرفت است.',status:'published',categoryId,publishedAt:new Date(now-days*86400000).toISOString(),views});
const fresh=story('fresh','گزارش تازه جیرفت',0);
test('Persian paragraphs are justified in both renderers; React keeps the existing first-line treatment',()=>{
  const reader=read('gemini-source/src/components/ArticleReader.tsx');
  assert.match(reader,/dir=\{locale === 'fa' \? 'rtl' : 'ltr'\}/);
  assert.match(reader,/article-prose-paragraph/);
  assert.match(reader,/first-line:font-semibold/);
  assert.match(read('gemini-source/src/index.css'),/\.article-prose-paragraph\[dir="rtl"\]\s*\{[^}]*text-align:\s*justify/);
  const html=views.article({articles:[fresh],categories:[],settings:{}},fresh);
  assert.match(html,/class="rb-fa lang-fa rb-article-prose" dir="rtl"/);
  assert.match(read('public/assets/rebirth.css'),/\.rb-article-prose p\s*\{[^}]*text-align:\s*justify/);
});
test('30-day popular and 7-day genuine brief sections never fall back to stale or ordinary news',()=>{
  const stale=story('stale','گزارش قدیمی پر بازدید',60,'social',10000);
  const brief=story('brief','خبر کوتاه تازه منطقه',1,'short-news');
  const oldBrief=story('old-brief','خبر کوتاه قدیمی منطقه',12,'short-news');
  const html=views.home({articles:[fresh,stale,brief,oldBrief],categories:[],settings:{}});
  const popular=html.split('<div class="rb-popular">')[1].split('<div class="rb-briefs">')[0];
  const briefs=html.split('<div class="rb-briefs">')[1].split('</section>')[0];
  assert.doesNotMatch(popular,/گزارش قدیمی پر بازدید/);
  assert.match(briefs,/خبر کوتاه تازه منطقه/);
  assert.doesNotMatch(briefs,/خبر کوتاه قدیمی منطقه|گزارش تازه جیرفت/);
});
test('non-local foreign wire is excluded even before database cleanup',()=>{
  assert.equal(store.publiclyVisibleArticle({status:'published',title:'گزارش پنتاگون درباره یمن',body:'بیانیه وزارت جنگ آمریکا درباره عملیات نظامی'}),false);
  assert.equal(store.publiclyVisibleArticle(fresh),true);
});
test('direct browser article requests resolve missing or blocked keys through the server policy',()=>{
  const worker=read('src/worker.js');
  assert.match(worker,/if\(!snap\.articleByKey\.has\(articleRoute\[1\]\)\)\s*\{\s*const resolved=await handleFastPublic/);
});
test('mobile server search uses aligned CSS and JS breakpoints',()=>{
  assert.match(read('public/assets/rebirth.css'),/\.rb-header-side \.rb-search\.is-open\s*\{[^}]*position:absolute/);
  assert.match(read('public/assets/rebirth.js'),/matchMedia\('\(max-width:820px\)'\)/);
});

test('mobile main forms keep text at the iOS minimum focus size',()=>{
  assert.match(read('public/assets/rebirth.css'),/@media\(max-width:480px\)\{[\s\S]*?main select\s*\{\s*font-size:16px !important/);
});
