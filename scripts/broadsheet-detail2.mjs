import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const require=createRequire('/home/z/NabezSardo/package.json');
const views=require('/home/z/NabezSardo/lib/views-v2.js');
const root=path.resolve('public');
const t=Date.now();
const db={settings:{},categories:[{id:'social',name:'اجتماعی'},{id:'weather',name:'آب‌وهوا'}],followups:[],
articles:[
 {id:'1',slug:'lead-story',title:'گزارش محلی از جیرفت',lead:'لید',body:'متن',status:'published',categoryId:'social',createdAt:new Date(t-30*60000).toISOString(),views:845,image:'/uploads/photo1.jpg'},
 {id:'2',slug:'s2',title:'خبر دوم',lead:'لید',body:'متن',status:'published',categoryId:'weather',createdAt:new Date(t-2*3600000).toISOString(),views:421},
]};
const pages={'/':views.home(db),'/all-news':views.archive(db,{}),'/news/lead-story':views.article(db,db.articles[0])};
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
for(const route of Object.keys(pages)){
  const page=await browser.newPage({viewport:{width:1440,height:900},locale:'fa-IR',reducedMotion:'reduce'});
  await page.goto(`http://127.0.0.1:${port}${route}`,{waitUntil:'networkidle',timeout:45000});
  const x=await page.evaluate(()=>{
    const q=s=>document.querySelector(s);
    const cs=(s,p)=>{const el=q(s);return el?getComputedStyle(el)[p]:'MISSING'};
    // which stylesheet wins the header radius? check both selectors
    const header=q('[data-ns4-header]');
    return {
      route:location.pathname,
      headerRadius:cs('[data-ns4-header]','borderRadius'),
      headerBg:cs('[data-ns4-header]','backgroundColor'),
      cardRadius:cs('.grid.news .card','borderRadius'),
      prCardRadius:cs('.pr-card','borderRadius'),
      cardPcolor:cs('.pr-card__body p','color'),
      datelineColor:cs('.pr-dateline','color'),
      datelineCount:document.querySelectorAll('.pr-dateline').length,
      headerH:header?Math.round(header.getBoundingClientRect().height):null,
      utilityShown:cs('.ns4-utility','display'),
    };
  });
  console.log(JSON.stringify(x));
  await page.close();
}
await browser.close();server.close();process.exit(0);
