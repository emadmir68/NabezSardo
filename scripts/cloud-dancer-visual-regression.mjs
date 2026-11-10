// Screenshot-based mobile regression: isolated public render with real CSS assets.
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url);
const home=require('../lib/view-home-2026');
const root=path.resolve('public');
const db={
  settings:{},
  categories:[{id:'social',name:'اجتماعی'},{id:'culture',name:'فرهنگی'},{id:'incidents',name:'حوادث'},{id:'weather',name:'آب‌وهوا'},{id:'short-news',name:'خبر کوتاه'}],
  articles:Array.from({length:17},(_,i)=>({
    id:'story-'+i,slug:'story-'+i,status:'published',views:17-i,
    title:i===16?'«راز قلم» مجوز انتشار گرفت':(i===15?'کشف دو دستگاه موتورسیکلت سرقتی در عنبرآباد':'دادستان جیرفت: با انشعابات غیرمجاز آب قاطعانه برخورد می‌شود؛ دستگاه قضایی از حقوق قانونی شرکت آب و فاضلاب حمایت می‌کند'),
    lead:i===16?'«راز قلم» مجوز انتشار گرفت؛ مدیرکل فرهنگ و ارشاد اسلامی جنوب کرمان از صدور مجوز انتشار خبر داد.':'بررسی مسائل خبری، اجتماعی و خدمات عمومی شهرهای جنوب کرمان با جزئیات تازه',
    categoryId:i%4===0?'culture':i%4===1?'incidents':'weather',
    image:'/assets/news-cover.svg',
    createdAt:new Date(Date.UTC(2026,9,30,15,i)).toISOString()
  }))
};
const body=home(db);
const server=http.createServer(async(req,res)=>{
  let u;try{u=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end();return;}
  if(u.pathname==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(body);return;}
  if(!u.pathname.startsWith('/assets/')){res.writeHead(404).end('Not found');return;}
  const rel=u.pathname.slice('/assets/'.length);
  const target=path.resolve(root,rel);
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const type=target.endsWith('.css')?'text/css':target.endsWith('.js')?'application/javascript':target.endsWith('.svg')?'image/svg+xml':target.endsWith('.png')?'image/png':'application/octet-stream';
  try{const b=await fs.readFile(target);res.writeHead(200,{'content-type':type});res.end(b);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;
const browser=await chromium.launch({headless:true});
let failures=0;
function verify(ok,message){
  console.log((ok?'PASS ':'FAIL ')+message);
  if(!ok)failures++;
}
function contained(parent,child){
  return !!parent&&!!child&&child.left>=parent.left-2&&child.right<=parent.right+2&&
    child.top>=parent.top-2&&child.bottom<=parent.bottom+2;
}
try{
  await fs.mkdir('/tmp/nabez-cloud-dancer-visual',{recursive:true});
  for(const v of [
    {name:'360',w:360,h:800},
    {name:'390',w:390,h:844},
    {name:'412',w:412,h:915},
    {name:'tablet',w:768,h:1024},
    {name:'desktop',w:1280,h:850}
  ]){
    const mobile=v.w<=860;
    const page=await browser.newPage({
      viewport:{width:v.w,height:v.h},deviceScaleFactor:1,
      locale:'fa-IR',reducedMotion:'reduce'
    });
    await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'networkidle',timeout:45000});
    await page.evaluate(()=>document.fonts.ready);
    const x=await page.evaluate(()=>{
      const el=selector=>document.querySelector(selector);
      const rect=selector=>el(selector)?.getBoundingClientRect()?.toJSON()||null;
      const style=selector=>el(selector)?getComputedStyle(el(selector)):null;
      const cards=[...document.querySelectorAll('.pr-card')];
      const featureTitle=el('.pr-feature__body h2');
      const mobileSearch=el('.pr-search-link');
      return {
        viewport:innerWidth,
        scrollWidth:document.documentElement.scrollWidth,
        pageClass:document.body.className,
        header:rect('.pr-head__bar'),
        feature:rect('.pr-feature'),
        featureImage:rect('.pr-feature__media img'),
        featureBody:rect('.pr-feature__body'),
        featureTitle:featureTitle?.getBoundingClientRect()?.toJSON()||null,
        imageFit:style('.pr-feature__media img')?.objectFit||'',
        featuredHref:el('.pr-feature')?.getAttribute('href')||'',
        card:rect('.pr-card'),
        cardMedia:rect('.pr-card__media'),
        cardText:rect('.pr-card__body'),
        cardTitle:rect('.pr-card__body h3'),
        cardCount:cards.length,
        cardImageLoaded:!!el('.pr-card__media img')?.naturalWidth,
        navVisible:style('.pr-mobile-nav')?.display!=='none',
        mobileSearch:rect('.pr-search-link'),
        mobileSearchVisible:!!mobileSearch&&style('.pr-search-link')?.display!=='none',
        desktopSearchVisible:style('.pr-search')?.display!=='none',
        cta:rect('.pr-hero__cta .pr-btn'),
        stats:[...document.querySelectorAll('.pr-stats [data-count]')]
          .map(n=>({value:n.getAttribute('data-count'),text:n.textContent.trim()})),
        tickerReducedMotion:style('.pr-ticker__track')?.animationName==='none',
        revealVisible:style('.pr-feature')?.opacity==='1',
        duplicatedTickerInert:el('.pr-ticker__dup')?.hasAttribute('inert')===true
      };
    });
    console.log('METRICS '+v.name+' '+JSON.stringify(x));
    verify(x.pageClass.includes('pr-body'),v.name+' production premium template is active');
    verify(x.scrollWidth<=v.w+2,v.name+' page has no horizontal overflow');
    verify(x.header&&x.header.width<=v.w-8,v.name+' header fits viewport');
    verify(x.feature&&x.feature.width>100&&x.feature.height>=250,v.name+' lead story is visible');
    verify(x.featureImage&&x.featureImage.width>100&&x.featureImage.height>120,v.name+' lead image has usable size');
    verify(x.imageFit==='cover',v.name+' lead image fills artwork frame');
    verify(contained(x.feature,x.featureTitle),v.name+' headline stays inside lead card');
    verify(x.featuredHref.startsWith('/news/'),v.name+' lead story links to article');
    verify(x.cardCount>=3,v.name+' latest-news listing is populated');
    verify(x.cardMedia&&x.cardMedia.height>=90,v.name+' news photo has usable height');
    verify(x.cardText&&x.cardText.top>=x.cardMedia.bottom-3,v.name+' card text follows photo');
    verify(contained(x.cardText,x.cardTitle),v.name+' card headline remains inside card');
    verify(x.cardImageLoaded,v.name+' news thumbnail loads');
    verify(x.stats.length===3&&x.stats.every(a=>a.text&&a.text!=='۰'),v.name+' published stats are visible');
    verify(x.tickerReducedMotion,v.name+' ticker respects reduced motion');
    verify(x.revealVisible,v.name+' lead content remains visible without animations');
    verify(x.duplicatedTickerInert,v.name+' duplicate ticker links are inert');
    if(mobile){
      verify(x.navVisible,v.name+' touch navigation is available');
      verify(x.mobileSearchVisible&&x.mobileSearch?.height>=44,v.name+' mobile search is touch-friendly');
      verify(x.mobileSearch.right<=v.w+2&&x.mobileSearch.left>=-2,v.name+' mobile search is on screen');
    }else{
      verify(x.desktopSearchVisible,v.name+' desktop search is available');
    }
    if(v.w<=680){
      verify(x.card&&x.card.width>=v.w*.76,v.name+' news card uses mobile width');
      verify(x.cta&&x.cta.height>=44,v.name+' CTA is touch-friendly');
    }
    await page.locator('.pr-hero').scrollIntoViewIfNeeded();
    await page.screenshot({path:'/tmp/nabez-cloud-dancer-visual/hero-'+v.name+'.png',fullPage:false});
    await page.locator('.pr-grid').scrollIntoViewIfNeeded();
    await page.screenshot({path:'/tmp/nabez-cloud-dancer-visual/latest-'+v.name+'.png',fullPage:false});
    await page.close();
  }
}finally{
  await browser.close();
  await new Promise(r=>server.close(r));
}
if(failures)process.exit(1);
