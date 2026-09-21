import path from "node:path";
import { Buffer } from "node:buffer";

const SCENES={
 education:"modern Iranian school, classroom, books, learning, generic distant students",
 economy:"local market and economy, shops and financial symbolism, no readable money",
 agriculture:"South Kerman orchards, farms and cultivated fields",
 sports:"dynamic local sports training or competition, generic athletes",
 tourism:"beautiful mountains and nature tourism in southern Iran",
 incidents:"professional emergency response with ambulance or rescue vehicles, no victims or gore",
 roads:"Iranian intercity road and road maintenance infrastructure",
 weather:"dramatic realistic weather over mountains and a local Iranian town",
 energy:"modern power grid, solar energy and infrastructure",
 health:"modern hospital or emergency medical setting, generic staff",
 politics:"neutral civic public-affairs setting, government architecture or microphones, no politician likeness",
 culture:"Iranian cultural event, books, art and stage, generic people",
 local:"authentic local life in Sardouiyeh and South Kerman, town and mountain landscape"
};
const COLORS={
 education:["#0a1322","#17365a","#7fb3ff"],economy:["#15100a","#3b2a15","#d7ad5a"],
 agriculture:["#0a150e","#1d3b26","#82bd72"],sports:["#071510","#17402d","#65c68d"],
 tourism:["#071518","#153b41","#61bdb7"],incidents:["#180a0f","#421821","#d85d68"],
 roads:["#15100b","#3a2718","#e1a05d"],weather:["#08141b","#1b374b","#69afd6"],
 energy:["#171409","#3a3215","#e4c157"],health:["#081512","#183a31","#61c0a2"],
 politics:["#170c13","#3b1929","#b95f7d"],culture:["#110d1b","#302248","#a17fd5"],
 local:["#11100d","#302617","#d2aa61"]
};
function text(v="",n=700){return String(v||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,n)}
function theme(a={},c={}){
 const q=(text(a.title)+" "+text(a.lead)+" "+text(c.name)).toLowerCase();
 if(/مدرس|دانش.?آموز|آموزش|دانشگاه|معلم|کلاس/.test(q))return"education";
 if(/بنزین|بانک|کالابرگ|اقتصاد|قیمت|ارز|بازار|سهمیه/.test(q))return"economy";
 if(/کشاورز|کشاورزی|محصول|باغ|مزرعه|سیب|گندم|خرما/.test(q))return"agriculture";
 if(/ورزش|تکواندو|فوتبال|مسابق|قهرمان|مدال/.test(q))return"sports";
 if(/گردشگر|گردشگری|طبیعت|جاذبه|آبشار|کوه/.test(q))return"tourism";
 if(/حادثه|تصادف|آتش|قتل|هشدار|بحران|امداد|اورژانس/.test(q))return"incidents";
 if(/راه|جاده|راهداری|پل|آسفالت|ترافیک/.test(q))return"roads";
 if(/هوا|باران|برف|هواشناسی|دما|طوفان/.test(q))return"weather";
 if(/برق|انرژی|خورشیدی|گاز|نفت|پتروشیمی/.test(q))return"energy";
 if(/سلامت|بهداشت|پزشک|بیمار|درمان|بیمارستان/.test(q))return"health";
 if(/وزیر|دولت|مجلس|استاندار|فرماندار|شورا|سیاسی/.test(q))return"politics";
 if(/فرهنگ|هنر|کتاب|جشنواره|رسانه|شعر/.test(q))return"culture";
 return"local";
}
export function isFallbackSourceImage(raw=""){
 if(!raw)return true;
 try{const u=new URL(String(raw),"https://nabzesardo.ir");const b=path.basename(decodeURIComponent(u.pathname));return !b||b==="placeholder.svg"||b.startsWith("auto-cover-")}catch{const b=path.basename(String(raw));return !b||b==="placeholder.svg"||b.startsWith("auto-cover-")}
}
function prompt(a,c,t){
 return ["Premium photojournalistic editorial image for a local Iranian news website.",SCENES[t]+".","Persian headline: "+text(a.title,260)+".",text(a.lead,500)?"Context: "+text(a.lead,500)+".":"",
 "Realistic professional news photography, natural cinematic lighting, high detail, subject centered for 16:9 crop.",
 "No text, logos, watermark or readable signs. No identifiable real public figures; use generic people. No gore or graphic injury."].filter(Boolean).join(" ");
}
function svg(t){
 const [a,b,c]=COLORS[t]||COLORS.local;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><defs><linearGradient id="b" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><radialGradient id="g"><stop stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient><filter id="x"><feGaussianBlur stdDeviation="40"/></filter></defs><rect width="1200" height="675" fill="url(#b)"/><circle cx="990" cy="110" r="320" fill="url(#g)" filter="url(#x)"/><circle cx="170" cy="610" r="250" fill="url(#g)" filter="url(#x)"/><rect x="55" y="50" width="1090" height="575" rx="42" fill="#fff" fill-opacity=".018" stroke="#fff" stroke-opacity=".1"/><path d="M110 360h220l34-48 44 106 64-210 70 218 54-123 49 57h445" fill="none" stroke="#fff" stroke-opacity=".62" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M110 360h220l34-48 44 106 64-210 70 218 54-123 49 57h445" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M90 560h1020" stroke="${c}" stroke-opacity=".5" stroke-width="2"/></svg>`;
}
export async function ensureSmartCover({article,category,sourceImage,env,getMedia,putMedia,sha256Hex}){
 const src=String(sourceImage||"");
 if(!isFallbackSourceImage(src))return{image:src,imageAuto:false,autoCoverSource:"original",imageWidth:article.imageWidth||null,imageHeight:article.imageHeight||null,imageRatio:article.imageRatio||null,imageOrientation:"landscape"};
 const t=theme(article,category);
 const fp=await sha256Hex(new TextEncoder().encode([text(article.title,260),text(article.lead,500),category?.id||article.categoryId||"",t].join("|")));
 if(article.imageAuto===true&&article.autoCoverFingerprint===fp&&article.image&&await getMedia(path.basename(String(article.image))))return{image:article.image,imageAuto:true,autoCoverSource:article.autoCoverSource||"ai",autoCoverTheme:t,autoCoverFingerprint:fp,imageWidth:1200,imageHeight:675,imageRatio:16/9,imageOrientation:"landscape"};
 const name="ai-cover-"+fp.slice(0,18)+".jpg";
 if(await getMedia(name))return{image:"/uploads/"+name,imageAuto:true,autoCoverSource:"ai",autoCoverTheme:t,autoCoverFingerprint:fp,imageWidth:1200,imageHeight:675,imageRatio:16/9,imageOrientation:"landscape"};
 try{
  if(!env.AI)throw new Error("ai-binding-unavailable");
  const out=await env.AI.run("@cf/black-forest-labs/flux-1-schnell",{prompt:prompt(article,category,t),steps:4});
  const data=Buffer.from(out?.image||"","base64");
  if(data.length<1000)throw new Error("invalid-ai-image");
  await putMedia(name,data,"image/jpeg");
  return{image:"/uploads/"+name,imageAuto:true,autoCoverSource:"ai",autoCoverTheme:t,autoCoverFingerprint:fp,imageWidth:1200,imageHeight:675,imageRatio:16/9,imageOrientation:"landscape"};
 }catch(err){
  console.error("smart-cover-ai",article.slug||article.title,String(err?.message||err));
  const n="smart-cover-"+fp.slice(0,18)+".svg";
  if(!(await getMedia(n)))await putMedia(n,Buffer.from(svg(t),"utf8"),"image/svg+xml");
  return{image:"/uploads/"+n,imageAuto:true,autoCoverSource:"fallback",autoCoverTheme:t,autoCoverFingerprint:fp,imageWidth:1200,imageHeight:675,imageRatio:16/9,imageOrientation:"landscape"};
 }
}
