// Cross-page browser checks for the Experimental Editorial design system.
import {chromium} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const views=require('../lib/views-v2');
const publicRoot=path.resolve('public');
const categories=[
  {id:'social',name:'اجتماعی'},
  {id:'incidents',name:'حوادث'},
  {id:'weather',name:'آب‌وهوا'},
  {id:'culture',name:'فرهنگی'},
  {id:'agriculture',name:'کشاورزی'},
  {id:'short-news',name:'خبر کوتاه'},
  {id:'opinion',name:'یادداشت و مطالبه'}
];
const db={
  settings:{siteName:'نبض ساردو',liveDeskEnabled:true,breakingText:'خبرهای نمونه برای آزمون طراحی',adEnabled:false},
  categories,
  followups:[],
  citizens:[],
  contacts:[],
  articles:Array.from({length:30},(_,i)=>({
    id:'rebirth-story-'+i,
    slug:'rebirth-story-'+i,
    title:'عنوان بلند گزارش خبری درباره مسائل مهم شهری و کیفیت خدمات عمومی جنوب کرمان در جیرفت و ساردوئیه '+i,
    lead:'گزارش تحریریه از وضعیت خدمات شهری و موضوعات مهم زندگی روزمره مردم منطقه.',
    body:'این نمونه متنی برای سنجش تجربه مطالعه روی گوشی‌های کوچک و حفظ چیدمان درست راست‌به‌چپ است.',
    bodyHtml:'<p>این نمونه متنی برای سنجش تجربه مطالعه روی گوشی‌های کوچک و حفظ چیدمان درست راست‌به‌چپ است.</p><h2>ادامه گزارش</h2><p>جزئیات تکمیلی گزارش در این بخش قرار می‌گیرد.</p>',
    status:'published',
    categoryId:categories[i%categories.length].id,
    createdAt:new Date(Date.UTC(2026,10,14,10,i)).toISOString(),
    publishedAt:new Date(Date.UTC(2026,10,14,10,i)).toISOString(),
    location:i%2?'جیرفت':'ساردوئیه',
    author:'تحریریه نبض ساردو',
    views:30-i,
    image:'/assets/news-cover.svg',
    featured:i===0
  }))
};
const adminMonitor={settings:{enabled:false,keywords:''},sources:[],queue:[],counts:{pending:0,sourcesOn:0,sources:0}};
const urls={
  '/':views.home(db),
  '/all-news':views.archive(db),
  '/all-news?category=social':views.archive(db,{category:'social'}),
  '/all-news?page=2':views.archive(db,{page:2}),
  '/news/rebirth-story-0':views.article(db,db.articles[0]),
  '/category/social':views.category(db,categories[0]),
  '/category/short-news':views.category(db,categories[5]),
  '/category/opinion':views.category(db,categories[6]),
  '/search?q=جیرفت':views.search(db,'جیرفت'),
  '/local/jiroft':views.localHub(db,'jiroft'),
  '/local/anbarabad':views.localHub(db,'anbarabad'),
  '/local/kahnuj':views.localHub(db,'kahnuj'),
  '/about':views.simple(db,'about'),
  '/contact':views.simple(db,'contact'),
  '/send-news':views.simple(db,'send-news'),
  '/editorial-policy':views.editorialPolicy(db),
  '/follow-up':views.followup(db),
  '/admin/login':views.login(false),
  '/admin':views.admin(db,[],new URLSearchParams(),{},{},adminMonitor),
  '/admin/articles/new':views.editor(db,db.articles[0],'/admin/articles/new','خبر جدید')
};

const server=http.createServer(async(req,res)=>{
  let url;
  try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end();return;}
  const route=url.pathname==='/search'?'/search?q=جیرفت':url.pathname+url.search;
  if(Object.prototype.hasOwnProperty.call(urls,route)){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}).end(urls[route]);
    return;
  }
  let candidates=[];
  if(url.pathname.startsWith('/assets/')){
    const rel=url.pathname.slice('/assets/'.length);
    candidates=[path.resolve(publicRoot,'assets',rel),path.resolve(publicRoot,rel)];
  }else{
    candidates=[path.resolve(publicRoot,'.'+url.pathname)];
  }
  let resolved=null;
  for(const file of candidates){
    if(!file.startsWith(publicRoot+path.sep))continue;
    try{const stat=await fs.stat(file);if(stat.isFile()){resolved=file;break;}}catch{}
  }
  if(!resolved){res.writeHead(404).end('Not found');return;}
  const ext=path.extname(resolved).toLowerCase();
  const type={
    '.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8',
    '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
    '.webp':'image/webp','.gif':'image/gif','.woff2':'font/woff2','.woff':'font/woff',
    '.ttf':'font/ttf','.mp4':'video/mp4','.webm':'video/webm'
  }[ext]||'application/octet-stream';
  try{res.writeHead(200,{'content-type':type,'cache-control':'no-store'}).end(await fs.readFile(resolved));}
  catch{res.writeHead(404).end('Not found');}
});

