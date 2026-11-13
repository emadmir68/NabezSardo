// Inspect WHY ns4-header-inner is 101-105px under 900px: dump computed flex/height of its children.
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
articles:[{id:'1',slug:'s',title:'خبر',lead:'لید',body:'متن',status:'published',categoryId:'social',createdAt:new Date(t-60000).toISOString(),views:5}]};
const html=views.archive(db,{});
const server=http.createServer(async(req,res)=>{
  let u;try{u=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end();return;}
  if(u.pathname==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);return;}
  if(!u.pathname.startsWith('/assets/')){res.writeHead(404).end();return;}
  const target=path.resolve(root,u.pathname.slice('/assets/'.length).split('?')[0]);
  const type=target.endsWith('.css')?'text/css':'application/octet-stream';
  try{const b=await fs.readFile(target);res.writeHead(200,{'content-type':type});res.end(b);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:768,height:900},locale:'fa-IR',reducedMotion:'reduce'});
await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'networkidle',timeout:45000});
const x=await page.evaluate(()=>{
  const inner=document.querySelector('.ns4-header-inner');
  const cs=getComputedStyle(inner);
  const kids=[...inner.children].map(el=>({
    d:el.tagName+'.'+String(el.className).slice(0,28),
    h:Math.round(el.getBoundingClientRect().height),
    display:getComputedStyle(el).display,
    minH:getComputedStyle(el).minHeight,
    pad:getComputedStyle(el).padding,
  }));
  return {innerH:Math.round(inner.getBoundingClientRect().height),flex:cs.flexDirection,wrap:cs.flexWrap,minH:cs.minHeight,padBlock:cs.paddingBlock,kids};
});
console.log(JSON.stringify(x,null,1));
await browser.close();server.close();process.exit(0);
