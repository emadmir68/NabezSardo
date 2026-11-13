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
const pages={'/all-news':views.archive(db,{}),'/news/lead-story':views.article(db,db.articles[0])};
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
  for(const w of [1440,768,390]){
    const page=await browser.newPage({viewport:{width:w,height:900},locale:'fa-IR',reducedMotion:'reduce'});
    await page.goto(`http://127.0.0.1:${port}${route}`,{waitUntil:'networkidle',timeout:45000});
    const x=await page.evaluate(()=>{
      const q=s=>document.querySelector(s);
      const cs=(s,p)=>{const el=q(s);return el?getComputedStyle(el)[p]:'MISSING'};
      const header=q('[data-ns4-header]');
      // walk header children to find what makes it 103px
      const tall=[];
      if(header)header.querySelectorAll('*').forEach(el=>{const h=el.getBoundingClientRect().height;if(h>60&&tall.length<5)tall.push(el.tagName+'.'+String(el.className).slice(0,30)+'='+Math.round(h));});
      return {
        route:location.pathname,w:innerWidth,
        headerH:header?Math.round(header.getBoundingClientRect().height):null,
        headerTall:tall,
        cardRadius:cs('.grid.news .card','borderRadius'),
        cardBorder:cs('.grid.news .card','borderColor'),
        articleBodyColor:cs('.article-body','color'),
        articleFF:String(cs('.article-body','fontFamily')).slice(0,40),
      };
    });
    console.log(JSON.stringify(x));
    await page.close();
  }
}
await browser.close();server.close();process.exit(0);
