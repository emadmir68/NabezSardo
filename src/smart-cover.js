import path from "node:path";
import { Buffer } from "node:buffer";

/*
 * Automatic covers for stories without a real image.
 * This module intentionally uses deterministic editorial templates only.
 * No generative AI call is made here.
 */
const THEMES={
 education:{label:"EDUCATION",accent:"#79a7ff",accent2:"#d7e6ff",bg1:"#0b1424",bg2:"#182c4b"},
 economy:{label:"ECONOMY",accent:"#d5ac5a",accent2:"#ffe2a3",bg1:"#15110b",bg2:"#332413"},
 agriculture:{label:"AGRICULTURE",accent:"#8fbd68",accent2:"#d9efab",bg1:"#0d170f",bg2:"#203620"},
 sports:{label:"SPORTS",accent:"#67c68a",accent2:"#c7f5d6",bg1:"#0b1713",bg2:"#183b2c"},
 tourism:{label:"TOURISM",accent:"#56b8b0",accent2:"#c8f2ed",bg1:"#091719",bg2:"#173a3d"},
 incidents:{label:"BREAKING",accent:"#dc5e62",accent2:"#ffc0b8",bg1:"#190c10",bg2:"#3d161c"},
 politics:{label:"PUBLIC AFFAIRS",accent:"#b95b78",accent2:"#f3c1cf",bg1:"#180d14",bg2:"#3c1829"},
 culture:{label:"CULTURE",accent:"#9c7bd0",accent2:"#e1d3fa",bg1:"#120e1d",bg2:"#2d2144"},
 roads:{label:"ROADS",accent:"#e09b55",accent2:"#ffe0b3",bg1:"#17110c",bg2:"#3a2615"},
 weather:{label:"WEATHER",accent:"#66a8ce",accent2:"#cdeaff",bg1:"#0a141b",bg2:"#1b3547"},
 energy:{label:"ENERGY",accent:"#e4be52",accent2:"#fff0a8",bg1:"#18150a",bg2:"#3a3114"},
 health:{label:"HEALTH",accent:"#5fc0a2",accent2:"#c5f4e6",bg1:"#0a1714",bg2:"#17382f"},
 local:{label:"LOCAL NEWS",accent:"#d3a85b",accent2:"#f7dda0",bg1:"#12100c",bg2:"#2d2415"},
 social:{label:"SOCIETY",accent:"#5f9fbd",accent2:"#caebf7",bg1:"#0b141a",bg2:"#193445"}
};

function text(v="",n=700){return String(v||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,n)}
function xml(v){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}
function headlineLines(value){
 const words=String(value||"").replace(/\s+/g," ").trim().split(" ");
 const lines=[""];
 for(const word of words){
  const i=lines.length-1,next=lines[i]?lines[i]+" "+word:word;
  if(next.length>24&&lines[i]&&lines.length<2)lines.push(word);
  else lines[i]=next;
 }
 return lines.map(line=>xml(line.length>27?line.slice(0,26).trimEnd()+"…":line));
}

function theme(a={},c={}){
 const id=String(c?.id||a.categoryId||"").toLowerCase();
 if(id==="incidents")return"incidents";
 if(id==="weather")return"weather";
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
 if(id==="agriculture")return"agriculture";
 if(id==="sports")return"sports";
 if(id==="tourism")return"tourism";
 if(id==="culture")return"culture";
 if(id==="social")return"social";
 if(id==="city-village")return"politics";
 return"local";
}

export function isFallbackSourceImage(raw=""){
 if(!raw)return true;
 try{
  const u=new URL(String(raw),"https://nabzesardo.ir");
  const b=path.basename(decodeURIComponent(u.pathname));
  return !b||b==="placeholder.svg"||b.startsWith("auto-cover-");
 }catch{
  const b=path.basename(String(raw));
  return !b||b==="placeholder.svg"||b.startsWith("auto-cover-");
 }
}

