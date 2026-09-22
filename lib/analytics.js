const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const DATA_DIR=process.env.DATA_DIR||path.join(__dirname,'..','data');
const FILE=path.join(DATA_DIR,'analytics.json');
fs.mkdirSync(DATA_DIR,{recursive:true});

function empty(){return {version:2,startedAt:new Date().toISOString(),allTimePageViews:0,days:{}};}
function load(){
  try{
    if(!fs.existsSync(FILE))return empty();
    const data=JSON.parse(fs.readFileSync(FILE,'utf8'));
    if(!data||typeof data!=='object')return empty();
    data.version=2;
    data.startedAt=data.startedAt||new Date().toISOString();
    data.days=data.days&&typeof data.days==='object'?data.days:{};
    const savedTotal=Number(data.allTimePageViews);
    data.allTimePageViews=Number.isFinite(savedTotal)&&savedTotal>=0?savedTotal:Object.values(data.days).reduce((sum,d)=>sum+Number(d&&d.pageViews||0),0);
    return data;
  }catch{return empty();}
}
let data=load();

function save(){
  try{
    const tmp=FILE+'.tmp';
    fs.writeFileSync(tmp,JSON.stringify(data),'utf8');
    fs.renameSync(tmp,FILE);
  }catch(err){console.warn('analytics-save-failed',err.message);}
}
function dayKey(date=new Date()){
  try{
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const p=Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    return p.year+'-'+p.month+'-'+p.day;
  }catch{return date.toISOString().slice(0,10);}
}
function recentKeys(count=7){
  const out=[];
  const now=new Date();
  for(let i=count-1;i>=0;i--)out.push(dayKey(new Date(now.getTime()-i*86400000)));
  return out;
}
function isBot(ua=''){
  return /(bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|preview|headless|lighthouse|pagespeed|uptime|monitor|nabezsardo-cloudflare-sync|cloudflare-sync)/i.test(String(ua));
}
function isTrackablePath(p=''){
  if(!p||!p.startsWith('/'))return false;
  if(/^\/(?:admin(?:\/|$)|assets\/|uploads\/|health$|robots\.txt$|sitemap\.xml$|news-sitemap\.xml$|feed\.xml$|hero-mosque\.jpg$|__hero_seed_)/.test(p))return false;
  return /^\/$|^\/all-news$|^\/search$|^\/about$|^\/contact$|^\/send-news$|^\/news\/|^\/category\/|^\/local\//.test(p);
}
function refHost(req){
  const raw=String(req.headers.referer||req.headers.referrer||'').trim();
  if(!raw)return '';
  try{return new URL(raw).hostname.toLowerCase().replace(/^www\./,'');}catch{return '';}
}
function visitorHash(req){
  const forwarded=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();
  const ip=String(req.headers['cf-connecting-ip']||forwarded||req.socket?.remoteAddress||'');
  const ua=String(req.headers['user-agent']||'');
  return crypto.createHash('sha256').update(ip+'|'+ua+'|nabez-first-party-analytics-v1').digest('hex').slice(0,24);
}
function ensureDay(key){
  const d=data.days[key]||(data.days[key]={pageViews:0,googleEntrances:0,externalEntrances:0,directEntrances:0,visitors:{},paths:{},sources:{},lastAt:null});
  d.pageViews=Number(d.pageViews||0);
  d.googleEntrances=Number(d.googleEntrances||0);
  d.externalEntrances=Number(d.externalEntrances||0);
  d.directEntrances=Number(d.directEntrances||0);
  d.visitors=d.visitors&&typeof d.visitors==='object'?d.visitors:{};
  d.paths=d.paths&&typeof d.paths==='object'?d.paths:{};
  d.sources=d.sources&&typeof d.sources==='object'?d.sources:{};
  return d;
}
function prune(keep=45){
  const allowed=new Set(recentKeys(keep));
  for(const key of Object.keys(data.days))if(!allowed.has(key))delete data.days[key];
}
function track(req,pathname){
  if(req.method!=='GET'||!isTrackablePath(pathname))return false;
  const ua=String(req.headers['user-agent']||'');
  if(!ua||isBot(ua))return false;
  const key=dayKey(),d=ensureDay(key);
  d.pageViews++;
  data.allTimePageViews=Number(data.allTimePageViews||0)+1;
  d.lastAt=new Date().toISOString();
  d.visitors[visitorHash(req)]=1;
  const cleanPath=String(pathname||'/').slice(0,700);
  d.paths[cleanPath]=Number(d.paths[cleanPath]||0)+1;
  const host=refHost(req);
  let utmSource='';
  try{utmSource=String(new URL(req.url,'https://nabzesardo.ir').searchParams.get('utm_source')||'').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,40);}catch{}
  if(utmSource){
    d.sources[utmSource]=Number(d.sources[utmSource]||0)+1;
    d.externalEntrances++;
    if(utmSource==='google')d.googleEntrances++;
  }else{
    const internal=!host||host==='nabzesardo.ir'||host.endsWith('.nabzesardo.ir')||host.endsWith('.up.railway.app');
    if(!host)d.directEntrances++;
    else if(!internal){
      d.externalEntrances++;
      if(/(^|\.)google\.[a-z.]+$/i.test(host))d.googleEntrances++;
    }
  }
  prune();
  save();
  return true;
}
function snapshot(){
  const keys=recentKeys(7);
  const days=keys.map(key=>{
    const d=ensureDay(key);
    return {date:key,pageViews:d.pageViews,visitors:Object.keys(d.visitors).length,googleEntrances:d.googleEntrances};
  });
  const todayKey=keys[keys.length-1],today=ensureDay(todayKey);
  const topPaths=Object.entries(today.paths).map(([path,views])=>({path,views:Number(views||0)})).sort((a,b)=>b.views-a.views).slice(0,8);
  return {
    totalPageViews:Number(data.allTimePageViews||0),
    startedAt:data.startedAt,
    updatedAt:today.lastAt||data.startedAt,
    todayKey,
    today:{pageViews:today.pageViews,visitors:Object.keys(today.visitors).length,googleEntrances:today.googleEntrances,externalEntrances:today.externalEntrances,directEntrances:today.directEntrances,sources:{...today.sources}},
    sevenDays:{pageViews:days.reduce((s,x)=>s+x.pageViews,0),visitors:days.reduce((s,x)=>s+x.visitors,0),googleEntrances:days.reduce((s,x)=>s+x.googleEntrances,0)},
    days,topPaths
  };
}
module.exports={track,snapshot,isTrackablePath,dayKey,FILE};
