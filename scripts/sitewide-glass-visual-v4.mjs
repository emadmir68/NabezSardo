// Browser-level checks across all public and editorial pages, including actual RTL geometry.
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const views=require('../lib/views-v2');
const opinion=require('../lib/view-opinion');
const adminViews=require('../lib/view-admin');
const root=path.resolve('public');
const cats=[{id:'social',name:'اجتماعی'},{id:'incidents',name:'حوادث'},{id:'weather',name:'آب‌وهوا'},{id:'opinion',name:'یادداشت و مطالبه'},{id:'short-news',name:'خبر کوتاه'}];
const db={settings:{},categories:cats,followups:[],articles:Array.from({length:30},(_,i)=>({
 id:'v4story-'+i,slug:'v4story-'+i,
 title:'عنوان بلند گزارش خبری درباره مسائل مهم شهری و کیفیت خدمات عمومی جنوب کرمان در جیرفت و ساردوئیه '+i,
 lead:'گزارش تحریریه از وضعیت خدمات شهری و موضوعات مهم زندگی روزمره مردم منطقه.',
 body:'این نمونه متنی برای سنجش تجربه مطالعه روی گوشی‌های کوچک و حفظ چیدمان درست راست‌به‌چپ است.',
 bodyHtml:'<p>این نمونه متنی برای سنجش تجربه مطالعه روی گوشی‌های کوچک و حفظ چیدمان درست راست‌به‌چپ است.</p><h2>ادامه گزارش</h2><p>جزئیات تکمیلی گزارش در این بخش قرار می‌گیرد.</p>',
 status:'published',categoryId:cats[i%cats.length].id,
 createdAt:new Date(Date.UTC(2026,9,30,10,i)).toISOString(),
 location:'جیرفت',views:i,image:'/assets/news-cover.svg'
}))};
const urls={
 '/':views.home(db),
 '/all-news':views.archive(db),
 '/news/v4story-0':views.article(db,db.articles[0]),
 '/category/social':views.category(db,cats[0]),
 '/category/short-news':views.category(db,cats[4]),
 '/category/opinion':opinion(db,cats[3]),
 '/search':views.search(db,'جیرفت'),
 '/local/jiroft':views.localHub(db,'jiroft'),
 '/about':views.simple(db,'about'),
 '/contact':views.simple(db,'contact'),
 '/send-news':views.simple(db,'send-news'),
 '/editorial-policy':views.editorialPolicy(db),
 '/follow-up':views.followup(db),
 '/admin/login':adminViews.login(false),
 '/admin':adminViews.admin(db),
 '/admin/articles/new':adminViews.editor(db)
};
const server=http.createServer(async(req,res)=>{
 let url;try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end();return;}
 if(url.pathname in urls){res.writeHead(200,{'content-type':'text/html;charset=utf-8'}).end(urls[url.pathname]);return;}
 if(!url.pathname.startsWith('/assets/')){res.writeHead(404).end('Not found');return;}
 let rel=url.pathname.slice(8),full=path.resolve(root,rel);
 if(!full.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 const type=full.endsWith('.css')?'text/css':full.endsWith('.js')?'text/javascript':full.endsWith('.svg')?'image/svg+xml':full.endsWith('.png')?'image/png':full.endsWith('.ttf')?'font/ttf':'application/octet-stream';
 try{res.writeHead(200,{'content-type':type}).end(await fs.readFile(full));}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true});
const host='http://127.0.0.1:'+server.address().port;
const sizes=[{w:360,h:800},{w:390,h:844},{w:412,h:915},{w:1280,h:900}];
let failed=0;
const report=(good,info)=>{console.log((good?'PASS':'FAIL')+' '+info);if(!good)failed++};
const outdir='/tmp/nabez-v4-visual';
await fs.mkdir(outdir,{recursive:true});
try{
 for(const size of sizes){
  const page=await browser.newPage({viewport:{width:size.w,height:size.h},locale:'fa-IR',deviceScaleFactor:1});
  for(const [route,html] of Object.entries(urls)){
   await page.goto(host+route,{waitUntil:'domcontentloaded',timeout:35000});
   await page.evaluate(()=>document.fonts.ready);
   const metrics=await page.evaluate(()=>{
    const rect=q=>document.querySelector(q)?.getBoundingClientRect()?.toJSON()||null;
    const scroll=document.documentElement.scrollWidth;
    const body=document.body;
    const nav=rect('[data-ns4-header]');
    const card=rect('.grid.news .card');
    const title=rect('main h1');
    const inputs=[...document.querySelectorAll('main input:not([type="hidden"]):not(.hp-field input),main textarea,main select')].map(x=>x.getBoundingClientRect().toJSON());
    return {scroll,bodyClass:body.className,header:nav,card,title,inputs,footer:rect('.ns4-footer'),menu:rect('.ns4-menu-toggle'),hero:rect('.ns26-feature-main'),css:getComputedStyle(document.body).backgroundColor};
   });
   const id=route==='/'?'home':route.replaceAll('/','_').replace(/^_/,'')||'root';
   console.log('METRICS '+size.w+' '+route+' '+JSON.stringify({scroll:metrics.scroll,header:metrics.header&&{w:metrics.header.width,h:metrics.header.height},card:metrics.card&&{w:metrics.card.width,h:metrics.card.height},title:metrics.title&&{w:metrics.title.width,h:metrics.title.height}}));
   report(metrics.scroll<=size.w+3,size.w+' '+route+' no horizontal overflow ('+metrics.scroll+')');
   if(!route.startsWith('/admin')){
    report(html.includes('glass-sitewide-v4.css'),size.w+' '+route+' shared stylesheet');
    if(route!=='/')report(!!metrics.header&&metrics.header.height>=50,size.w+' '+route+' glass header displayed');
    if(route!=='/')report(!!metrics.footer&&metrics.footer.height>100,size.w+' '+route+' full footer');
   }
   if(route.includes('news/')||route==='/all-news'||route.startsWith('/category/')||route==='/local/jiroft'){
     if(metrics.card)report(metrics.card.width>170,size.w+' '+route+' news card usable width');
   }
   for(const input of metrics.inputs)if(input.width>0&&input.height>0)report(input.right<=size.w+3&&input.left>=-3,size.w+' '+route+' input stays on screen');
   if(size.w===390||size.w===1280){
     if(['/','/all-news','/news/v4story-0','/contact','/category/opinion','/admin/login','/admin','/admin/articles/new'].includes(route)){
      await page.screenshot({path:outdir+'/'+id+'-'+size.w+'.png',fullPage:true});
     }
   }
   if(size.w<=412&&route==='/all-news'){
    const toggle=page.locator('[data-ns4-menu-toggle]');
    report(await toggle.isVisible(),size.w+' mobile menu button visible');
    await toggle.click();
    report(await toggle.getAttribute('aria-expanded')==='true',size.w+' mobile menu opens');
    report(await page.locator('#ns4-main-nav').isVisible(),size.w+' mobile nav visible');
    await page.keyboard.press('Escape');
    report(await toggle.getAttribute('aria-expanded')==='false',size.w+' escape dismisses menu');
   }
  }
  await page.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r))}
console.log('RESULT '+failed+' failures across '+Object.keys(urls).length+' routes and '+sizes.length+' widths');
if(failed)process.exit(1);
