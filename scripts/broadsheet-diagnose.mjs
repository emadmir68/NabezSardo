// Diagnose specific computed styles behind the failing checks.
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const require=createRequire('/home/z/NabezSardo/package.json');
const views=require('/home/z/NabezSardo/lib/views-v2.js');
const root=path.resolve('public');
const t=Date.now();
const db={settings:{},categories:[{id:'social',name:'اجتماعی'},{id:'incidents',name:'حوادث'},{id:'weather',name:'آب‌وهوا'}],followups:[],
articles:[
 {id:'1',slug:'lead-story',title:'گزارش محلی از جیرفت با عنوان بلند آزمایشی برای بررسی دقیق قلم سرمقاله‌ای',lead:'لید گزارش محلی.',body:'متن خبر آزمایشی.',status:'published',categoryId:'social',location:'جیرفت',createdAt:new Date(t-30*60000).toISOString(),views:845,image:'/uploads/photo1.jpg'},
 {id:'2',slug:'s2',title:'خبر دوم',lead:'لید',body:'متن',status:'published',categoryId:'weather',createdAt:new Date(t-2*3600000).toISOString(),views:421},
 {id:'3',slug:'s3',title:'خبر سوم',lead:'لید',body:'متن',status:'published',categoryId:'incidents',createdAt:new Date(t-5*3600000).toISOString(),views:156},
]};
const pages={'/':views.home(db),'/news/lead-story':views.article(db,db.articles[0]),'/all-news':views.archive(db,{})};
const server=http.createServer(async(req,res)=>{
  let u;try{u=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end();return;}
  const pathname=decodeURIComponent(u.pathname);
  if(pages[pathname]){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(pages[pathname]);return;}
  if(!pathname.startsWith('/assets/')){res.writeHead(404).end();return;}
  const target=path.resolve(root,pathname.slice('/assets/'.length).split('?')[0]);
  const type=target.endsWith('.css')?'text/css':target.endsWith('.js')?'application/javascript':'application/octet-stream';
  try{const b=await fs.readFile(target);res.writeHead(200,{'content-type':type});res.end(b);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;
const browser=await chromium.launch({headless:true});
for(const route of ['/','/news/lead-story','/all-news']){
  const page=await browser.newPage({viewport:{width:1440,height:900},locale:'fa-IR',reducedMotion:'reduce'});
  await page.goto(`http://127.0.0.1:${port}${route}`,{waitUntil:'networkidle',timeout:45000});
  const x=await page.evaluate(()=>{
    const q=s=>document.querySelector(s);
    const cs=(s,p)=>{const el=q(s);return el?getComputedStyle(el)[p]:null};
    // find overflow sources
    const wide=[];
    document.querySelectorAll('*').forEach(el=>{
      const r=el.getBoundingClientRect();
      if(r.right>innerWidth+3||r.left<-3){
        if(wide.length<6)wide.push(el.tagName+'.'+String(el.className).slice(0,40)+' L'+Math.round(el.getBoundingClientRect().left)+' R'+Math.round(el.getBoundingClientRect().right));
      }
    });
    return {
      route:location.pathname,
      bodyBg:getComputedStyle(document.body).backgroundColor,
      bodyImg:getComputedStyle(document.body).backgroundImage.slice(0,30),
      overflowEls:wide,
      featureBodyH2Color:cs('.pr-feature__body h2','color'),
      featureBodyParentBg:cs('.pr-feature__body','backgroundColor'),
      eyebrowColor:cs('.pr-eyebrow','color'),
      cardPRadius:cs('.pr-card','borderRadius'),
      cardGBRadius:cs('.grid.news .card','borderRadius'),
      innerH1Color:cs('main.page h1','color'),
      innerH1Bg:cs('main.page','backgroundColor'),
      cardH3Color:cs('.grid.news .card h3 a','color'),
      cardGBg:cs('.grid.news .card','backgroundColor'),
      cardPadColor:cs('.grid.news .card .pad','backgroundColor'),
      footerLinkColor:cs('.ns4-footer-grid a','color'),
      footerBg:cs('.ns4-footer','backgroundColor'),
      articleBodyColor:cs('.article-body','color'),
      articleBodyBg:cs('.article-body','backgroundColor'),
      articleBodyFF:cs('.article-body','fontFamily'),
    };
  });
  console.log(JSON.stringify(x,null,1));
  await page.close();
}
await browser.close();server.close();process.exit(0);