function icon(t){
 const x=THEMES[t]||THEMES.local,accent=x.accent,accent2=x.accent2;
 const common='fill="none" stroke="'+accent+'" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"';
 if(t==="education")return '<path '+common+' d="M125 255V142l98-57 98 57v113M158 255v-62h43v62m47 0v-62h43v62M223 85V54m0 0 60 17-60 17"/><path d="M108 274h230" stroke="'+accent2+'" stroke-width="8" stroke-linecap="round" opacity=".45"/>';
 if(t==="economy")return '<rect x="112" y="100" width="235" height="150" rx="22" '+common+'/><path '+common+' d="M112 145h235M145 207h80m35 0h48"/><circle cx="315" cy="115" r="31" fill="'+accent+'" opacity=".18"/>';
 if(t==="agriculture")return '<path '+common+' d="M226 280c0-83 8-144 8-196M230 174c-45-5-78-30-92-68 52-5 86 13 96 54M236 137c43-4 76-27 92-64-49-7-83 9-94 48"/><path d="M110 279c48-25 91-31 124-30 42 0 83 9 121 31" stroke="'+accent2+'" stroke-width="8" opacity=".42" fill="none"/>';
 if(t==="sports")return '<circle cx="230" cy="174" r="91" '+common+'/><path '+common+' d="m230 113 42 31-16 49h-52l-16-49 42-31M188 144l-48-5m116 54 28 39m-80-39-28 39m96-88 46-5"/>';
 if(t==="tourism")return '<circle cx="305" cy="93" r="35" fill="'+accent+'" opacity=".32"/><path '+common+' d="m91 268 91-119 57 67 50-72 88 124"/><path d="M88 268h292" stroke="'+accent2+'" stroke-width="8" stroke-linecap="round" opacity=".4"/>';
 if(t==="incidents")return '<path '+common+' d="M229 72 355 283H103L229 72Z"/><path d="M229 141v70m0 32v2" stroke="'+accent2+'" stroke-width="13" stroke-linecap="round"/>';
 if(t==="roads")return '<path '+common+' d="M148 286c32-62 53-127 81-204 29 77 50 142 83 204"/><path d="M230 91v35m0 30v40m0 31v45" stroke="'+accent2+'" stroke-width="8" stroke-linecap="round" opacity=".7"/>';
 if(t==="weather")return '<circle cx="286" cy="105" r="49" fill="'+accent+'" opacity=".24"/><path '+common+' d="M132 211c0-37 29-67 66-67 25 0 47 13 59 33 9-6 20-9 31-9 31 0 56 25 56 56H132c-19 0-35-15-35-34s16-34 35-34"/><path d="m165 252-16 31m72-31-16 31m72-31-16 31" stroke="'+accent2+'" stroke-width="8" stroke-linecap="round" opacity=".65"/>';
 if(t==="energy")return '<path '+common+' d="m248 64-88 127h68l-25 105 101-145h-70l14-87Z"/><circle cx="230" cy="180" r="128" stroke="'+accent2+'" stroke-width="4" opacity=".14" fill="none"/>';
 if(t==="health")return '<path '+common+' d="M229 282s-105-61-105-133c0-39 27-69 63-69 20 0 35 9 42 25 8-16 24-25 43-25 37 0 64 30 64 69 0 72-107 133-107 133Z"/><path d="M154 181h45l14-30 24 61 19-42 11 11h42" stroke="'+accent2+'" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
 if(t==="politics")return '<path '+common+' d="M112 147h235M135 147v108m55-108v108m78-108v108m55-108v108M103 268h252M117 126l113-55 112 55H117Z"/>';
 if(t==="culture")return '<path '+common+' d="M118 103h89c24 0 40 12 40 38v132c-9-17-24-25-46-25h-83V103Zm224 0h-89c-24 0-40 12-40 38v132c9-17 24-25 46-25h83V103Z"/>';
 return '<path '+common+' d="M104 265h252M133 251V154l97-61 97 61v97M177 251v-69h106v69"/><path d="M118 111c35-27 73-40 112-40 44 0 83 13 116 41" stroke="'+accent2+'" stroke-width="6" opacity=".38" fill="none"/>';
}

