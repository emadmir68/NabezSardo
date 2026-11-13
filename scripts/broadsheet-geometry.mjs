// Pure-DOM geometry + style audit for the broadsheet design (no vision needed).
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const require=createRequire('/home/z/NabezSardo/package.json');
const views=require('/home/z/NabezSardo/lib/views-v2.js');
const root=path.resolve('public');
const t=Date.now();
const cats=[{id:'incidents',name:'حوادث'},{id:'weather',name:'آب‌وهوا'},{id:'social',name:'اجتماعی'},{id:'culture',name:'فرهنگ'},{id:'sports',name:'ورزش'},{id:'agriculture',name:'کشاورزی'},{id:'tourism',name:'گردشگری'},{id:'sardouiyeh',name:'ساردوئیه'},{id:'kerman',name:'کرمان'},{id:'short-news',name:'خبر کوتاه'}];
const mk=(id,slug,title,lead,cat,loc,ago,views,img)=>({id,slug,title,lead,body:'متن خبر آزمایشی برای صفحه مقاله. پاراگراف دوم.',status:'published',categoryId:cat,location:loc,createdAt:new Date(t-ago).toISOString(),views,image:img});
const db={settings:{},categories:cats,followups:[],articles:[
 mk('1','lead-story','حضور فرماندار جیرفت در گردهمایی کشاورزان دلفارد و بررسی چالش کم‌آبی باغ‌های منطقه','فرماندار جیرفت با حضور در دلفارد، مهم‌ترین چالش‌های کشاورزان منطقه را از نزدیک بررسی کرد.','agriculture','جیرفت',30*60000,845,'/uploads/photo1.jpg'),
 mk('2','second','بارش بهاره در جنوب کرمان؛ هشدار نارنجی هواشناسی صادر شد','هواشناسی از بارش‌های دوباره و وزش باد شدید در جنوب استان خبر داد.','weather','کهنوج',2*3600000,421),
 mk('3','third','برنامه‌های هفته کتاب در ساردوئیه آغاز شد','مراسم افتتاحیه با حضور اهالی فرهنگ برگزار شد.','culture','ساردوئیه',5*3600000,156),
 mk('4','fourth','واژگونی وانت در محور جیرفت–ساردوئیه؛ دو مصدوم به بیمارستان منتقل شدند','این حادثه صبح امروز رخ داد.','incidents','جیرفت',26*3600000,934),
 mk('5','fifth','تیم فوتبال ساردوئیه با پیروزی در ضربات پنالتی به فینال راه یافت','تیم محلی در دیداری نفس‌گیر حریف را شکست داد.','sports','ساردوئیه',8*3600000,299),
 mk('6','sixth','اجرای طرح نظارت بر نانوایی‌های جیرفت آغاز شد','بازرسان صنفت آرد و نان را زیر نظر دارند.','social','جیرفت',11*3600000,76),
 mk('7','seventh','افتتاح فاز جدید خیابان عنبرآباد با حضور مسئولان استانی','','short-news','عنبرآباد',90*60000,22),
 mk('8','eighth','ثبت‌نام تورهای کویرگردی جنوب کرمان در فصل جدید باز شد','تورهای کویرگردی از امروز پذیرش دارند.','tourism','جنوب کرمان',13*3600000,187),
 mk('9','ninth','بازسازی مدارس روستایی ساردوئیه در دستور کار قرار گرفت','اعتبار طرح از بودجه توسعه آموزش تأمین می‌شود.','sardouiyeh','ساردوئیه',17*3600000,64),
]};
const pages={
  '/':views.home(db),
  '/news/lead-story':views.article(db,db.articles[0]),
  '/all-news':views.archive(db,{}),
  '/category/weather':views.category(db,db.categories[1]),
};
const server=http.createServer(async(req,res)=>{
  let u;try{u=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end();return;}
  const pathname=decodeURIComponent(u.pathname);
  if(pages[pathname]){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(pages[pathname]);return;}
  if(!pathname.startsWith('/assets/')){res.writeHead(404).end();return;}
  const rel=pathname.slice('/assets/'.length);
  const target=path.resolve(root,rel);
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const type=target.endsWith('.css')?'text/css':target.endsWith('.js')?'application/javascript':target.endsWith('.svg')?'image/svg+xml':target.endsWith('.png')?'image/png':'application/octet-stream';
  try{const b=await fs.readFile(target);res.writeHead(200,{'content-type':type});res.end(b);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;
const browser=await chromium.launch({headless:true});
const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
let issues=0;
function rep(ok,msg){console.log((ok?'PASS ':'FAIL ')+msg);if(!ok)issues++;}
for(const [route,html] of Object.entries(pages)){
 for(const size of [{w:1440,h:900},{w:768,h:1024},{w:390,h:844}]){
  const v=size;
  const page=await browser.newPage({viewport:{width:v.w,height:v.h},locale:'fa-IR',reducedMotion:'reduce'});
  await page.goto(`http://127.0.0.1:${port}${route}`,{waitUntil:'networkidle',timeout:45000});
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,30));}scrollTo(0,0);});
  const x=await page.evaluate(vw=>{
    const q=s=>document.querySelector(s);
    const qa=s=>[...document.querySelectorAll(s)];
    const r=s=>q(s)?.getBoundingClientRect();
    const v={vw};
    return {
      scroll:document.documentElement.scrollWidth,
      scrollDetail:(()=>{const w=[];document.querySelectorAll('body *').forEach(el=>{const r=el.getBoundingClientRect();if(r.width>0&&(r.right>innerWidth+3||r.left<-3)&&w.length<5)w.push(el.tagName+'.'+String(el.className).split(' ').slice(0,2).join('.')+'|'+Math.round(r.left)+'..'+Math.round(r.right));});return w})(),
      vw:innerWidth,
      bodyBg:getComputedStyle(document.body).backgroundColor,
      bodyImg:getComputedStyle(document.body).backgroundImage.slice(0,20),
      header:r('[data-ns4-header]'),
      navFits:(()=>{const n=q('.ns4-header-nav');return n?n.scrollWidth<=n.clientWidth+2:null})(),
      ticker:r('.pr-ticker'),
      tickerLinks:qa('.pr-ticker__track a').length,
      dateline:r('.pr-dateline'),
      feature:r('.pr-feature'),
      featureTitle:r('.pr-feature__body h2'),
      featureImg:r('.pr-feature__media img'),
      featureObj:q('.pr-feature__media img')?getComputedStyle(q('.pr-feature__media img')).objectFit:'',
      cards:qa('.pr-card').length,
      cardTitle:r('.pr-card__body h3'),
      cardBody:r('.pr-card__body'),
      stats:qa('.pr-stats [data-count]').length,
      statsZero:qa('.pr-stats [data-count]').some(n=>/^[۰٠0]$/.test(n.textContent.trim())),
      cta:r('.pr-cta'),
      footer:r('.ns4-footer'),
      gridTop:r('.pr-grid')?.top,
      // contrast probes (colors on paper)
      probes:['.pr-hero__copy h1','.pr-hero__lead','.pr-eyebrow','.pr-dateline','.pr-ticker__track a','.pr-feature__body h2','.pr-feature__body p','.pr-card__body h3','.pr-card__body p','.pr-sec__title','.pr-list__item b','.pr-rank b','.pr-cat b','.ns4-footer-grid a','main.page h1','.grid.news .card h3 a'].map(sel=>({sel,color:q(sel)?getComputedStyle(q(sel)).color:null})),
      articleH1:r('.article-head h1'),
      articleBody:r('.article-body'),
      articleBodyColor:q('.article-body')?getComputedStyle(q('.article-body')).color:null,
      articleMeasure:q('.article-body')?getComputedStyle(q('.article-body')).maxWidth:'',
      cardRadius:q('.pr-card')?getComputedStyle(q('.pr-card')).borderRadius:(q('.grid.news .card')?getComputedStyle(q('.grid.news .card')).borderRadius:null),
      headerRadius:q('[data-ns4-header]')?getComputedStyle(q('[data-ns4-header]')).borderRadius:null,
    };
  },v.w);
  const tag=`${route} ${v.w}`;
  rep(x.scroll<=size.w+2,tag+' no horizontal overflow scrollW='+x.scroll+' vw='+size.w+' '+JSON.stringify(x.scrollDetail));
  rep(x.bodyBg.includes('246, 241, 230')&&x.bodyImg==='none',tag+' paper canvas painted');
  rep(x.header&&x.header.height<=90,tag+' header <=90px ('+Math.round(x.header?.height||0)+')');
  if(v.w>1000&&x.navFits!==null)rep(x.navFits,tag+' desktop nav fits');
  if(x.feature){rep(x.feature.height>=250,tag+' feature visible ('+Math.round(x.feature.height)+'px)');rep(x.featureImg&&x.featureImg.height>120,tag+' feature image sized');rep(x.featureObj==='cover',tag+' feature object-fit cover');}
  if(x.featureTitle&&x.feature)rep(x.featureTitle.bottom<=x.feature.bottom+2&&x.featureTitle.top>=x.feature.top-2,tag+' headline inside feature');
  if(x.cards)rep(x.cards>=1,tag+' cards rendered ('+x.cards+')');
  if(x.stats)rep(x.stats===3&&!x.statsZero,tag+' stats visible nonzero');
  if(x.tickerLinks)rep(x.tickerLinks>=1,tag+' ticker items ('+x.tickerLinks+')');
  const paper=[246,241,230];
  for(const p of x.probes){if(p.color){const c=contrast(rgb(p.color),paper);rep(c>=4.5,tag+' contrast '+p.sel+' '+c.toFixed(2));}}
  if(x.articleBody){rep(contrast(rgb(x.articleBodyColor),paper)>=7,tag+' article body AAA contrast');rep(x.articleMeasure.includes('px'),tag+' article measure capped ('+x.articleMeasure+')');}
  rep(x.cardRadius===null||x.cardRadius==='0px',tag+' cards square-cornered');
  rep(x.headerRadius===null||x.headerRadius==='0px',tag+' header square-cornered');
  await page.close();
 }
}
await browser.close();server.close();
console.log(issues===0?'ALL GEOMETRY CHECKS PASSED':'ISSUES: '+issues);
process.exit(0);
