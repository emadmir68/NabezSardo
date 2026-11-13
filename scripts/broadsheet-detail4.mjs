// At 768/390: which rule gives header non-zero radius? and article AAA color source.
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const require=createRequire('/home/z/NabezSardo/package.json');
const views=require('/home/z/NabezSardo/lib/views-v2.js');
const root=path.resolve('public');
const t=Date.now();
const db={settings:{},categories:[{id:'social',name:'اجتماعی'}],followups:[],
articles:[{id:'1',slug:'lead-story',title:'گزارش',lead:'لید',body:'متن',status:'published',categoryId:'social',createdAt:new Date(t-60000).toISOString(),views:5}]};
const pages={'/':views.home(db),'/news/lead-story':views.article(db,db.articles[0])};
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
for(const [route,w] of [['/',768],['/',390],['/news/lead-story',1440],['/news/lead-story',390]]){
  const page=await browser.newPage({viewport:{width:w,height:900},locale:'fa-IR',reducedMotion:'reduce'});
  await page.goto(`http://127.0.0.1:${port}${route}`,{waitUntil:'networkidle',timeout:45000});
  const x=await page.evaluate(()=>{
    const header=document.querySelector('[data-ns4-header]');
    const body=document.querySelector('.article-body');
    return {
      route:location.pathname,w:innerWidth,
      headerRadius:header?getComputedStyle(header).borderRadius:'MISSING',
      articleColor:body?getComputedStyle(body).color:'MISSING',
      articleFont:body?String(getComputedStyle(body).fontFamily).slice(0,40):'MISSING',
    };
  });
  console.log(JSON.stringify(x));
  await page.close();
}
await browser.close();server.close();process.exit(0);
