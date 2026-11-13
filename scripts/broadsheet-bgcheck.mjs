import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const require=createRequire('/home/z/NabezSardo/package.json');
const views=require('/home/z/NabezSardo/lib/views-v2.js');
const root='/home/z/NabezSardo/public';
const db={settings:{},categories:[{id:'social',name:'اجتماعی'}],articles:[{id:'1',slug:'s',title:'ت',lead:'ل',status:'published',categoryId:'social',createdAt:new Date().toISOString()}]};
const html=views.home(db);
const server=http.createServer(async(req,res)=>{
  if(req.url==='/'){res.writeHead(200,{'content-type':'text/html'});res.end(html);return;}
  if(!req.url.startsWith('/assets/')){res.writeHead(404).end();return;}
  const target=path.join(root,req.url.slice(8).split('?')[0]);
  const type=target.endsWith('.css')?'text/css':'application/octet-stream';
  try{const b=await fs.readFile(target);res.writeHead(200,{'content-type':type});res.end(b);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const page=await (await chromium.launch({headless:true})).newPage({viewport:{width:1440,height:900}});
await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'networkidle'});
const m=await page.evaluate(()=>{
  const chain=[];
  let el=document.body;
  let node=el;
  // effective visual background: walk up until a painted bg found
  let painted=null,cur=document.body;
  while(cur&&cur!==document.documentElement){
    const bg=getComputedStyle(cur).backgroundColor;
    const img=getComputedStyle(cur).backgroundImage;
    if(bg&&bg!=='rgba(0, 0, 0, 0)'){painted={el:cur.tagName+'.'+cur.className,bg};break;}
    if(img&&img!=='none'){painted={el:cur.tagName+'.'+cur.className,bg:img};break;}
    cur=cur.parentElement;
  }
  return {
    bodyClass:document.body.className,
    painted,
    htmlBg:getComputedStyle(document.documentElement).backgroundColor,
    tickerColor:getComputedStyle(document.querySelector('.pr-ticker__track a')).color,
    tickerBg:getComputedStyle(document.querySelector('.pr-ticker__track a')).backgroundColor,
  };
});
console.log(JSON.stringify(m,null,2));
