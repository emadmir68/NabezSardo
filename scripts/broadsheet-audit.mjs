import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url);
const views=require('/home/z/NabezSardo/lib/views-v2.js');
const root='/home/z/NabezSardo/public';
const t=Date.now();
const db={settings:{},categories:[{id:'incidents',name:'حوادث'},{id:'weather',name:'آب‌وهوا'},{id:'social',name:'اجتماعی'},{id:'culture',name:'فرهنگ'},{id:'short-news',name:'خبر کوتاه'}],followups:[],
articles:[
 {id:'1',slug:'lead-story',title:'حضور فرماندار جیرفت در گردهمایی کشاورزان دلفارد و بررسی چالش کم‌آبی باغ‌های منطقه',lead:'فرماندار جیرفت با حضور در دلفارد، مهم‌ترین چالش‌های کشاورزان منطقه را از نزدیک بررسی کرد.',body:'متن خبر',status:'published',categoryId:'incidents',location:'جیرفت',createdAt:new Date(t-30*60000).toISOString(),views:845,image:'/uploads/photo1.jpg'},
 {id:'2',slug:'second',title:'بارش بهاره در جنوب کرمان',lead:'هشدار هواشناسی',body:'متن',status:'published',categoryId:'weather',createdAt:new Date(t-2*3600000).toISOString(),views:421},
 {id:'3',slug:'third',title:'برنامه‌های هفته کتاب در ساردوئیه آغاز شد',lead:'مراسم افتتاحیه برگزار شد.',body:'متن',status:'published',categoryId:'culture',createdAt:new Date(t-5*3600000).toISOString(),views:156},
]};
const html=views.home(db);
const server=http.createServer(async(req,res)=>{
  let u;try{u=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end();return;}
  if(u.pathname==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);return;}
  if(!u.pathname.startsWith('/assets/')){res.writeHead(404).end();return;}
  const target=path.join(root,u.pathname.slice('/assets/'.length));
  const type=target.endsWith('.css')?'text/css':target.endsWith('.js')?'application/javascript':'application/octet-stream';
  try{const b=await fs.readFile(target);res.writeHead(200,{'content-type':type});res.end(b);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;
const browser=await chromium.launch({headless:true});
const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
for(const v of [{w:1440,h:900},{w:390,h:844}]){
  const page=await browser.newPage({viewport:{width:v.w,height:v.h},locale:'fa-IR',reducedMotion:'reduce'});
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'networkidle',timeout:45000});
  await page.evaluate(()=>document.fonts.ready);
  const m=await page.evaluate(()=>{
    const q=s=>document.querySelector(s);
    const cs=s=>q(s)?getComputedStyle(q(s)):null;
    const bodyBg=cs('body').backgroundColor;
    const pairs=[
      ['.pr-hero__copy h1'],['.pr-hero__lead'],['.pr-eyebrow'],['.pr-dateline'],
      ['.pr-ticker__track a'],['.pr-feature__body h2'],['.pr-feature__body p'],
      ['.pr-card__body h3'],['.pr-card__body p'],['.pr-card__foot em'],
      ['.pr-sec__title'],['.pr-list__item b'],['.pr-rank b'],['.pr-cat b'],
    ];
    return {
      bodyBg,
      pairs:pairs.map(([sel])=>{
        const el=q(sel);const c=el?getComputedStyle(el).color:null;
        return {sel,color:c,fs:el?getComputedStyle(el).fontSize:null,ff:el?String(getComputedStyle(el).fontFamily).slice(0,40):null};
      }),
      headerBg:cs('.site-capsule')?.backgroundColor,
      fonts:[...new Set([...document.querySelectorAll('h1,h2,h3,.pr-card__body h3,.pr-feature__body h2')].map(x=>getComputedStyle(x).fontFamily.split(',')[0]))],
      overflow:document.documentElement.scrollWidth-innerWidth,
      featureImg:q('.pr-feature__media img')?.getBoundingClientRect()?.height,
      cardCount:document.querySelectorAll('.pr-card').length,
    };
  });
  console.log('=== '+v.w+' ===');
  console.log('bodyBg',m.bodyBg,'headerBg',m.headerBg,'overflow',m.overflow,'featureImgH',m.featureImg,'cards',m.cardCount);
  console.log('headFonts',JSON.stringify(m.fonts));
  const bg=rgb(m.bodyBg);
  for(const p of m.pairs){console.log((contrast(rgb(p.color),bg)).toFixed(2)+'  '+p.sel+'  '+(p.fs||'')+'  '+(p.ff||''));}
  await page.close();
}
await browser.close();server.close();
