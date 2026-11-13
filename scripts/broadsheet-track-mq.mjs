// Find which rules cause overflow at 1440 on / and where the inner-page accents hide.
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const require=createRequire('/home/z/NabezSardo/package.json');
const views=require('/home/z/NabezSardo/lib/views-v2.js');
const root=path.resolve('public');
const t=Date.now();
const db={settings:{},categories:[{id:'social',name:'اجتماعی'},{id:'weather',name:'آب‌وهوا'},{id:'incidents',name:'حوادث'},{id:'short-news',name:'خبر کوتاه'}],followups:[],
articles:Array.from({length:10},(_,i)=>({id:String(i),slug:'story-'+i,title:'خبر آزمایشی شماره '+i,lead:'لید خبر',body:'متن',status:'published',categoryId:['social','weather','incidents'][i%3],createdAt:new Date(t-i*3600000).toISOString(),views:100-i}))};
const pages={'/':views.home(db),'/all-news':views.archive(db,{}),'/category/social':views.category(db,db.categories[0])};
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
      const wide=[];
      document.querySelectorAll('body *').forEach(el=>{
        const r=el.getBoundingClientRect();
        if(r.width>0&&(r.right>innerWidth+3||r.left<-3)&&wide.length<8){
          wide.push({d:el.tagName+'.'+String(el.className).split(' ').slice(0,3).join('.'),L:Math.round(r.left),R:Math.round(r.right)});
        }
      });
      return {w:innerWidth,scrollW:document.documentElement.scrollWidth,wide};
    });
    console.log(route,w,'scrollW='+x.scrollW,JSON.stringify(x.wide));
    await page.close();
  }
}
await browser.close();server.close();process.exit(0);
