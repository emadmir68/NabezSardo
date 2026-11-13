// Article page still dark (~100 mean). Find the dark painter on article route.
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
articles:[{id:'1',slug:'lead-story',title:'گزارش',lead:'لید',body:'متن',status:'published',categoryId:'social',createdAt:new Date(t-60000).toISOString(),views:5,image:'/uploads/photo1.jpg'}]};
const html=views.article(db,db.articles[0]);
const server=http.createServer(async(req,res)=>{
  let u;try{u=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end();return;}
  if(u.pathname==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);return;}
  if(!u.pathname.startsWith('/assets/')){res.writeHead(404).end();return;}
  const target=path.resolve(root,u.pathname.slice('/assets/'.length).split('?')[0]);
  const type=target.endsWith('.css')?'text/css':target.endsWith('.js')?'application/javascript':'application/octet-stream';
  try{const b=await fs.readFile(target);res.writeHead(200,{'content-type':type});res.end(b);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},locale:'fa-IR',reducedMotion:'reduce'});
await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'networkidle',timeout:45000});
const x=await page.evaluate(()=>{
  const painters=[];
  document.querySelectorAll('body, body *').forEach(el=>{
    const cs=getComputedStyle(el);
    const bg=cs.backgroundColor;
    const img=cs.backgroundImage;
    const r=el.getBoundingClientRect();
    if(r.width>600&&r.height>300){
      if(bg&&bg!=='rgba(0, 0, 0, 0)')painters.push({d:el.tagName+'.'+String(el.className).slice(0,36),bg});
      if(img&&img!=='none')painters.push({d:el.tagName+'.'+String(el.className).slice(0,36),bg:String(img).slice(0,60)});
    }
  });
  return {painters:painters.slice(0,10)};
});
console.log(JSON.stringify(x,null,1));
await browser.close();server.close();process.exit(0);
