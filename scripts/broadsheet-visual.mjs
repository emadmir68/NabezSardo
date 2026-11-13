// Numeric visual QA (model has no vision): luminance bands + ink coverage per page region.
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const require=createRequire('/home/z/NabezSardo/package.json');
const views=require('/home/z/NabezSardo/lib/views-v2.js');
const root=path.resolve('public');
const t=Date.now();
const cats=[{id:'incidents',name:'حوادث'},{id:'weather',name:'آب‌وهوا'},{id:'social',name:'اجتماعی'},{id:'culture',name:'فرهنگ'},{id:'short-news',name:'خبر کوتاه'}];
const mk=(id,slug,title,lead,cat,ago,views)=>({id,slug,title,lead,body:'متن خبر. پاراگراف دوم.',status:'published',categoryId:cat,createdAt:new Date(t-ago).toISOString(),views});
const db={settings:{},categories:cats,followups:[],articles:[
 mk('1','lead-story','حضور فرماندار جیرفت در گردهمایی کشاورزان دلفارد و بررسی چالش کم‌آبی باغ‌های منطقه','فرماندار جیرفت با حضور در دلفارد، چالش‌های کشاورزان را بررسی کرد.','weather',30*60000,845),
 mk('2','s2','بارش بهاره در جنوب کرمان؛ هشدار نارنجی هواشناسی صادر شد','هواشناسی هشدار داد.','incidents',2*3600000,421),
 mk('3','s3','برنامه‌های هفته کتاب در ساردوئیه آغاز شد','افتتاحیه برگزار شد.','culture',5*3600000,156),
 mk('4','s4','خبر کوتاه: افتتاح خیابان عنبرآباد','','short-news',90*60000,22),
 mk('5','s5','اجرای طرح نظارت بر نانوایی‌های جیرفت آغاز شد','بازرسی آغاز شد.','social',11*3600000,76),
]};
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
for(const route of Object.keys(pages)){
  const page=await browser.newPage({viewport:{width:1440,height:900},locale:'fa-IR',reducedMotion:'reduce'});
  await page.goto(`http://127.0.0.1:${port}${route}`,{waitUntil:'networkidle',timeout:45000});
  await page.evaluate(()=>document.fonts.ready);
  // band luminance + "ink" (dark pixel) coverage per horizontal band of the fold
  const x=await page.evaluate(()=>{
    const q=s=>document.querySelector(s);
    const probe=(el)=>{
      if(!el)return null;
      const cs=getComputedStyle(el);
      return {color:cs.color,bg:cs.backgroundColor,fs:cs.fontSize,ff:String(cs.fontFamily).split(',')[0],w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)};
    };
    return {
      route:location.pathname,
      masthead:probe(q('.pr-dateline__paper')),
      h1:probe(q('.pr-hero__copy h1')),
      featureH2:probe(q('.pr-feature__body h2')),
      featureBadge:probe(q('.pr-feature__badge')),
      tickerTag:probe(q('.pr-ticker__tag')),
      secTitle:probe(q('.pr-sec__title')),
      articleH1:probe(q('.article-head h1')),
      articleBodyP:probe(q('.article-body p')),
      articleDeck:probe(q('.article-deck')),
      // font actually used for headline (first non-generic)
      headlineFont:String(getComputedStyle(q('.pr-feature__body h2')||q('.article-head h1')).fontFamily),
    };
  });
  console.log(JSON.stringify(x,null,1));
  await page.screenshot({path:'/tmp/broadsheet-shots/final'+route.replace('/','-')+'-1440.png'});
  await page.close();
}
await browser.close();server.close();process.exit(0);