function svg(t,title=""){
 const x=THEMES[t]||THEMES.local;
 const lines=headlineLines(title);
 return `<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="675" gradientUnits="userSpaceOnUse"><stop stop-color="#090d14"/><stop offset=".55" stop-color="${x.bg1}"/><stop offset="1" stop-color="${x.bg2}"/></linearGradient>
    <linearGradient id="gold" x1="0" x2="1"><stop stop-color="#8c612f"/><stop offset=".46" stop-color="#f7dda4"/><stop offset="1" stop-color="#ae7a3d"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="${x.accent}" stop-opacity=".26"/><stop offset="1" stop-color="${x.accent}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <circle cx="170" cy="342" r="390" fill="url(#glow)"/>
  <g fill="none" stroke="#f3d99e" opacity=".14"><circle cx="92" cy="340" r="255"/><circle cx="92" cy="340" r="299"/><circle cx="92" cy="340" r="343"/></g>
  <path d="M0 525C260 414 396 549 624 470S992 402 1200 462" fill="none" stroke="${x.accent}" stroke-opacity=".18" stroke-width="2"/>
  <rect x="35" y="35" width="1130" height="605" rx="28" fill="none" stroke="#e9c985" stroke-opacity=".36"/>
  <rect x="49" y="49" width="1102" height="577" rx="20" fill="none" stroke="#ffffff" stroke-opacity=".07"/>
  <path d="M81 35h155M964 640h155" stroke="url(#gold)" stroke-width="4"/>
  <g transform="translate(70 148) scale(.82)" opacity=".6">${icon(t)}</g>
  <path d="M112 394h106l30-51 42 107 55-150 45 114 32-38h104" fill="none" stroke="#25180d" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M112 394h106l30-51 42 107 55-150 45 114 32-38h104" fill="none" stroke="url(#gold)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="826" y="83" width="294" height="55" rx="27.5" fill="#ffffff" fill-opacity=".05" stroke="#e8c788" stroke-opacity=".4"/>
  <text x="1094" y="120" text-anchor="end" direction="rtl" font-family="DejaVu Sans, sans-serif" font-size="24" font-weight="700" fill="#f8e8c8">نبض ساردو</text>
  <text x="1098" y="207" text-anchor="end" font-family="Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="3" fill="${x.accent2}">${x.label}</text>
  <path d="M620 227h478" stroke="url(#gold)" stroke-width="2" opacity=".75"/>
  ${lines.map((line,i)=>`<text x="1098" y="${302+i*82}" text-anchor="end" direction="rtl" font-family="DejaVu Sans, sans-serif" font-size="43" font-weight="700" fill="#fff8ee">${line}</text>`).join("")}
  <path d="M620 522h478" stroke="#e9c985" stroke-opacity=".3"/>
  <text x="1098" y="574" text-anchor="end" direction="rtl" font-family="DejaVu Sans, sans-serif" font-size="19" fill="#e2d4bd">رسانه محلی ساردوئیه و جنوب کرمان</text>
  <text x="86" y="581" font-family="Arial, sans-serif" font-size="18" letter-spacing="3" fill="#ead1a2">NABEZ SARDO</text>
 </svg>`;
}

export async function ensureSmartCover({article,category,sourceImage,getMedia,putMedia,sha256Hex}){
 const src=String(sourceImage||"");
 if(!isFallbackSourceImage(src))return{image:src,imageAuto:false,autoCoverSource:"original",imageWidth:article.imageWidth||null,imageHeight:article.imageHeight||null,imageRatio:article.imageRatio||null,imageOrientation:"landscape"};
 const t=theme(article,category);
 const fp=await sha256Hex(new TextEncoder().encode([text(article.title,260),text(article.lead,500),category?.id||article.categoryId||"",t,"template-v2"].join("|")));
 if(article.imageAuto===true&&article.autoCoverSource==="template"&&article.autoCoverFingerprint===fp&&article.image&&await getMedia(path.basename(String(article.image)))){
  return{image:article.image,imageAuto:true,autoCoverSource:"template",autoCoverTheme:t,autoCoverFingerprint:fp,imageWidth:1200,imageHeight:675,imageRatio:16/9,imageOrientation:"landscape"};
 }
 const name="auto-cover-"+fp.slice(0,18)+".svg";
 if(!(await getMedia(name)))await putMedia(name,Buffer.from(svg(t,article.title),"utf8"),"image/svg+xml");
 return{image:"/uploads/"+name,imageAuto:true,autoCoverSource:"template",autoCoverTheme:t,autoCoverFingerprint:fp,imageWidth:1200,imageHeight:675,imageRatio:16/9,imageOrientation:"landscape"};
}