await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true});
const host='http://127.0.0.1:'+server.address().port;
const sizes=[{w:360,h:800},{w:390,h:844},{w:412,h:915},{w:768,h:1024},{w:1280,h:900}];
const screenshotDir='/tmp/nabez-rebirth-visual';
await fs.mkdir(screenshotDir,{recursive:true});
let failed=0,passed=0;
const report=(ok,message)=>{
  console.log((ok?'PASS ':'FAIL ')+message);
  if(ok)passed++;else failed++;
};
try{
  for(const size of sizes){
    const page=await browser.newPage({viewport:{width:size.w,height:size.h},locale:'fa-IR',deviceScaleFactor:1});
    const pageErrors=[];
    page.on('pageerror',error=>pageErrors.push(error.message));
    for(const [route,html] of Object.entries(urls)){
      await page.goto(host+route,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForTimeout(120);
      const metrics=await page.evaluate(()=>{
        const rect=selector=>document.querySelector(selector)?.getBoundingClientRect().toJSON()||null;
        return {
          width:window.innerWidth,
          scrollWidth:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),
          direction:document.documentElement.dir,
          rebirthCss:[...document.styleSheets].some(sheet=>sheet.href&&sheet.href.includes('rebirth.css')),
          header:rect('.rb-header'),
          footer:rect('.rb-footer'),
          card:rect('.rb-story'),
          menu:rect('[data-menu-toggle]'),
          bodyClass:document.body.className,
          article:!!document.querySelector('[data-article-root]'),
          admin:!!document.querySelector('.rb-admin-layout'),
          inputSizes:[...document.querySelectorAll('main input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]),main textarea,main select')].filter(x=>x.getBoundingClientRect().width>0).map(x=>parseFloat(getComputedStyle(x).fontSize))
        };
      });
      report(metrics.direction==='rtl',size.w+' '+route+' keeps RTL direction');
      report(metrics.scrollWidth<=size.w+3,size.w+' '+route+' has no horizontal overflow ('+metrics.scrollWidth+')');
      report(metrics.rebirthCss,size.w+' '+route+' loads rebirth stylesheet');
      if(route.startsWith('/admin')){
        report(metrics.admin||route==='/admin/login',size.w+' '+route+' renders newsroom interface');
      }else{
        report(!!metrics.header&&!!metrics.footer,size.w+' '+route+' shares public header and footer');
      }
      if(route.startsWith('/news/')){
        report(metrics.article,size.w+' article root and share metadata exist');
        report(await page.locator('[data-article-share-image]').count()===1,size.w+' article image-share control exists');
        report(await page.locator('[data-article-text-story]').count()===1,size.w+' article text-story export exists');
      }
      if(size.w<=412&&route==='/'){
        const toggle=page.locator('[data-menu-toggle]');
        report(await toggle.isVisible(),size.w+' mobile menu button is visible');
        await toggle.click();
        report(await toggle.getAttribute('aria-expanded')==='true',size.w+' mobile navigation opens');
        report(await page.locator('[data-main-nav].is-open').count()===1,size.w+' mobile navigation receives open state');
        await toggle.click();
        report(await toggle.getAttribute('aria-expanded')==='false',size.w+' mobile navigation closes');
        const search=page.locator('[data-search-toggle]');
        await search.click();
        report(await page.locator('.rb-search.is-open input[name=q]').count()===1,size.w+' mobile search expands');
        const searchWidth=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth));
        report(searchWidth<=size.w+3,size.w+' expanded mobile search stays within viewport ('+searchWidth+')');
        await search.click();
      }
      if(size.w<=412&&metrics.inputSizes.length){
        report(metrics.inputSizes.every(value=>value>=16),size.w+' '+route+' mobile form inputs avoid iOS zoom');
      }
      if(size.w===390&&['/','/all-news','/news/rebirth-story-0','/admin/login','/admin','/admin/articles/new'].includes(route)){
        const name=route==='/'?'home':route.replaceAll('/','_').replace(/^_/,'')||'root';
        const shot=await page.screenshot({path:screenshotDir+'/'+name+'-390.png',fullPage:true});
        report(shot.readUInt32BE(16)<=size.w+3,size.w+' '+route+' screenshot width stays within the viewport');
      }
      if(size.w===1280&&['/','/all-news','/news/rebirth-story-0','/admin','/admin/articles/new'].includes(route)){
        const name=route==='/'?'home':route.replaceAll('/','_').replace(/^_/,'')||'root';
        const shot=await page.screenshot({path:screenshotDir+'/'+name+'-1280.png',fullPage:true});
        report(shot.readUInt32BE(16)<=size.w+3,size.w+' '+route+' screenshot width stays within the viewport');
      }
    }
    report(pageErrors.length===0,size.w+' no uncaught browser errors: '+pageErrors.join(' | '));
    await page.close();
  }
  const css=await (await fetch(host+'/assets/rebirth.css')).text();
  const js=await (await fetch(host+'/assets/rebirth.js')).text();
  report(css.includes('@media(max-width:820px)'), 'mobile stylesheet breakpoint is present');
  report(css.includes('prefers-reduced-motion'), 'reduced-motion preference is respected');
  report(js.includes('data-rebirth-editor'), 'rich editor client is present');
  console.log('SUMMARY passed='+passed+' failed='+failed+' screenshots='+screenshotDir);
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
if(failed)process.exitCode=1;
