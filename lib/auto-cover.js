const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {UPLOAD_DIR}=require('./store');

const THEMES={
  education:{label:'EDUCATION',accent:'#79a7ff',accent2:'#d7e6ff',bg1:'#0b1424',bg2:'#182c4b'},
  economy:{label:'ECONOMY',accent:'#d5ac5a',accent2:'#ffe2a3',bg1:'#15110b',bg2:'#332413'},
  agriculture:{label:'AGRICULTURE',accent:'#8fbd68',accent2:'#d9efab',bg1:'#0d170f',bg2:'#203620'},
  sports:{label:'SPORTS',accent:'#67c68a',accent2:'#c7f5d6',bg1:'#0b1713',bg2:'#183b2c'},
  tourism:{label:'TOURISM',accent:'#56b8b0',accent2:'#c8f2ed',bg1:'#091719',bg2:'#173a3d'},
  incidents:{label:'BREAKING',accent:'#dc5e62',accent2:'#ffc0b8',bg1:'#190c10',bg2:'#3d161c'},
  politics:{label:'PUBLIC AFFAIRS',accent:'#b95b78',accent2:'#f3c1cf',bg1:'#180d14',bg2:'#3c1829'},
  culture:{label:'CULTURE',accent:'#9c7bd0',accent2:'#e1d3fa',bg1:'#120e1d',bg2:'#2d2144'},
  roads:{label:'ROADS',accent:'#e09b55',accent2:'#ffe0b3',bg1:'#17110c',bg2:'#3a2615'},
  weather:{label:'WEATHER',accent:'#66a8ce',accent2:'#cdeaff',bg1:'#0a141b',bg2:'#1b3547'},
  energy:{label:'ENERGY',accent:'#e4be52',accent2:'#fff0a8',bg1:'#18150a',bg2:'#3a3114'},
  health:{label:'HEALTH',accent:'#5fc0a2',accent2:'#c5f4e6',bg1:'#0a1714',bg2:'#17382f'},
  local:{label:'LOCAL NEWS',accent:'#d3a85b',accent2:'#f7dda0',bg1:'#12100c',bg2:'#2d2415'},
  social:{label:'SOCIETY',accent:'#5f9fbd',accent2:'#caebf7',bg1:'#0b141a',bg2:'#193445'}
};

