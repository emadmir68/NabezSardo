// Screenshot harness for the new Digital Broadsheet design.
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url);
const views=require('../lib/views-v2');
const root=path.resolve('public');
const t=Date.now();
const db={
  settings:{},
  categories:[{id:'incidents',name:'حوادث'},{id:'weather',name:'آب‌وهوا'},{id:'social',name:'اجتماعی'},{id:'culture',name:'فرهنگ'},{id:'sports',name:'ورزش'},{id:'agriculture',name:'کشاورزی'},{id:'tourism',name:'گردشگری'},{id:'sardouiyeh',name:'ساردوئیه'},{id:'kerman',name:'کرمان'},{id:'short-news',name:'خبر کوتاه'}],
  followups:[],
  articles:[
    {id:'1',slug:'lead-story',title:'حضور فرماندار جیرفت در گردهمایی کشاورزان دلفارد و بررسی چالش کم‌آبی باغ‌های منطقه',lead:'فرماندار جیرفت با حضور در دلفارد، مهم‌ترین چالش‌های کشاورزان منطقه را از نزدیک بررسی و وعده پیگیری داد.',body:'متن کامل خبر در چند پاراگراف برای صفحه مقاله.\nپاراگراف دوم خبر برای آزمایش قلم‌بندی متن و فاصله‌ها.',status:'published',categoryId:'agriculture',location:'جیرفت',createdAt:new Date(t-30*60000).toISOString(),views:845,image:'/uploads/photo1.jpg'},
    {id:'2',slug:'second',title:'بارش بهاره در جنوب کرمان؛ هشدار نارنجی هواشناسی صادر شد',lead:'هواشناسی از بارش‌های دوباره و وزش باد شدید در جنوب استان خبر داد.',body:'متن',status:'published',categoryId:'weather',location:'کهنوج',createdAt:new Date(t-2*3600000).toISOString(),views:421},
    {id:'3',slug:'third',title:'برنامه‌های هفته کتاب در ساردوئیه آغاز شد',lead:'مراسم افتتاحیه با حضور اهالی فرهنگ و دانش‌آموزان برگزار شد.',body:'متن',status:'published',categoryId:'culture',location:'ساردوئیه',createdAt:new Date(t-5*3600000).toISOString(),views:156},
    {id:'4',slug:'fourth',title:'واژگونی وانت در محور جیرفت–ساردوئیه؛ دو مصدوم به بیمارستان منتقل شدند',lead:'این حادثه صبح امروز رخ داد و نیروهای امدادی در محل حاضر شدند.',body:'متن',status:'published',categoryId:'incidents',location:'جیرفت',createdAt:new Date(t-26*3600000).toISOString(),views:934},
    {id:'5',slug:'fifth',title:'تیم فوتبال ساردوئیه با پیروزی در ضربات پنالتی به فینال راه یافت',lead:'تیم محلی در دیداری نفس‌گیر حریف را شکست داد.',body:'متن',status:'published',categoryId:'sports',location:'ساردوئیه',createdAt:new Date(t-8*3600000).toISOString(),views:299},
    {id:'6',slug:'sixth',title:'اجرای طرح نظارت بر نانوایی‌های جیرفت آغاز شد',lead:'بازرسان صنفت آرد و نان را زیر نظر دارند.',body:'متن',status:'published',categoryId:'social',location:'جیرفت',createdAt:new Date(t-11*3600000).toISOString(),views:76},
    {id:'7',slug:'seventh',title:'افتتاح فاز جدید خیابان عنبرآباد با حضور مسئولان استانی',lead:'',body:'',status:'published',categoryId:'short-news',location:'عنبرآباد',createdAt:new Date(t-90*60000).toISOString(),views:22},
    {id:'8',slug:'eighth',title:'ثبت‌نام گردشگری کویری در فصل جدید باز شد',lead:'تورهای کویرگردی جنوب کرمان از امروز پذیرش دارند.',body:'متن',status:'published',categoryId:'tourism',location:'جنوب کرمان',createdAt:new Date(t-13*3600000).toISOString(),views:187},
    {id:'9',slug:'ninth',title:'بازسازی مدارس روستایی ساردوئیه در دستور کار قرار گرفت',lead:'اعتبار این طرح از محل بودجه توسعه آموزش تأمین می‌شود.',body:'متن',status:'published',categoryId:'sardouiyeh',location:'ساردوئیه',createdAt:new Date(t-17*3600000).toISOString(),views:64},
  ]
};
const pages={
  '/':views.home(db),
  '/news/lead-story':views.article(db,db.articles[0]),
  '/all-news':views.archive(db,{}),
  '/category/weather':views.category(db,db.categories[1]),
  '/send-news':views.simple(db,'send-news'),
};
const server=http.createServer(async(req,res)=>{
  let u;try{u=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end();return;}
  const pathname=decodeURIComponent(u.pathname);
  if(pages[pathname]){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(pages[pathname]);return;}
  if(!pathname.startsWith('/assets/')){res.writeHead(404).end('Not found');return;}
  const rel=pathname.slice('/assets/'.length);
  const target=path.resolve(root,rel);
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const type=target.endsWith('.css')?'text/css':target.endsWith('.js')?'application/javascript':target.endsWith('.svg')?'image/svg+xml':target.endsWith('.png')?'image/png':target.endsWith('.jpg')||target.endsWith('.jpeg')?'image/jpeg':'application/octet-stream';
  try{const b=await fs.readFile(target);res.writeHead(200,{'content-type':type});res.end(b);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;
const browser=await chromium.launch({headless:true});
const outdir='/tmp/broadsheet-shots';
await fs.mkdir(outdir,{recursive:true});
const shots=[
  {name:'home-desktop',route:'/',w:1440,h:900,full:true},
  {name:'home-fold',route:'/',w:1440,h:900,full:false},
  {name:'home-mobile',route:'/',w:390,h:844,full:true},
  {name:'article-desktop',route:'/news/lead-story',w:1440,h:900,full:false},
  {name:'article-mobile',route:'/news/lead-story',w:390,h:844,full:true},
  {name:'archive-desktop',route:'/all-news',w:1440,h:900,full:false},
  {name:'category-mobile',route:'/category/weather',w:390,h:844,full:false},
];
for(const s of shots){
  const page=await browser.newPage({viewport:{width:s.w,height:s.h},locale:'fa-IR',reducedMotion:'reduce',deviceScaleFactor:1});
  await page.goto(`http://127.0.0.1:${port}${s.route}`,{waitUntil:'networkidle',timeout:45000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(350);
  await page.screenshot({path:`${outdir}/${s.name}.png`,fullPage:s.full});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  console.log(`SHOT ${s.name} overflow=${overflow}`);
  await page.close();
}
await browser.close();
server.close();
console.log('DONE');
