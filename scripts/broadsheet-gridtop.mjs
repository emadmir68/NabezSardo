import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const require=createRequire('/home/z/NabezSardo/package.json');
const views=require('/home/z/NabezSardo/lib/views-v2.js');
const root=path.resolve('public');
const t=Date.now();
const db={settings:{},categories:[{id:'social',name:'اجتماعی'},{id:'incidents',name:'حوادث'},{id:'weather',name:'آب‌وهوا'},{id:'opinion',name:'یادداشت'},{id:'short-news',name:'خبر کوتاه'}],followups:[],
articles:Array.from({length:18},(_,i)=>({id:'v4-'+i,slug:'v4-'+i,status:'published',title:'گزارش ویژه درباره مسائل شهری و تحولات جنوب کرمان '+i,lead:'پیگیری موضوعات مهم',body:'متن',bodyHtml:'<p>متن</p>',categoryId:['social','incidents','weather','opinion','short-news'][i%5],location:i%2?'جیرفت':'ساردوئیه',createdAt:new Date(Date.UTC(2026,9,30,12,i)).toISOString(),views:17-i,image:'/assets/news-cover.svg'}))};
const html=views.home(db);
const server=http.createServer(async(req,res)=>{
  if(req.url==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);return;}
  if(!req.url.startsWith('/assets/')){res.writeHead(404).end();return;}
  const target=path.resolve(root,req.url.slice('/assets/'.length).split('?')[0]);
  const type=target.endsWith('.css')?'text/css':target.endsWith('.js')?'application/javascript':'application/octet-stream';
  try{const b=await fs.readFile(target);res.writeHead(200,{'content-type':type});res.end(b);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const page=await (await chromium.launch({headless:true})).newPage({viewport:{width:1280,height:800},locale:'fa-IR',reducedMotion:'reduce'});
await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'networkidle',timeout:45000});
const x=await page.evaluate(()=>{
  const g=document.querySelector('.pr-grid').getBoundingClientRect();
  const secs=[...document.querySelectorAll('.pr-hero,.pr-feature,.pr-sec,.pr-split,.pr-cats,.pr-cta,.pr-stats,.pr-hero__stage')].map(el=>({c:String(el.className).slice(0,26),top:Math.round(el.getBoundingClientRect().top),h:Math.round(el.getBoundingClientRect().height)}));
  return {gridTop:Math.round(g.top),secs};
});
console.log(JSON.stringify(x,null,1));
process.exit(0);
