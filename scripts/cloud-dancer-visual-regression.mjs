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
function verify(ok,message){console.log((ok?'PASS ':'FAIL ')+message);if(!ok)failures++;}
function contained(parent,child){return !!parent&&!!child&&child.left>=parent.left-2&&child.right<=parent.right+2&&child.top>=parent.top-2&&child.bottom<=parent.bottom+2}
try{
 await fs.mkdir('/tmp/nabez-cloud-dancer-visual',{recursive:true});
 for(const v of [{name:'360',w:360,h:800},{name:'390',w:390,h:844},{name:'412',w:412,h:915},{name:'desktop',w:1280,h:850}]){
  const page=await browser.newPage({viewport:{width:v.w,height:v.h},deviceScaleFactor:1,locale:'fa-IR'});
  await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'networkidle',timeout:45000});
  await page.evaluate(()=>document.fonts.ready);
  const x=await page.evaluate(()=>{
    const R=sel=>document.querySelector(sel)?.getBoundingClientRect()?.toJSON()||null;
    const mainR=R('.ns26-feature-main');
    const featureMedia=R('.ns26-feature-main .ns26-photo');
    const featureText=R('.ns26-feature-main .ns26-feature-details');
    const sideR=R('.ns26-feature-side');
    const sideMedia=R('.ns26-feature-side .ns26-photo');
    const sideText=R('.ns26-feature-side .ns26-feature-details');
    const cardR=R('.ns26-news-card');
    const cardMedia=R('.ns26-news-card .ns26-thumb');
    const cardText=R('.ns26-news-card .ns26-news-content');
    const button=R('.ns26-primary');
    const title=R('.ns26-feature-main .ns26-story-title');
    const titleStyle=getComputedStyle(document.querySelector('.ns26-feature-main .ns26-story-title'));
    const image=getComputedStyle(document.querySelector('.ns26-feature-main .ns26-photo-main'));
    return {scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,mainR,featureMedia,featureText,sideR,sideMedia,sideText,cardR,cardMedia,cardText,button,title,titleStyle:{fontSize:titleStyle.fontSize,lineHeight:titleStyle.lineHeight,color:titleStyle.color},imageFit:image.objectFit,oldImageMarker:!!document.querySelector('.ns26-photo.ns26-cover-branded')};
  });
  const mob=v.w<=620;
  console.log('METRICS '+v.name+' '+JSON.stringify(x));
  verify(x.scrollWidth<=v.w+2,v.name+' horizontal overflow absent');
  verify(x.featureMedia&&x.featureMedia.height>80&&x.featureMedia.width>100,v.name+' feature media visible');
  verify(x.featureText&&x.featureText.top>=x.featureMedia.bottom-3,v.name+' feature copy starts after image (not overlay)');
  verify(x.title&&contained(x.featureText,x.title),v.name+' full story title stays within copy region');
  verify(x.cardMedia&&x.cardMedia.height>80,v.name+' news thumbnail has usable height');
  verify(x.cardText&&x.cardText.top>=x.cardMedia.bottom-3,v.name+' card copy starts after picture');
  verify(x.imageFit==='cover',v.name+' branded cover fills artwork frame');
  if(mob){
   verify(x.mainR&&x.mainR.height<=670,v.name+' feature card has compact height, no blank poster region');
   verify(x.featureMedia.height<=v.w*.62,v.name+' feature image follows 16:9 ratio');
   verify(x.cardMedia.width>=v.w*.75,v.name+' latest news image is not a narrow sidebar');
   verify(x.sideText&&x.sideMedia&&x.sideText.left>=x.sideMedia.right-2,v.name+' secondary card text does not overlap photo');
   verify(x.button&&x.button.height>=44,v.name+' CTA is touch-friendly');
  }
  await page.locator('.ns26-feature-grid').scrollIntoViewIfNeeded();
  await page.screenshot({path:'/tmp/nabez-cloud-dancer-visual/features-'+v.name+'.png',fullPage:false});
  await page.locator('.ns26-news-grid').scrollIntoViewIfNeeded();
  await page.screenshot({path:'/tmp/nabez-cloud-dancer-visual/latest-'+v.name+'.png',fullPage:false});
  await page.close();
 }
}finally{
 await browser.close();
 await new Promise(r=>server.close(r));
}
if(failures)process.exit(1);