function text(v=''){return String(v||'').replace(/\s+/g,' ').trim();}
function detectTheme(article={},category={}){
  const q=(text(article.title)+' '+text(article.lead)+' '+text(category.name)).toLowerCase();
  if(/مدرس|دانش.?آموز|آموزش|دانشگاه|معلم|کلاس/.test(q))return 'education';
  if(/بنزین|بانک|کالابرگ|اقتصاد|قیمت|ارز|بازار|سهمیه/.test(q))return 'economy';
  if(/کشاورز|کشاورزی|محصول|باغ|مزرعه|سیب|گندم|خرما/.test(q))return 'agriculture';
  if(/ورزش|تکواندو|فوتبال|مسابق|قهرمان|مدال/.test(q))return 'sports';
  if(/گردشگر|گردشگری|طبیعت|جاذبه|آبشار|کوه/.test(q))return 'tourism';
  if(/حادثه|تصادف|آتش|قتل|هشدار|بحران|امداد/.test(q))return 'incidents';
  if(/راه|جاده|راهداری|پل|آسفالت|ترافیک/.test(q))return 'roads';
  if(/هوا|باران|برف|هواشناسی|دما|طوفان/.test(q))return 'weather';
  if(/برق|انرژی|خورشیدی|گاز|نفت|پتروشیمی/.test(q))return 'energy';
  if(/سلامت|بهداشت|پزشک|بیمار|درمان|بیمارستان/.test(q))return 'health';
  if(/وزیر|دولت|مجلس|استاندار|فرماندار|شورا|سیاسی/.test(q))return 'politics';
  if(/فرهنگ|هنر|کتاب|جشنواره|رسانه|شعر/.test(q))return 'culture';
  const id=String(category.id||article.categoryId||'').toLowerCase();
  if(id==='agriculture')return 'agriculture';
  if(id==='sports')return 'sports';
  if(id==='tourism')return 'tourism';
  if(id==='culture')return 'culture';
  if(id==='social')return 'social';
  if(id==='city-village')return 'politics';
  return 'local';
}
function icon(theme,accent,accent2){
  const common='fill="none" stroke="'+accent+'" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"';
  if(theme==='education')return '<path '+common+' d="M125 255V142l98-57 98 57v113M158 255v-62h43v62m47 0v-62h43v62M223 85V54m0 0 60 17-60 17"/><path d="M108 274h230" stroke="'+accent2+'" stroke-width="8" stroke-linecap="round" opacity=".45"/>';
  if(theme==='economy')return '<rect x="112" y="100" width="235" height="150" rx="22" '+common+'/><path '+common+' d="M112 145h235M145 207h80m35 0h48"/><circle cx="315" cy="115" r="31" fill="'+accent+'" opacity=".18"/>';
  if(theme==='agriculture')return '<path '+common+' d="M226 280c0-83 8-144 8-196M230 174c-45-5-78-30-92-68 52-5 86 13 96 54M236 137c43-4 76-27 92-64-49-7-83 9-94 48"/><path d="M110 279c48-25 91-31 124-30 42 0 83 9 121 31" stroke="'+accent2+'" stroke-width="8" opacity=".42" fill="none"/>';
  if(theme==='sports')return '<circle cx="230" cy="174" r="91" '+common+'/><path '+common+' d="m230 113 42 31-16 49h-52l-16-49 42-31M188 144l-48-5m116 54 28 39m-80-39-28 39m96-88 46-5"/>';
  if(theme==='tourism')return '<circle cx="305" cy="93" r="35" fill="'+accent+'" opacity=".32"/><path '+common+' d="m91 268 91-119 57 67 50-72 88 124"/><path d="M88 268h292" stroke="'+accent2+'" stroke-width="8" stroke-linecap="round" opacity=".4"/>';
  if(theme==='incidents')return '<path '+common+' d="M229 72 355 283H103L229 72Z"/><path d="M229 141v70m0 32v2" stroke="'+accent2+'" stroke-width="13" stroke-linecap="round"/>';
  if(theme==='roads')return '<path '+common+' d="M148 286c32-62 53-127 81-204 29 77 50 142 83 204"/><path d="M230 91v35m0 30v40m0 31v45" stroke="'+accent2+'" stroke-width="8" stroke-linecap="round" opacity=".7"/>';
  if(theme==='weather')return '<circle cx="286" cy="105" r="49" fill="'+accent+'" opacity=".24"/><path '+common+' d="M132 211c0-37 29-67 66-67 25 0 47 13 59 33 9-6 20-9 31-9 31 0 56 25 56 56H132c-19 0-35-15-35-34s16-34 35-34"/><path d="m165 252-16 31m72-31-16 31m72-31-16 31" stroke="'+accent2+'" stroke-width="8" stroke-linecap="round" opacity=".65"/>';
  if(theme==='energy')return '<path '+common+' d="m248 64-88 127h68l-25 105 101-145h-70l14-87Z"/><circle cx="230" cy="180" r="128" stroke="'+accent2+'" stroke-width="4" opacity=".14" fill="none"/>';
  if(theme==='health')return '<path '+common+' d="M229 282s-105-61-105-133c0-39 27-69 63-69 20 0 35 9 42 25 8-16 24-25 43-25 37 0 64 30 64 69 0 72-107 133-107 133Z"/><path d="M154 181h45l14-30 24 61 19-42 11 11h42" stroke="'+accent2+'" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
  if(theme==='politics')return '<path '+common+' d="M112 147h235M135 147v108m55-108v108m78-108v108m55-108v108M103 268h252M117 126l113-55 112 55H117Z"/>';
  if(theme==='culture')return '<path '+common+' d="M118 103h89c24 0 40 12 40 38v132c-9-17-24-25-46-25h-83V103Zm224 0h-89c-24 0-40 12-40 38v132c9-17 24-25 46-25h83V103Z"/>';
  return '<path '+common+' d="M104 265h252M133 251V154l97-61 97 61v97M177 251v-69h106v69"/><path d="M118 111c35-27 73-40 112-40 44 0 83 13 116 41" stroke="'+accent2+'" stroke-width="6" opacity=".38" fill="none"/>';
}
async function generateAutoCover(article={},category={}){
  fs.mkdirSync(UPLOAD_DIR,{recursive:true});
  const themeKey=detectTheme(article,category),t=THEMES[themeKey]||THEMES.local;
  const key=crypto.createHash('sha1').update([text(article.title),text(article.lead),category.id||'',themeKey].join('|')).digest('hex').slice(0,16);
  const name='auto-cover-'+key+'.svg';
  const target=path.join(UPLOAD_DIR,name);
  if(fs.existsSync(target))return {image:'/uploads/'+name,imageWidth:1200,imageHeight:675,imageRatio:16/9,imageOrientation:'landscape',imageAuto:true,autoCoverTheme:themeKey};

  const svg=`<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="675"><stop stop-color="${t.bg1}"/><stop offset="1" stop-color="${t.bg2}"/></linearGradient>
    <radialGradient id="g"><stop stop-color="${t.accent}" stop-opacity=".24"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <circle cx="1040" cy="86" r="260" fill="url(#g)" filter="url(#blur)"/>
  <circle cx="165" cy="620" r="230" fill="url(#g)" opacity=".45" filter="url(#blur)"/>
  <g opacity=".13" stroke="${t.accent2}"><path d="M0 570h1200M0 590h1200M0 610h1200"/><path d="M870 0v675M910 0v675M950 0v675"/></g>
  <rect x="60" y="58" width="1080" height="559" rx="34" fill="#ffffff" fill-opacity=".018" stroke="#ffffff" stroke-opacity=".08"/>
  <g transform="translate(105 145)">${icon(themeKey,t.accent,t.accent2)}</g>
  <g transform="translate(590 170)">
    <path d="M0 0h430" stroke="${t.accent}" stroke-width="4" opacity=".8"/>
    <text x="430" y="68" text-anchor="end" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="4" fill="${t.accent2}">${t.label}</text>
    <text x="430" y="126" text-anchor="end" font-family="Arial, sans-serif" font-size="46" font-weight="800" letter-spacing="1" fill="#F5F0E8">NABEZ SARDO</text>
    <text x="430" y="167" text-anchor="end" font-family="Arial, sans-serif" font-size="17" font-weight="600" letter-spacing="3" fill="#ffffff" fill-opacity=".45">LOCAL NEWSROOM</text>
    <path d="M55 254h122l18-17 21 42 29-75 31 78 23-48 21 20h110" fill="none" stroke="${t.accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="246" cy="204" r="8" fill="${t.accent2}"/>
  </g>
  <text x="1090" y="582" text-anchor="end" font-family="Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="3" fill="#ffffff" fill-opacity=".35">AUTO NEWS COVER · 1200 × 675</text>
  </svg>`;
  fs.writeFileSync(target,svg,'utf8');
  return {image:'/uploads/'+name,imageWidth:1200,imageHeight:675,imageRatio:16/9,imageOrientation:'landscape',imageAuto:true,autoCoverTheme:themeKey};
}
module.exports={generateAutoCover,detectTheme};
